import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { KV, PageHeader, Panel, Tag } from "@/components/terminal/primitives";
import { DrawdownCurve, EquityCurve, SignedBars } from "@/components/terminal/charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/backtests")({
  head: () => ({
    meta: [
      { title: "Backtest Lab — crypto-analyst" },
      { name: "description", content: "Define universe, entry/exit rules, costs and constraints; evaluate with strict in-sample / validation / out-of-sample separation." },
      { property: "og:title", content: "Backtest Lab — crypto-analyst" },
      { property: "og:description", content: "Professional backtesting with IS / validation / OOS separation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Backtests,
});

const STAGES = ["QUEUED", "INGESTING DATA", "NORMALIZING", "CALCULATING FEATURES", "RUNNING MODEL", "VALIDATING", "COMPLETE"] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label-xs block mb-1">{label}</span>{children}</label>;
}
const inp = "w-full h-6 bg-surface-2 border border-border px-2 text-[11px] num text-text-1 rounded-sm outline-none focus:border-primary/60";

// DEV MOCK result generator — deterministic, not a real backtest.
function makeResult(seed: number) {
  let s = seed;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const months: { t: string; v: number; dd: number; seg: "IS" | "VAL" | "OOS" }[] = [];
  let eq = 100, peak = 100;
  const start = new Date("2021-01-01");
  for (let i = 0; i < 69; i++) {
    const seg = i < 41 ? "IS" : i < 55 ? "VAL" : "OOS";
    const drift = seg === "IS" ? 0.028 : seg === "VAL" ? 0.016 : 0.011;
    eq *= 1 + drift + (rnd() - 0.5) * 0.16;
    peak = Math.max(peak, eq);
    const d = new Date(start); d.setMonth(d.getMonth() + i);
    months.push({ t: d.toISOString().slice(0, 7), v: eq, dd: ((eq - peak) / peak) * 100, seg });
  }
  const seg = (k: "IS" | "VAL" | "OOS") => {
    const m = months.filter((x) => x.seg === k);
    const rets = m.map((x, i) => (i === 0 ? 0 : x.v / m[i - 1]!.v - 1)).slice(1);
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length);
    const dsd = Math.sqrt(rets.filter((r) => r < 0).reduce((a, b) => a + b * b, 0) / rets.length);
    const cagr = ((m[m.length - 1]!.v / m[0]!.v) ** (12 / m.length) - 1) * 100;
    const mdd = Math.min(...m.map((x) => x.dd));
    return { cagr, sharpe: (mean / sd) * Math.sqrt(12), sortino: (mean / dsd) * Math.sqrt(12), calmar: cagr / -mdd, mdd, win: rets.filter((r) => r > 0).length / rets.length, pf: rets.filter((r) => r > 0).reduce((a, b) => a + b, 0) / -rets.filter((r) => r < 0).reduce((a, b) => a + b, 0), trades: Math.floor(m.length * 18), turnover: 0.9 + rnd() * 0.6, hold: 21 + rnd() * 10, exposure: 0.6 + rnd() * 0.3 };
  };
  return { months, IS: seg("IS"), VAL: seg("VAL"), OOS: seg("OOS"),
    monthly: months.slice(-24).map((m, i, a) => ({ m: m.t.slice(2), r: i === 0 ? 0 : (m.v / a[i - 1]!.v - 1) * 100 })),
    breakdown: {
      regime: [["Risk-On / Exp.", 3.1], ["Risk-On / Late", 1.2], ["Neutral", 0.4], ["Risk-Off / Con.", -1.8], ["Capitulation", -3.4]],
      mcap: [["Large", 0.9], ["Mid", 2.4], ["Small", 1.1]],
      sector: [["L1", 1.4], ["DeFi", 2.8], ["Infra", 0.7], ["AI", 1.9], ["Other", -0.3]],
      side: [["Long", 2.1], ["Short", -0.2]],
    } as Record<string, [string, number][]>,
  };
}

function Backtests() {
  const [stage, setStage] = useState<number>(-1);
  const [seed, setSeed] = useState(7);
  const res = useMemo(() => makeResult(seed), [seed]);
  const running = stage >= 0 && stage < STAGES.length - 1;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setStage((s) => s + 1), 500);
    return () => clearTimeout(id);
  }, [stage, running]);

  const done = stage === STAGES.length - 1;
  const overfit = res.OOS.sharpe / res.IS.sharpe < 0.5;

  return (
    <div>
      <PageHeader title="Backtest Lab" sub="A high historical return is not evidence. Only the out-of-sample segment is informative about live expectations." />
      <div className="grid grid-cols-12 gap-3">
        <Panel title="Definition" className="col-span-12 xl:col-span-3">
          <div className="space-y-2.5">
            <Field label="Universe"><select className={inp}><option>Top 300 ex-stables, liq &gt; $2M</option><option>Top 100</option><option>Mid-cap $100M–$2B</option><option>Perp-listed</option></select></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="From"><input className={inp} defaultValue="2021-01-01" /></Field>
              <Field label="To"><input className={inp} defaultValue="2026-09-20" /></Field>
            </div>
            <Field label="Entry condition"><textarea className={cn(inp, "h-14 py-1 resize-none")} defaultValue={"sm_flow_z > 2.0\nAND rel_strength_z > 0.5\nAND regime IN (RiskOn_Exp, RiskOn_Late)"} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Holding period"><input className={inp} defaultValue="30D" /></Field>
              <Field label="Exit"><select className={inp}><option>Time or −20% stop</option><option>Time only</option><option>Signal decay</option></select></Field>
              <Field label="Fees (bps)"><input className={inp} defaultValue="10" /></Field>
              <Field label="Slippage (bps)"><input className={inp} defaultValue="25" /></Field>
              <Field label="Max % of ADV"><input className={inp} defaultValue="2.0" /></Field>
              <Field label="Sizing"><select className={inp}><option>Inverse vol</option><option>Equal weight</option><option>Kelly / 4</option></select></Field>
              <Field label="Max positions"><input className={inp} defaultValue="20" /></Field>
              <Field label="Max single weight"><input className={inp} defaultValue="8%" /></Field>
            </div>
            <Field label="Split (IS / VAL / OOS)"><input className={inp} defaultValue="60 / 20 / 20 — chronological" readOnly /></Field>
            <button onClick={() => { setSeed((x) => x + 1); setStage(0); }} disabled={running} className="w-full h-7 bg-primary text-primary-foreground text-[11px] font-medium tracking-wide uppercase rounded-sm disabled:opacity-50 transition-opacity">Run backtest</button>
          </div>
          {stage >= 0 && (
            <ol className="mt-3 space-y-1">
              {STAGES.map((s, i) => (
                <li key={s} className={cn("flex items-center gap-2 text-[10px] tracking-wide", i < stage ? "text-text-3" : i === stage ? "text-text-1" : "text-text-3/50")}>
                  <span className={cn("size-1.5 rounded-full", i < stage ? "bg-pos" : i === stage ? (done ? "bg-pos" : "bg-info animate-pulse") : "bg-border-strong")} />{s}
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <div className="col-span-12 xl:col-span-9 space-y-3">
          {!done ? (
            <div className="panel h-64 flex items-center justify-center text-[11px] text-text-3 uppercase tracking-wide">{running ? STAGES[stage] : "No run — define a strategy and run"}</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {(["IS", "VAL", "OOS"] as const).map((k) => {
                  const r = res[k];
                  return (
                    <Panel key={k} title={{ IS: "In-sample · 2021-01 → 2024-05", VAL: "Validation · 2024-06 → 2025-07", OOS: "Out-of-sample · 2025-08 → 2026-09" }[k]} className={cn(k === "OOS" && (overfit ? "border-neg/40" : "border-pos/40"))} right={k === "OOS" ? <Tag tone={overfit ? "neg" : "pos"}>{overfit ? "Overfit risk" : "Consistent"}</Tag> : undefined}>
                      <div className="grid grid-cols-3 gap-y-2 text-[11px]">
                        <S k="CAGR" v={`${r.cagr.toFixed(1)}%`} tone={r.cagr} big />
                        <S k="Sharpe" v={r.sharpe.toFixed(2)} big />
                        <S k="Sortino" v={r.sortino.toFixed(2)} />
                        <S k="Calmar" v={r.calmar.toFixed(2)} />
                        <S k="Max DD" v={`${r.mdd.toFixed(1)}%`} tone={-1} />
                        <S k="Win rate" v={`${(r.win * 100).toFixed(0)}%`} />
                        <S k="Profit factor" v={r.pf.toFixed(2)} />
                        <S k="Turnover" v={`${(r.turnover * 100).toFixed(0)}%`} />
                        <S k="Trades" v={r.trades.toLocaleString()} />
                        <S k="Avg hold" v={`${r.hold.toFixed(0)}D`} />
                        <S k="Exposure" v={`${(r.exposure * 100).toFixed(0)}%`} />
                      </div>
                    </Panel>
                  );
                })}
              </div>
              <Panel title="Equity curve (log-linear, net of costs)">
                <EquityCurve series={res.months} height={200} segments={[{ from: "2021-01", to: "2024-05", label: "IN-SAMPLE" }, { from: "2024-06", to: "2025-07", label: "VALIDATION" }, { from: "2025-08", to: "2026-09", label: "OUT-OF-SAMPLE" }]} />
                <DrawdownCurve series={res.months} height={90} />
              </Panel>
              <div className="grid grid-cols-12 gap-3">
                <Panel title="Monthly returns (last 24M)" className="col-span-12 lg:col-span-6">
                  <SignedBars data={res.monthly} xKey="m" yKey="r" fmt={(v) => `${v.toFixed(1)}%`} height={150} />
                </Panel>
                <Panel title="Return distribution (monthly, OOS)" className="col-span-12 lg:col-span-6">
                  <KV rows={[
                    { k: "P10 / P25", v: `${(res.OOS.mdd * 0.25).toFixed(1)}% / ${(res.OOS.mdd * 0.1).toFixed(1)}%` },
                    { k: "Median", v: `+${(res.OOS.cagr / 12).toFixed(2)}%`, tone: "pos" },
                    { k: "P75 / P90", v: `+${(res.OOS.cagr / 5).toFixed(1)}% / +${(res.OOS.cagr / 3).toFixed(1)}%` },
                    { k: "Skew", v: "0.42" },
                    { k: "Excess kurtosis", v: "1.87" },
                    { k: "Worst month", v: `${res.OOS.mdd.toFixed(1)}%`, tone: "neg" },
                  ]} />
                </Panel>
                {Object.entries(res.breakdown).map(([k, rows]) => (
                  <Panel key={k} title={`${{ regime: "Regime", mcap: "Market-cap", sector: "Sector", side: "Long / short" }[k]} breakdown (avg monthly %)`} className="col-span-6 lg:col-span-3">
                    <KV rows={rows.map(([n, v]) => ({ k: n, v: `${v > 0 ? "+" : ""}${v.toFixed(1)}%`, tone: v > 0 ? "pos" : "neg" }))} />
                  </Panel>
                ))}
              </div>
              <Panel title="Validation notes">
                <ul className="text-[11.5px] text-text-2 space-y-1">
                  <li>· OOS Sharpe retains {((res.OOS.sharpe / res.IS.sharpe) * 100).toFixed(0)}% of in-sample Sharpe. Threshold for promotion: ≥ 50%.</li>
                  <li>· Returns concentrate in Risk-On regimes; strategy carries explicit regime dependence.</li>
                  <li>· Costs assumed 35 bps round-trip; at 2% ADV participation capacity is approximately $18M.</li>
                  <li>· Parameter sensitivity (±25% on thresholds) not yet run — required before registry entry.</li>
                </ul>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function S({ k, v, tone, big }: { k: string; v: string; tone?: number; big?: boolean }) {
  return <div><div className="text-[10px] text-text-3">{k}</div><div className={cn("num text-text-1 mt-0.5", big ? "text-[15px]" : "text-[12px]", tone !== undefined && tone > 0 && "text-pos", tone !== undefined && tone < 0 && "text-neg")}>{v}</div></div>;
}
