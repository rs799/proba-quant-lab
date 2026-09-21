export function fmtUsd(v: number, digits?: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(digits ?? 2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(digits ?? 1)}K`;
  if (abs >= 1) return `${sign}$${abs.toFixed(digits ?? 2)}`;
  return `${sign}$${abs.toFixed(digits ?? 4)}`;
}

export function fmtPrice(v: number): string {
  if (v >= 1000) return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

export function fmtPct(v: number, digits = 2, signed = true): string {
  const s = signed && v > 0 ? "+" : "";
  return `${s}${v.toFixed(digits)}%`;
}

export function fmtNum(v: number, digits = 2): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtZ(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}σ`;
}

export function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

export function signClass(v: number, threshold = 0): string {
  if (v > threshold) return "text-pos";
  if (v < -threshold) return "text-neg";
  return "text-text-2";
}

export function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function relTime(iso: string, now = Date.now()): string {
  const d = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
