export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const json = await res.json().catch(() => ({ success: false, error: "Server error" }));
  if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data;
}
export const fmtMoney = (v: unknown, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur || "USD", maximumFractionDigits: 0 }).format(Number(v || 0));
export const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
