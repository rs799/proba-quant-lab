import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart,
  ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { fmtCompact, fmtPct, fmtPrice } from "@/lib/format";
import type { FactorContribution, Quantiles } from "@/lib/data";
import { data as D } from "@/lib/data";

const AXIS = { fontSize: 10, fill: "var(--text-3)", fontFamily: "var(--font-mono)" } as const;
const GRID = "var(--border)";

function TT({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border-strong px-2 py-1.5 text-[11px] shadow-none">
      <div className="text-text-3 mb-0.5">{label instanceof Date ? label.toISOString().slice(0, 10) : typeof label === "number" && label > 1e12 ? new Date(label).toISOString().slice(0, 10) : label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4"><span className="text-text-2">{p.name}</span><span className="num text-text-1">{fmt ? fmt(p.value, p.dataKey) : p.value}</span></div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- Sparkline */
export function Sparkline({ data, tone = "neutral", height = 28 }: { data: number[]; tone?: "pos" | "neg" | "neutral"; height?: number }) {
  const series = data.map((v, i) => ({ i, v }));
  const c = tone === "pos" ? "var(--pos)" : tone === "neg" ? "var(--neg)" : "var(--text-2)";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={series} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="v" stroke={c} strokeWidth={1} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------------------------------------------------- Price chart */
const TF = ["1H", "4H", "1D", "1W", "1M"] as const;
export function PriceChart({ symbol, height = 300 }: { symbol: string; height?: number }) {
  const [tf, setTf] = useState<(typeof TF)[number]>("1D");
  const [overlays, setOverlays] = useState({ regime: true, volume: true, smartMoney: false, unlocks: true });
  const raw = useMemo(() => D.priceSeries(symbol), [symbol]);
  const series = useMemo(() => {
    const step = { "1H": 1, "4H": 1, "1D": 1, "1W": 7, "1M": 30 }[tf];
    return raw.filter((_, i) => i % step === 0);
  }, [raw, tf]);
  const regimes = useMemo(() => {
    const spans: { x1: number; x2: number; r: number }[] = [];
    for (const p of series) {
      const last = spans[spans.length - 1];
      if (last && last.r === p.regime) last.x2 = p.t; else spans.push({ x1: p.t, x2: p.t, r: p.regime });
    }
    return spans;
  }, [series]);
  const unlockT = series[Math.floor(series.length * 0.82)]?.t;
  const intraday = tf === "1H" || tf === "4H";

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex border border-border rounded-sm overflow-hidden">
          {TF.map((t) => (
            <button key={t} onClick={() => setTf(t)} className={cn("px-2 h-6 text-[10px] num transition-colors", tf === t ? "bg-surface-3 text-text-1" : "text-text-3 hover:text-text-1")}>{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-text-3">
          {(["regime", "volume", "smartMoney", "unlocks"] as const).map((k) => (
            <label key={k} className="inline-flex items-center gap-1 cursor-pointer hover:text-text-1">
              <input type="checkbox" className="accent-primary" checked={overlays[k]} onChange={() => setOverlays((o) => ({ ...o, [k]: !o[k] }))} />
              {{ regime: "Regime", volume: "Volume", smartMoney: "Smart-money accum.", unlocks: "Unlocks" }[k]}
            </label>
          ))}
        </div>
        {intraday && <span className="ml-auto text-[10px] text-warn uppercase tracking-wide">Intraday bars: awaiting ingestion — showing daily</span>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
          {overlays.regime && regimes.map((s, i) => (
            <ReferenceArea key={i} x1={s.x1} x2={s.x2} yAxisId="p" fill={s.r === 0 ? "var(--pos)" : s.r === 1 ? "var(--neutral)" : "var(--neg)"} fillOpacity={0.05} strokeOpacity={0} />
          ))}
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={(v) => new Date(v).toISOString().slice(5, 10)} minTickGap={40} />
          <YAxis yAxisId="p" orientation="right" tick={AXIS} tickLine={false} axisLine={false} width={64} tickFormatter={(v) => fmtPrice(v)} domain={["auto", "auto"]} />
          {overlays.volume && <YAxis yAxisId="v" hide domain={[0, (max: number) => max * 4]} />}
          {overlays.volume && <Bar yAxisId="v" dataKey="volume" name="Volume" fill="var(--surface-3)" isAnimationActive={false} />}
          <Line yAxisId="p" type="linear" dataKey="close" name="Close" stroke="var(--text-1)" strokeWidth={1} dot={false} isAnimationActive={false} />
          {overlays.unlocks && unlockT && <ReferenceLine yAxisId="p" x={unlockT} stroke="var(--warn)" strokeDasharray="3 3" label={{ value: "Unlock", fill: "var(--warn)", fontSize: 9, position: "insideTopLeft" }} />}
          <Tooltip content={<TT fmt={(v: number, k: string) => (k === "volume" ? fmtCompact(v) : fmtPrice(v))} />} cursor={{ stroke: "var(--border-strong)" }} />
        </ComposedChart>
      </ResponsiveContainer>
      {overlays.smartMoney && <div className="text-[10px] text-text-3 mt-1 uppercase tracking-wide">Smart-money accumulation overlay: awaiting on-chain ingestion</div>}
    </div>
  );
}

/* ---------------------------------------------------------- Factor contribution */
export function FactorContributionChart({ items, height }: { items: FactorContribution[]; height?: number }) {
  const max = Math.max(...items.map((i) => Math.abs(i.contribution)));
  return (
    <div className="space-y-1.5">
      {items.map((it) => {
        const pct = (Math.abs(it.contribution) / max) * 50;
        const pos = it.contribution >= 0;
        return (
          <div key={it.factor} className="grid grid-cols-[120px_1fr_56px] items-center gap-2 text-[11px]">
            <span className="text-text-2 truncate">{it.factor}</span>
            <div className="relative h-3 bg-surface-2">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border-strong" />
              <div className={cn("absolute inset-y-0.5", pos ? "bg-pos/80" : "bg-neg/80")} style={pos ? { left: "50%", width: `${pct}%` } : { right: "50%", width: `${pct}%` }} />
            </div>
            <span className={cn("num text-right", pos ? "text-pos" : "text-neg")}>{it.contribution > 0 ? "+" : ""}{it.contribution.toFixed(2)}</span>
          </div>
        );
      })}
      {height === undefined && <div className="text-[10px] text-text-3 pt-1">Contribution to model logit (standardised). Signed by direction of effect.</div>}
    </div>
  );
}

/* ---------------------------------------------------------- Probability distribution */
export function ProbabilityDistribution({ q, label, unit = "%" }: { q: Quantiles; label: string; unit?: string }) {
  const lo = Math.min(q.p10, -5), hi = Math.max(q.p90, 5);
  const span = hi - lo;
  const x = (v: number) => ((v - lo) / span) * 100;
  return (
    <div>
      <div className="flex justify-between text-[10px] text-text-3 mb-1"><span className="uppercase tracking-wide">{label}</span><span className="num">P10 – P90</span></div>
      <div className="relative h-5">
        <div className="absolute top-2 h-1 bg-surface-3" style={{ left: `${x(q.p10)}%`, right: `${100 - x(q.p90)}%` }} />
        <div className="absolute top-1 h-3 bg-info/30 border-x border-info/60" style={{ left: `${x(q.p25)}%`, right: `${100 - x(q.p75)}%` }} />
        <div className="absolute top-0 h-5 w-px bg-text-1" style={{ left: `${x(q.p50)}%` }} />
        <div className="absolute top-0 h-5 w-px bg-border-strong" style={{ left: `${x(0)}%` }} />
      </div>
      <div className="grid grid-cols-5 mt-1 text-[10.5px] num">
        {(["p10", "p25", "p50", "p75", "p90"] as const).map((k) => (
          <div key={k} className="text-center">
            <div className="text-text-3">{k.toUpperCase()}</div>
            <div className={cn(q[k] > 0 ? "text-pos" : q[k] < 0 ? "text-neg" : "text-text-1", k === "p50" && "font-semibold")}>{fmtPct(q[k], 0)}{unit === "%" ? "" : unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Regime probability bars */
export function RegimeIndicator({ probabilities, current }: { probabilities: { regime: string; p: number }[]; current: string }) {
  return (
    <div className="space-y-1">
      {probabilities.map((p) => (
        <div key={p.regime} className="grid grid-cols-[150px_1fr_44px] items-center gap-2 text-[11px]">
          <span className={cn("truncate", p.regime === current ? "text-text-1" : "text-text-3")}>{p.regime}</span>
          <div className="h-1.5 bg-surface-3"><div className={cn("h-full", p.regime === current ? "bg-info" : "bg-text-3/60")} style={{ width: `${p.p * 100}%` }} /></div>
          <span className="num text-right text-text-2">{(p.p * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- Generic small line / equity */
export function EquityCurve({ series, height = 180, segments }: { series: { t: string; v: number; dd?: number }[]; height?: number; segments?: { from: string; to: string; label: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        {segments?.map((s, i) => (
          <ReferenceArea key={s.label} x1={s.from} x2={s.to} fill={i % 2 ? "var(--surface-3)" : "transparent"} fillOpacity={0.35} strokeOpacity={0} label={{ value: s.label, fill: "var(--text-3)", fontSize: 9, position: "insideTop" }} />
        ))}
        <XAxis dataKey="t" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={50} />
        <YAxis orientation="right" tick={AXIS} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${v.toFixed(0)}`} domain={["auto", "auto"]} />
        <Area type="linear" dataKey="v" name="Equity" stroke="var(--text-1)" strokeWidth={1} fill="var(--surface-3)" fillOpacity={0.4} isAnimationActive={false} />
        <Tooltip content={<TT fmt={(v: number) => v.toFixed(2)} />} cursor={{ stroke: "var(--border-strong)" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DrawdownCurve({ series, height = 100 }: { series: { t: string; dd: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="t" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={50} />
        <YAxis orientation="right" tick={AXIS} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${v.toFixed(0)}%`} />
        <Area type="linear" dataKey="dd" name="Drawdown" stroke="var(--neg)" strokeWidth={1} fill="var(--neg)" fillOpacity={0.15} isAnimationActive={false} />
        <Tooltip content={<TT fmt={(v: number) => fmtPct(v)} />} cursor={{ stroke: "var(--border-strong)" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SignedBars({ data, xKey, yKey, height = 140, fmt }: { data: any[]; xKey: string; yKey: string; height?: number; fmt?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" />
        <YAxis orientation="right" tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => (fmt ? fmt(v) : v)} />
        <ReferenceLine y={0} stroke="var(--border-strong)" />
        <Bar dataKey={yKey} isAnimationActive={false}>
          {data.map((d, i) => <Cell key={i} fill={d[yKey] >= 0 ? "var(--pos)" : "var(--neg)"} fillOpacity={0.8} />)}
        </Bar>
        <Tooltip content={<TT fmt={(v: number) => (fmt ? fmt(v) : String(v))} />} cursor={{ fill: "var(--surface-3)", fillOpacity: 0.4 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}
