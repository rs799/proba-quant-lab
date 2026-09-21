import { cn } from "@/lib/utils";
import type { DataState, SignalStatus, EdgeStatus } from "@/lib/data";
import { signClass } from "@/lib/format";
import type { ReactNode } from "react";

/* ---------------------------------------------------------- Panel / Section */
export function Panel({ title, right, children, className, dense }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; dense?: boolean }) {
  return (
    <section className={cn("panel flex flex-col min-w-0", className)}>
      {title && (
        <header className="flex items-center justify-between border-b px-3 h-8 shrink-0">
          <h3 className="label-xs">{title}</h3>
          {right && <div className="text-text-3 text-[11px] flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={cn("min-w-0", dense ? "" : "p-3")}>{children}</div>
    </section>
  );
}

export function ResearchSection({ title, right, children, className }: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t pt-3 mt-4 first:border-t-0 first:mt-0 first:pt-0", className)}>
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-text-2">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------- Metric strip */
export interface Metric { label: string; value: string; delta?: number; sub?: string; tone?: "pos" | "neg" | "neutral" }
export function MetricStrip({ items, columns }: { items: Metric[]; columns?: number }) {
  return (
    <div className="panel grid divide-x divide-border" style={{ gridTemplateColumns: `repeat(${columns ?? items.length}, minmax(0, 1fr))` }}>
      {items.map((m) => (
        <div key={m.label} className="px-3 py-2 min-w-0">
          <div className="label-xs truncate">{m.label}</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={cn("num text-[14px] text-text-1", m.tone === "pos" && "text-pos", m.tone === "neg" && "text-neg")}>{m.value}</span>
            {m.delta !== undefined && <span className={cn("num text-[11px]", signClass(m.delta))}>{m.delta > 0 ? "+" : ""}{m.delta.toFixed(2)}%</span>}
            {m.sub && <span className="text-[11px] text-text-3 truncate">{m.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- KV list */
export function KV({ rows, className }: { rows: { k: string; v: ReactNode; tone?: "pos" | "neg" | "neutral" | "warn" | undefined }[]; className?: string }) {
  return (
    <dl className={cn("text-[12px]", className)}>
      {rows.map((r) => (
        <div key={r.k} className="flex justify-between gap-4 py-[3px] border-b border-border/60 last:border-b-0">
          <dt className="text-text-3">{r.k}</dt>
          <dd className={cn("num text-text-1 text-right", r.tone === "pos" && "text-pos", r.tone === "neg" && "text-neg", r.tone === "warn" && "text-warn")}>{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------- Tags */
const statusTone: Record<SignalStatus, string> = {
  "Positive Expected Alpha": "text-pos border-pos/40",
  Signal: "text-pos/80 border-pos/25",
  Watch: "text-info border-info/40",
  Research: "text-text-2 border-border-strong",
  Deteriorating: "text-warn border-warn/40",
  Avoid: "text-neg border-neg/40",
};
export function SignalTag({ s }: { s: SignalStatus }) {
  return <span className={cn("inline-block border px-1.5 py-px text-[10px] tracking-wide uppercase whitespace-nowrap rounded-sm", statusTone[s])}>{s}</span>;
}

const edgeTone: Record<EdgeStatus, string> = {
  RESEARCH: "text-text-2 border-border-strong",
  VALIDATED: "text-info border-info/40",
  ACTIVE: "text-pos border-pos/40",
  DEGRADING: "text-warn border-warn/40",
  SUSPENDED: "text-neg border-neg/40",
  RETIRED: "text-text-3 border-border",
};
export function EdgeTag({ s }: { s: EdgeStatus }) {
  return <span className={cn("inline-block border px-1.5 py-px text-[10px] tracking-wide rounded-sm", edgeTone[s])}>{s}</span>;
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "pos" | "neg" | "warn" | "info" | "neutral" }) {
  const t = { pos: "text-pos border-pos/40", neg: "text-neg border-neg/40", warn: "text-warn border-warn/40", info: "text-info border-info/40", neutral: "text-text-2 border-border-strong" }[tone];
  return <span className={cn("inline-block border px-1.5 py-px text-[10px] tracking-wide uppercase rounded-sm whitespace-nowrap", t)}>{children}</span>;
}

/* ---------------------------------------------------------- Data state */
export const dataStateLabel: Record<DataState, string> = {
  ok: "OK", no_data: "NO DATA", stale: "STALE DATA", api_error: "API ERROR", not_applicable: "N/A",
};
export function DataQualityIndicator({ state, label }: { state: DataState; label?: string }) {
  const tone = { ok: "bg-pos", no_data: "bg-text-3", stale: "bg-warn", api_error: "bg-neg", not_applicable: "bg-border-strong" }[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-wide text-text-2">
      <span className={cn("size-1.5 rounded-full", tone)} />
      {label ?? dataStateLabel[state]}
    </span>
  );
}

export function Unavailable({ reason = "Awaiting ingestion", className }: { reason?: string; className?: string }) {
  return (
    <div className={cn("border border-dashed border-border-strong/70 text-text-3 text-[11px] tracking-wide uppercase flex items-center justify-center py-6", className)}>
      Data unavailable — {reason}
    </div>
  );
}

/* ---------------------------------------------------------- Horizontal bar */
export function HBar({ value, max = 1, tone = "info", height = 4 }: { value: number; max?: number; tone?: "pos" | "neg" | "info" | "neutral" | "warn"; height?: number }) {
  const w = Math.min(100, Math.max(0, (Math.abs(value) / max) * 100));
  return (
    <div className="w-full bg-surface-3 rounded-sm" style={{ height }}>
      <div className={cn("h-full rounded-sm", { pos: "bg-pos", neg: "bg-neg", info: "bg-info", neutral: "bg-text-3", warn: "bg-warn" }[tone])} style={{ width: `${w}%` }} />
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h1 className="text-[15px] font-semibold text-text-1 tracking-tight">{title}</h1>
        {sub && <p className="text-[11px] text-text-3 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
