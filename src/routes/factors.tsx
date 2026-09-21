import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { KV, PageHeader, Panel, Tag } from "@/components/terminal/primitives";
import { SignedBars } from "@/components/terminal/charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/factors")({
  head: () => ({
    meta: [
      { title: "Factor Lab — crypto-analyst" },
      { name: "description", content: "Test whether individual factors carry predictive information: IC, hit rate, Sharpe, regime stability and out-of-sample survival." },
      { property: "og:title", content: "Factor Lab — crypto-analyst" },
      { property: "og:description", content: "Single-factor predictive information tests with in-sample / out-of-sample separation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Factors,
});

const FACTORS = ["Momentum", "Relative Strength", "Smart Money Flow", "Holder Growth", "Liquidity", "Social Velocity", "Funding", "Open Interest", "TVL Growth", "Revenue Growth", "Unlock Risk"];
const TARGETS = ["+20% / 7D", "+50% / 30D", "+100% / 90D", "Forward Return 30D", "Excess Return vs BTC 30D", "Maximum Drawdown 30D"];

// Deterministic per (factor,target) stats — DEV MOCK, not calibrated.
function stats(f: string, t: string) {
  const h = [...(f + t)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const u = (k: number) => ((h >> k) % 1000) / 1000;
  const sign = f === "Funding" || f === "Unlock Risk" || f === "Social Velocity" ? -1 : 1;
  const isIC = sign * (0.02 + u(3) * 0.08);
  const decay = 0.35 + u(7) * 0.55;
  return {
    n: 2000 + Math.floor(u(1) * 20000),
    hit: 0.44 + u(2) * 0.16,
    avgRet: sign * (1 + u(4) * 9),
    medRet: sign * (0.2 + u(5) * 5),
    isIC, oosIC: isIC * decay,
    rankIC: isIC * 1.1, oosRankIC: isIC * decay * 1.05,
    isSharpe: 0.6 + u(6) * 1.6, oosSharpe: (0.6 + u(6) * 1.6) * decay,
    maxDD: -(8 + u(8) * 30),
    turnover: 0.2 + u(9) * 1.6,
    tstat: 1.2 + u(10) * 4,
    periods: [2021, 2022, 2023, 2024, 2025, 2026].map((y, i) => ({ y: String(y), ic: isIC * (0.3 + ((h >> (i + 11)) % 100) / 70) * (i === 1 ? -0.3 : 1) })),
    regimes: ["Risk-On / Exp.", "Risk-On / Late", "Neutral", "Risk-Off / Con.", "Capitulation"].map((r, i) => ({ r, ic: isIC * (1.4 - i * 0.4) })),
    deciles: Array.from({ length: 10 }, (_, i) => ({ d: `D${i + 1}`, ret: sign * ((i - 4.5) * (0.8 + u(12) * 1.2)) + (u(13) - 0.5) * 1.5 })),
  };
}

function Factors() {
  const [factor, setFactor] = useState("Smart Money Flow");
  const [target, setTarget] = useState("Excess Return vs BTC 30D");
  const s = useMemo(() => stats(factor, target), [factor, target]);
  const survives = s.oosIC / s.isIC > 0.5 && Math.abs(s.oosIC) > 0.02 && s.tstat > 2;

  return (
    <div>
      <PageHeader title="Factor Lab" sub="Does a single factor contain predictive information about a target, and does that information survive out of sample?" />
      <div className="grid grid-cols-12 gap-3">
        <Panel title="Specification" className="col-span-12 xl:col-span-3">
          <div className="label-xs mb-1">Factor</div>
          <div className="flex flex-col gap-px mb-3">
            {FACTORS.map((f) => (
              <button key={f} onClick={() => setFactor(f)} className={cn("text-left px-2 h-6 text-[11px] transition-colors rounded-sm", factor === f ? "bg-surface-3 text-text-1" : "text-text-2 hover:text-text-1 hover:bg-surface-2")}>{f}</button>
            ))}
          </div>
          <div className="label-xs mb-1">Target</div>
          <div className="flex flex-col gap-px mb-3">
            {TARGETS.map((t) => (
              <button key={t} onClick={() => setTarget(t)} className={cn("text-left px-2 h-6 text-[11px] transition-colors rounded-sm", target === t ? "bg-surface-3 text-text-1" : "text-text-2 hover:text-text-1 hover:bg-surface-2")}>{t}</button>
            ))}
          </div>
          <KV rows={[
            { k: "Universe", v: "Top 300, liq > $2M" },
            { k: "Period", v: "2021-01 → 2026-09" },
            { k: "IS / Val / OOS split", v: "60 / 20 / 20" },
            { k: "Rebalance", v: "Daily, xsec rank" },
            { k: "Neutralisation", v: "Mcap, chain" },
          ]} />
        </Panel>

        <div className="col-span-12 xl:col-span-9 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Panel title="In-sample (2021-01 → 2024-05)">
              <div className="grid grid-cols-3 gap-y-3 text-[11px]">
                <M k="Sample size" v={s.n.toLocaleString()} />
                <M k="Hit rate" v={`${(s.hit * 100).toFixed(1)}%`} />
                <M k="Avg fwd return" v={`${s.avgRet > 0 ? "+" : ""}${s.avgRet.toFixed(2)}%`} tone={s.avgRet} />
                <M k="Median return" v={`${s.medRet > 0 ? "+" : ""}${s.medRet.toFixed(2)}%`} tone={s.medRet} />
                <M k="IC" v={s.isIC.toFixed(3)} tone={s.isIC} big />
                <M k="Rank IC" v={s.rankIC.toFixed(3)} tone={s.rankIC} />
                <M k="Sharpe (D1–D10)" v={s.isSharpe.toFixed(2)} big />
                <M k="Max drawdown" v={`${s.maxDD.toFixed(1)}%`} tone={-1} />
                <M k="t-stat" v={s.tstat.toFixed(2)} />
              </div>
            </Panel>
            <Panel title="Out-of-sample (2025-07 → 2026-09)" className={cn(survives ? "border-pos/40" : "border-neg/40")} right={<Tag tone={survives ? "pos" : "neg"}>{survives ? "Survives OOS" : "Fails OOS"}</Tag>}>
              <div className="grid grid-cols-3 gap-y-3 text-[11px]">
                <M k="Sample size" v={Math.floor(s.n * 0.2).toLocaleString()} />
                <M k="Hit rate" v={`${(s.hit * 100 - (1 - s.oosIC / s.isIC) * 6).toFixed(1)}%`} />
                <M k="Avg fwd return" v={`${s.avgRet * (s.oosIC / s.isIC) > 0 ? "+" : ""}${(s.avgRet * (s.oosIC / s.isIC)).toFixed(2)}%`} tone={s.avgRet * s.oosIC} />
                <M k="IC decay" v={`${((1 - s.oosIC / s.isIC) * 100).toFixed(0)}%`} tone={-(1 - s.oosIC / s.isIC) + 0.5} />
                <M k="IC" v={s.oosIC.toFixed(3)} tone={s.oosIC} big />
                <M k="Rank IC" v={s.oosRankIC.toFixed(3)} tone={s.oosRankIC} />
                <M k="OOS Sharpe" v={s.oosSharpe.toFixed(2)} big />
                <M k="Turnover (ann.)" v={`${(s.turnover * 100).toFixed(0)}%`} />
                <M k="Significance" v={s.tstat > 2.5 ? "p < 0.01" : s.tstat > 2 ? "p < 0.05" : "n.s."} />
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Panel title="Decile forward return spread" right={<span>OOS</span>}>
              <SignedBars data={s.deciles} xKey="d" yKey="ret" fmt={(v) => `${v.toFixed(1)}%`} />
              <div className="text-[10px] text-text-3 mt-1">Monotonic across deciles: {isMonotonic(s.deciles.map((d) => d.ret)) ? "yes" : "no"}</div>
            </Panel>
            <Panel title="IC stability across periods">
              <SignedBars data={s.periods} xKey="y" yKey="ic" fmt={(v) => v.toFixed(3)} />
              <div className="text-[10px] text-text-3 mt-1">Years with sign flip: {s.periods.filter((p) => Math.sign(p.ic) !== Math.sign(s.isIC)).length} / {s.periods.length}</div>
            </Panel>
            <Panel title="IC stability across regimes">
              <SignedBars data={s.regimes} xKey="r" yKey="ic" fmt={(v) => v.toFixed(3)} />
              <div className="text-[10px] text-text-3 mt-1">Regime dependence: {Math.abs(s.regimes[0]!.ic - s.regimes[4]!.ic) > Math.abs(s.isIC) ? "high" : "moderate"}</div>
            </Panel>
          </div>

          <Panel title="Interpretation">
            <p className="text-[11.5px] text-text-2 leading-relaxed">
              In-sample IC of <span className="num text-text-1">{s.isIC.toFixed(3)}</span> decays to <span className="num text-text-1">{s.oosIC.toFixed(3)}</span> out of sample
              ({((s.oosIC / s.isIC) * 100).toFixed(0)}% retained). {survives
                ? "The factor retains a majority of its information content with a significant t-statistic; it is eligible for promotion to the Edge Registry as RESEARCH."
                : "Information content does not survive the holdout with sufficient confidence; treat as a candidate for further conditioning (regime, liquidity) rather than a standalone signal."}
              {" "}Results are gross of costs; apply the Backtest Lab with fees and slippage before drawing capacity conclusions.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function M({ k, v, tone, big }: { k: string; v: string; tone?: number; big?: boolean }) {
  return <div><div className="text-[10px] text-text-3">{k}</div><div className={cn("num text-text-1 mt-0.5", big ? "text-[16px]" : "text-[12.5px]", tone !== undefined && tone > 0 && "text-pos", tone !== undefined && tone < 0 && "text-neg")}>{v}</div></div>;
}
function isMonotonic(a: number[]) { let up = 0; for (let i = 1; i < a.length; i++) if (a[i]! > a[i - 1]!) up++; return up >= a.length - 3 || up <= 2; }
