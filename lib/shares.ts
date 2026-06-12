// Tiny wrapper around the Supabase counter RPCs (no SDK dependency — just REST).
// The counter lives in a shared "personalprojects" DB, namespaced by app+metric.

const APP = "osrs-hours-to-max";
const METRIC = "shares";

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function rpc(fn: "get_counter" | "increment_counter"): Promise<number | null> {
  const sb = supabase();
  if (!sb) return null;
  try {
    const res = await fetch(`${sb.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: sb.key,
        Authorization: `Bearer ${sb.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_app: APP, p_metric: METRIC }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const value = await res.json();
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function getShareCount(): Promise<number | null> {
  return rpc("get_counter");
}

export function incrementShareCount(): Promise<number | null> {
  return rpc("increment_counter");
}
