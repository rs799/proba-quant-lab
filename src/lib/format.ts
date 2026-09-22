/** Null-tolerant formatters: a missing measurement renders as NA, never as 0. */
export const NA = "—";

type N = number | null | undefined;
const has = (v: N): v is number => typeof v === "number" && Number.isFinite(v);

export function fmtUsd(v: N, digits?: number): string {
  if (!has(v)) return NA;
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(digits ?? 2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(digits ?? 1)}K`;
  if (abs >= 1) return `${sign}$${abs.toFixed(digits ?? 2)}`;
  return `${sign}$${abs.toFixed(digits ?? 4)}`;
}

export function fmtPrice(v: N): string {
  if (!has(v)) return NA;
  if (v >= 1000) return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

export function fmtPct(v: N, digits = 2, signed = true): string {
  if (!has(v)) return NA;
  const s = signed && v > 0 ? "+" : "";
  return `${s}${v.toFixed(digits)}%`;
}

export function fmtNum(v: N, digits = 2): string {
  if (!has(v)) return NA;
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtFixed(v: N, digits = 3): string {
  return has(v) ? v.toFixed(digits) : NA;
}

/** Probability in [0,1] rendered as a percentage. */
export function fmtProb(v: N, digits = 1): string {
  return has(v) ? `${(v * 100).toFixed(digits)}%` : NA;
}

export function fmtZ(v: N): string {
  if (!has(v)) return NA;
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}σ`;
}

export function fmtCompact(v: N): string {
  if (!has(v)) return NA;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

export function signClass(v: N, threshold = 0): string {
  if (!has(v)) return "text-text-3";
  if (v > threshold) return "text-pos";
  if (v < -threshold) return "text-neg";
  return "text-text-2";
}

export function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function relTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return NA;
  const d = Math.max(0, now - t);
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
