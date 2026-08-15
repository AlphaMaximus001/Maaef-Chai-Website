/*
 * Live presence. Each open tab heartbeats with a random session id; the id
 * is written into a sorted set scored by timestamp, anything older than the
 * window is dropped, and the remaining members are the people here now.
 *
 * Backed by Upstash Redis over its REST API. Vercel injects credentials
 * under several different names depending on how the store was attached
 * (Marketplace Upstash, Vercel KV, or a hand-made Upstash project), and
 * some setups only provide the redis:// connection string — so resolve()
 * accepts all of them and derives REST credentials when it has to.
 *
 * Runs on nodejs, not edge, so process.env is read at request time. Under
 * the edge runtime Next inlines process.env at build time, which means a
 * store attached after the build would never be seen.
 *
 * The count is never invented: with nothing configured, or the store
 * unreachable, this returns null and the counter renders nothing.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "nautapri:presence";
const WINDOW_MS = 40_000; // present for 40s after the last beat (~3 missed)
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const noStore = { "cache-control": "no-store, max-age=0" };

/* find REST credentials under whichever names this deployment happens to use */
function resolve() {
  const e = process.env;

  const pairs = [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    ["REDIS_REST_API_URL", "REDIS_REST_API_TOKEN"],
    ["STORAGE_REST_API_URL", "STORAGE_REST_API_TOKEN"],
  ];
  for (const [u, t] of pairs) {
    if (e[u] && e[t]) return { url: e[u], token: e[t], via: u };
  }

  // any *_REST_API_URL with a matching *_REST_API_TOKEN (custom prefixes)
  for (const k of Object.keys(e)) {
    if (k.endsWith("_REST_API_URL")) {
      const t = k.replace(/_URL$/, "_TOKEN");
      if (e[k] && e[t]) return { url: e[k], token: e[t], via: k };
    }
  }

  // only a redis:// string? Upstash's REST host and token live inside it:
  // rediss://default:<token>@<host>:<port>  ->  https://<host> + <token>
  for (const k of ["REDIS_URL", "KV_URL", "UPSTASH_REDIS_URL", "STORAGE_URL"]) {
    const raw = e[k];
    if (!raw || !/^rediss?:\/\//.test(raw)) continue;
    try {
      const u = new URL(raw);
      if (u.password && u.hostname) {
        return { url: `https://${u.hostname}`, token: u.password, via: `${k} (derived)` };
      }
    } catch {
      /* not parseable, keep looking */
    }
  }

  return null;
}

async function pipeline(store, commands) {
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
  return res.json();
}

/* names only, never values — enough to see what the platform actually injected */
export async function GET(request) {
  if (!new URL(request.url).searchParams.has("debug")) {
    return Response.json({ ok: true }, { headers: noStore });
  }
  const store = resolve();
  const seen = Object.keys(process.env)
    .filter((k) => /REDIS|KV_|UPSTASH|STORAGE|REST_API/i.test(k))
    .sort();
  let reachable = null;
  let error = null;
  if (store) {
    try {
      await pipeline(store, [["PING"]]);
      reachable = true;
    } catch (err) {
      reachable = false;
      error = String(err.message || err).slice(0, 120);
    }
  }
  return Response.json(
    { configured: !!store, via: store?.via ?? null, reachable, error, matchingEnvNames: seen },
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
    const out = await pipeline(store, [
      ["ZREMRANGEBYSCORE", KEY, 0, now - WINDOW_MS],
      ["ZADD", KEY, now, id],
      ["EXPIRE", KEY, 300],
      ["ZCARD", KEY],
    ]);
    const raw = Array.isArray(out) ? out[3]?.result : null;
    const count = Number.isFinite(Number(raw)) ? Number(raw) : null;
    return Response.json({ count, configured: true }, { headers: noStore });
  } catch {
    // store unreachable — report nothing rather than a stale or invented count
    return Response.json({ count: null, configured: true }, { headers: noStore });
  }
}
