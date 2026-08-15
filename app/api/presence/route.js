/*
 * Live presence. Each open tab heartbeats with a random session id; the id
 * is written into a sorted set scored by timestamp, anything older than the
 * window is dropped, and the remaining members are the people here now.
 *
 * Two ways to reach a store, because it depends how the store was attached:
 *   REST — Upstash exposes an HTTP API, reachable with plain fetch.
 *   TCP  — most other Redis providers (and Vercel's own Redis) hand over
 *          only a redis:// connection string and speak the wire protocol.
 * resolve() works out which is available; REST is preferred when both are.
 *
 * Runs on nodejs, not edge: process.env must be read at request time (edge
 * inlines it at build time, so a store attached later is never seen), and
 * the TCP client needs real sockets.
 *
 * The count is never invented: with nothing configured, or the store
 * unreachable, this returns null and the counter renders nothing.
 */

import Redis from "ioredis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "nautapri:presence";
const WINDOW_MS = 40_000; // present for 40s after the last beat (~3 missed)
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const noStore = { "cache-control": "no-store, max-age=0" };

/* work out how this deployment can reach its store */
function resolve() {
  const e = process.env;

  const restPairs = [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    ["REDIS_REST_API_URL", "REDIS_REST_API_TOKEN"],
    ["STORAGE_REST_API_URL", "STORAGE_REST_API_TOKEN"],
  ];
  for (const [u, t] of restPairs) {
    if (e[u] && e[t]) return { kind: "rest", url: e[u], token: e[t], via: u };
  }
  for (const k of Object.keys(e)) {
    if (k.endsWith("_REST_API_URL")) {
      const t = k.replace(/_URL$/, "_TOKEN");
      if (e[k] && e[t]) return { kind: "rest", url: e[k], token: e[t], via: k };
    }
  }

  for (const k of ["REDIS_URL", "KV_URL", "UPSTASH_REDIS_URL", "STORAGE_URL", "REDIS_TLS_URL"]) {
    const raw = e[k];
    if (!raw || !/^rediss?:\/\//.test(raw)) continue;
    // an Upstash connection string also gives us REST credentials for free
    try {
      const u = new URL(raw);
      if (/upstash\.io$/i.test(u.hostname) && u.password) {
        return { kind: "rest", url: `https://${u.hostname}`, token: u.password, via: `${k} (derived)` };
      }
    } catch {
      /* fall through to the wire protocol */
    }
    return { kind: "tcp", url: raw, via: k };
  }

  return null;
}

/* ---- REST ------------------------------------------------------------- */

async function restPipeline(store, commands) {
  const res = await fetch(`${store.url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${store.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`store responded ${res.status}`);
  const out = await res.json();
  return (Array.isArray(out) ? out : []).map((r) => r?.result);
}

/* ---- TCP -------------------------------------------------------------- */

// reused across invocations on a warm instance so we are not reconnecting
// on every heartbeat
let client = null;
let clientUrl = null;

function tcpClient(url) {
  if (client && clientUrl === url && ["ready", "connect", "connecting"].includes(client.status)) {
    return client;
  }
  clientUrl = url;
  client = new Redis(url, {
    connectTimeout: 5000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: true,
    lazyConnect: false,
    retryStrategy: (times) => (times > 2 ? null : 200),
    // providers other than Upstash usually terminate TLS with their own chain
    ...(url.startsWith("rediss://") ? { tls: {} } : {}),
  });
  client.on("error", () => {
    /* swallow: a failed beat must not take the page down */
  });
  return client;
}

async function tcpPipeline(store, commands) {
  const c = tcpClient(store.url);
  const res = await c.pipeline(commands).exec();
  return (res || []).map(([err, val]) => {
    if (err) throw err;
    return val;
  });
}

/* ---- shared ----------------------------------------------------------- */

function run(store, commands) {
  return store.kind === "rest" ? restPipeline(store, commands) : tcpPipeline(store, commands);
}

/* names only, never values — enough to see what the platform injected */
export async function GET(request) {
  if (!new URL(request.url).searchParams.has("debug")) {
    return Response.json({ ok: true }, { headers: noStore });
  }
  const store = resolve();
  const seen = Object.keys(process.env)
    .filter((k) => /REDIS|KV_|UPSTASH|STORAGE|REST_API/i.test(k))
    .sort();

  let providerHint = null;
  if (store) {
    try {
      const h = new URL(store.url).hostname.split(".");
      providerHint = h.slice(-2).join("."); // e.g. upstash.io, redis-cloud.com
    } catch {
      /* leave null */
    }
  }

  let reachable = null;
  let error = null;
  if (store) {
    try {
      await run(store, [["ping"]]);
      reachable = true;
    } catch (err) {
      reachable = false;
      error = String(err?.message || err).slice(0, 140);
    }
  }

  return Response.json(
    {
      configured: !!store,
      transport: store?.kind ?? null,
      via: store?.via ?? null,
      providerHint,
      reachable,
      error,
      matchingEnvNames: seen,
    },
    { headers: noStore }
  );
}

export async function POST(request) {
  const store = resolve();
  if (!store) {
    return Response.json({ count: null, configured: false }, { headers: noStore });
  }

  let id = "";
  try {
    id = (await request.json())?.id ?? "";
  } catch {
    /* fall through to the validity check */
  }
  if (!ID_RE.test(id)) {
    return Response.json(
      { count: null, configured: true, error: "invalid id" },
      { status: 400, headers: noStore }
    );
  }

  const now = Date.now();
  try {
    const out = await run(store, [
      ["zremrangebyscore", KEY, 0, now - WINDOW_MS],
      ["zadd", KEY, now, id],
      ["expire", KEY, 300],
      ["zcard", KEY],
    ]);
    const raw = out?.[3];
    const count = Number.isFinite(Number(raw)) ? Number(raw) : null;
    return Response.json({ count, configured: true }, { headers: noStore });
  } catch {
    // store unreachable — report nothing rather than a stale or invented count
    return Response.json({ count: null, configured: true }, { headers: noStore });
  }
}
