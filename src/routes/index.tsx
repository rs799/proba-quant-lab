import { createFileRoute, Link } from "@tanstack/react-router";
import { data as D } from "@/lib/data";
import { fmtPct, fmtPrice, fmtUsd, fmtZ, signClass } from "@/lib/format";
import { KV, MetricStrip, Panel, SignalTag, Tag } from "@/components/terminal/primitives";
import { RegimeIndicator, FactorContributionChart } from "@/components/terminal/charts";
import { AlertFeed } from "@/components/terminal/AlertFeed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — crypto-analyst" },
      { name: "description", content: "Market regime, cross-sectional anomalies, active signals and pipeline health in one research cockpit." },
      { property: "og:title", content: "Overview — crypto-analyst" },
      { property: "og:description", content: "Market regime, anomalies, signals, model state and pipeline health." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const regime = D.regime.data!;
  const rows = D.discovery.data!;
  const alerts = D.alerts.data!.slice(0, 6);
  const providers = D.providers.data!;

  const unusual = [...rows].sort((a, b) => Math.abs(b.smartMoneyFlow) + Math.abs(b.relStrength) - (Math.abs(a.smartMoneyFlow) + Math.abs(a.relStrength))).slice(0, 8);
  const signals = rows.filter((r) => r.status === "Positive Expected Alpha" || r.status === "Signal").sort((a, b) => b.expReturn - a.expReturn).slice(0, 8);
  const risks = rows.filter((r) => r.status === "Deteriorating" || r.status === "Avoid").slice(0, 6);
  const unhealthy = providers.filter((p) => p.staleness !== "ok" && p.staleness !== "not_applicable");

  return (
    <div className="space-y-3">
      <MetricStrip items={D.marketStats.data!} />

      <div className="grid grid-cols-12 gap-3">
        {/* Regime */}
        <Panel title="Market regime" right={<span className="num">as of {D.MOCK_AS_OF.slice(11, 16)} UTC</span>} className="col-span-12 xl:col-span-5">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-[15px] text-text-1 font-medium">{regime.regime}</div>
              <div className="text-[10.5px] text-text-3 mt-0.5">Calibrated probability across 5 regime states (HMM, 2Y rolling fit)</div>
            </div>
            <div className="num text-[13px] text-text-1">P = {(regime.probabilities[0]!.p * 100).toFixed(0)}%</div>
          </div>
          <RegimeIndicator probabilities={regime.probabilities} current={regime.regime} />
          <div className="mt-4 label-xs mb-1.5">Drivers</div>
          <div className="grid grid-cols-1 gap-y-1 text-[11px]">
            {regime.drivers.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full shrink-0", d.direction === "pos" ? "bg-pos" : d.direction === "neg" ? "bg-neg" : "bg-text-3")} />
                <span className="text-text-2 w-28">{d.name}</span>
                <span className="text-text-1 num">{d.reading}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Regime metrics */}
        <Panel title="Regime statistics" className="col-span-12 xl:col-span-3">
          <KV rows={regime.metrics.map((m) => ({ k: m.label, v: <>{m.value}{m.delta !== undefined && <span className={cn("ml-2 text-[10px]", signClass(m.delta))}>{fmtPct(m.delta)}</span>}{m.note && <span className="ml-2 text-[10px] text-text-3">{m.note}</span>}</> }))} />
        </Panel>

        {/* Model belief */}
        <Panel title="Model state — aggregate factor contribution" right={<span>xs-prob v0.4.2</span>} className="col-span-12 xl:col-span-4">
          <FactorContributionChart items={D.factorContribs} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <Stat k="Universe" v="300 assets" />
            <Stat k="Median P(+50%/30D)" v={`${(median(rows.map((r) => r.p50)) * 100).toFixed(1)}%`} />
            <Stat k="Median E[R] 30D" v={fmtPct(median(rows.map((r) => r.expReturn)), 1)} tone />
          </div>
        </Panel>

        {/* Unusual characteristics */}
        <Panel title="Unusual characteristics (|z| ranked)" dense className="col-span-12 xl:col-span-4">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b text-left"><th className="label-xs px-3 h-6 font-medium">Asset</th><th className="label-xs px-2 h-6 text-right font-medium">SM flow</th><th className="label-xs px-2 h-6 text-right font-medium">Rel. str.</th><th className="label-xs px-2 h-6 text-right font-medium">Social</th><th className="label-xs px-3 h-6 text-right font-medium">7D</th></tr></thead>
            <tbody>
              {unusual.map((r) => (
                <tr key={r.symbol} className="border-b border-border/60 row-hover">
                  <td className="px-3 h-7"><Link to="/research/$symbol" params={{ symbol: r.symbol }} className="num text-text-1 hover:text-primary">{r.symbol}</Link></td>
                  <td className={cn("px-2 num text-right", signClass(r.smartMoneyFlow, 0.5))}>{fmtZ(r.smartMoneyFlow)}</td>
                  <td className={cn("px-2 num text-right", signClass(r.relStrength, 0.5))}>{fmtZ(r.relStrength)}</td>
                  <td className={cn("px-2 num text-right", signClass(r.socialVelocity, 0.5))}>{fmtZ(r.socialVelocity)}</td>
                  <td className={cn("px-3 num text-right", signClass(r.ret7d))}>{fmtPct(r.ret7d, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Signals */}
        <Panel title="Active signals" right={<Link to="/discovery" className="hover:text-text-1">Discovery →</Link>} dense className="col-span-12 xl:col-span-5">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b text-left"><th className="label-xs px-3 h-6 font-medium">Asset</th><th className="label-xs px-2 h-6 text-right font-medium">Price</th><th className="label-xs px-2 h-6 text-right font-medium">P(+50%/30D)</th><th className="label-xs px-2 h-6 text-right font-medium">P(-20% first)</th><th className="label-xs px-2 h-6 text-right font-medium">E[R]</th><th className="label-xs px-3 h-6 text-right font-medium">Status</th></tr></thead>
            <tbody>
              {signals.map((r) => (
                <tr key={r.symbol} className="border-b border-border/60 row-hover">
                  <td className="px-3 h-7"><Link to="/research/$symbol" params={{ symbol: r.symbol }} className="num text-text-1 hover:text-primary">{r.symbol}</Link></td>
                  <td className="px-2 num text-right text-text-2">{fmtPrice(r.price)}</td>
                  <td className="px-2 num text-right text-text-1">{(r.p50 * 100).toFixed(1)}%</td>
                  <td className="px-2 num text-right text-text-2">{(r.downside * 100).toFixed(1)}%</td>
                  <td className={cn("px-2 num text-right", signClass(r.expReturn))}>{fmtPct(r.expReturn, 1)}</td>
                  <td className="px-3 text-right"><SignalTag s={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Risks + pipeline */}
        <div className="col-span-12 xl:col-span-3 space-y-3">
          <Panel title="Rising risk" dense>
            <ul className="divide-y divide-border/60 text-[11px]">
              {risks.map((r) => (
                <li key={r.symbol} className="flex items-center justify-between px-3 h-7 row-hover">
                  <Link to="/research/$symbol" params={{ symbol: r.symbol }} className="num text-text-1 hover:text-primary">{r.symbol}</Link>
                  <span className="text-text-3 num text-[10px]">{r.unlockRisk > 25 ? `unlock ${r.unlockRisk.toFixed(0)}% mcap` : r.liquidity < 2e6 ? `liq ${fmtUsd(r.liquidity)}` : `SM ${fmtZ(r.smartMoneyFlow)}`}</span>
                  <SignalTag s={r.status} />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Pipeline health" right={<Link to="/system" className="hover:text-text-1">System →</Link>} dense>
            <ul className="divide-y divide-border/60 text-[11px]">
              <li className="flex justify-between px-3 h-7 items-center"><span className="text-text-2">Providers OK</span><span className="num text-text-1">{providers.length - unhealthy.length - 1} / {providers.length - 1}</span></li>
              {unhealthy.map((p) => (
                <li key={p.provider} className="flex justify-between px-3 h-7 items-center"><span className="text-text-2 truncate">{p.provider}</span><Tag tone={p.staleness === "api_error" ? "neg" : p.staleness === "stale" ? "warn" : "neutral"}>{p.staleness.replace("_", " ")}</Tag></li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Recent alerts" right={<Link to="/alerts" className="hover:text-text-1">All alerts →</Link>} dense className="col-span-12">
          <AlertFeed items={alerts} compact />
        </Panel>
      </div>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: boolean }) {
  return <div><div className="label-xs">{k}</div><div className={cn("num text-text-1 mt-0.5", tone && (v.startsWith("+") ? "text-pos" : v.startsWith("-") ? "text-neg" : ""))}>{v}</div></div>;
}
function median(a: number[]) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]!; }
