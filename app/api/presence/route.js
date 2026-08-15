/*
 * Live presence. Each open tab heartbeats with a random session id; the id
 * is written into a sorted set scored by timestamp, anything older than the
 * window is dropped, and the remaining members are the people here now.
 *
 * Backed by Upstash Redis over its REST API (works from the edge runtime,
 * no SDK). Vercel's Upstash integration injects the KV_REST_API_* names;
 * a hand-rolled Upstash project uses UPSTASH_REDIS_REST_*. Either works.
 *
 * With no store configured the route reports configured:false and the
 * counter simply stays hidden — it never invents a number.
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const STORE_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const STORE_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

const KEY = "nautapri:presence";
const WINDOW_MS = 40_000; // present for 40s after the last beat (~3 missed)
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const noStore = { "cache-control": "no-store, max-age=0" };

async function pipeline(commands) {
  const res = await fetch(`${STORE_URL.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STORE_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`store responded ${res.status}`);
  return res.json();
}

export async function POST(request) {
  if (!STORE_URL || !STORE_TOKEN) {
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
    const out = await pipeline([
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
