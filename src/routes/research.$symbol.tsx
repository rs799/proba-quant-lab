import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { data as D } from "@/lib/data";
import { fmtPct, fmtPrice, fmtUsd, fmtZ, signClass } from "@/lib/format";
import { KV, Panel, ResearchSection, SignalTag, Tag, Unavailable } from "@/components/terminal/primitives";
import { FactorContributionChart, PriceChart, ProbabilityDistribution } from "@/components/terminal/charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research/$symbol")({
  loader: ({ params }) => {
    const row = D.discovery.data!.find((r) => r.symbol === params.symbol.toUpperCase());
    if (!row) throw notFound();
    return row;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.symbol ?? "Asset"} research — crypto-analyst` },
      { name: "description", content: `Statistical outlook, factor decomposition, smart money, tokenomics, fundamentals, derivatives and counter-thesis for ${loaderData?.name ?? "asset"}.` },
      { property: "og:title", content: `${loaderData?.symbol ?? "Asset"} research — crypto-analyst` },
      { property: "og:description", content: `Quantitative research page for ${loaderData?.name ?? "asset"}.` },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Research,
});

function Research() {
  const r = Route.useLoaderData();
  const q = D.forwardDist30d[r.symbol] ?? D.forwardDist30d["default"]!;
  const scale = r.symbol === "BTC" ? 0.3 : r.symbol === "ETH" ? 0.45 : 1;
  const q7 = { p10: q.p10 * 0.45, p25: q.p25 * 0.45, p50: q.p50 * 0.35, p75: q.p75 * 0.45, p90: q.p90 * 0.45 };
  const q90 = { p10: q.p10 * 1.5, p25: q.p25 * 1.5, p50: q.p50 * 1.8, p75: q.p75 * 1.8, p90: q.p90 * 1.9 };

  const counter = [
    r.liquidity / r.mcap < 0.01 && { t: "Liquidity deterioration", d: `Liquidity / mcap is ${((r.liquidity / r.mcap) * 100).toFixed(2)}%; a 30% depth drawdown would push the asset below the $2M floor used by the model.` },
    r.smartMoneyFlow > 1 && { t: "Smart-money distribution", d: "Accumulation z-scores above +2σ have historically reversed within 21D in 38% of cases. Monitor net flow sign change." },
    r.unlockRisk > 10 && { t: "Upcoming unlock", d: `Scheduled unlocks equal ${r.unlockRisk.toFixed(1)}% of mcap over 90D. Unlock/ADV > 5 has a documented negative 14D effect (EDG-0015).` },
    r.funding > 0.02 && { t: "Funding overheating", d: `Funding at ${r.funding.toFixed(3)}% / 8h sits above P90; crowded-long conditions degrade forward returns in high-vol regimes.` },
    r.fundGrowth < 0 && { t: "Declining fundamentals", d: `Fundamental growth is ${fmtPct(r.fundGrowth, 1)} over 30D; the model's fundamentals factor is contributing negatively.` },
    r.socialVelocity > 1.5 && { t: "Social concentration", d: "Mention velocity is elevated; if top-20 authors exceed 50% of mentions the social factor is down-weighted to zero." },
    { t: "BTC regime deterioration", d: "58% of this asset's expected return is regime-conditional. A transition to Risk-Off removes the regime contribution (+0.31) entirely." },
  ].filter(Boolean) as { t: string; d: string }[];

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between border-b pb-3 mb-3 flex-wrap gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-semibold text-text-1 tracking-tight">{r.name}</h1>
          <span className="num text-text-2">{r.symbol}</span>
          <Tag>{r.chain}</Tag>
          <SignalTag s={r.status} />
        </div>
        <div className="flex gap-6 text-[11px]">
          <H k="Price" v={fmtPrice(r.price)} />
          <H k="Mcap" v={fmtUsd(r.mcap)} />
          <H k="Liquidity" v={fmtUsd(r.liquidity)} />
          <H k="Vol 24h" v={fmtUsd(r.vol24h)} />
          <H k="7D" v={fmtPct(r.ret7d, 1)} tone={signClass(r.ret7d)} />
          <H k="30D" v={fmtPct(r.ret30d, 1)} tone={signClass(r.ret30d)} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 xl:col-span-8 space-y-3">
          <Panel title="Price / structure" right={<span>Daily close · UTC</span>}>
            <PriceChart symbol={r.symbol} height={320} />
          </Panel>

          <Panel title="Statistical outlook" right={<span>Conditional on features at t · n=4,812 analogues</span>}>
            <div className="grid grid-cols-4 gap-4 mb-4 text-[11px]">
              <O k="P(+20% within 7D)" v={`${(r.p20 * 100).toFixed(1)}%`} />
              <O k="P(+50% within 30D)" v={`${(r.p50 * 100).toFixed(1)}%`} />
              <O k="P(+100% within 90D)" v={`${(r.p100 * 100).toFixed(1)}%`} />
              <O k="P(−20% before +50%)" v={`${(r.downside * 100).toFixed(1)}%`} tone={r.downside > 0.5 ? "text-neg" : undefined} />
              <O k="Expected return 30D" v={fmtPct(r.expReturn, 1)} tone={signClass(r.expReturn)} />
              <O k="Expected volatility 30D" v={`${(38 + 40 * scale).toFixed(0)}%`} />
              <O k="Expected max drawdown 30D" v={`−${(12 + 18 * scale).toFixed(0)}%`} tone="text-neg" />
              <O k="Calibration (Brier, OOS)" v="0.183" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProbabilityDistribution q={q7} label="7D forward return" />
              <ProbabilityDistribution q={q} label="30D forward return" />
              <ProbabilityDistribution q={q90} label="90D forward return" />
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <Panel title="Factor decomposition">
              <FactorContributionChart items={D.factorContribs.map((f) => ({ ...f, contribution: f.factor === "Smart Money" ? r.smartMoneyFlow * 0.1 : f.factor === "Funding" ? -Math.abs(r.funding) * 4 : f.factor === "Tokenomics" ? -r.unlockRisk * 0.006 : f.contribution }))} />
            </Panel>
            <Panel title="Smart money" right={<Tag tone={D.providers.data![3]!.staleness === "ok" ? "pos" : "warn"}>EVM indexer</Tag>}>
              {r.chain === "Solana" ? (
                <Unavailable reason="Solana indexer API error" />
              ) : (
                <>
                  <KV rows={[
                    { k: "Net flow (72h, z)", v: fmtZ(r.smartMoneyFlow), tone: r.smartMoneyFlow > 0 ? "pos" : "neg" },
                    { k: "Net flow (72h, USD)", v: fmtUsd(r.liquidity * r.smartMoneyFlow * 0.04) },
                    { k: "Relevant wallets", v: "142" },
                    { k: "New predictive wallets (7D)", v: "+18" },
                    { k: "Accumulation velocity", v: "+0.9σ / 7D" },
                    { k: "Wallet concentration (top 10)", v: "41%" },
                  ]} />
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                    <div className="border border-border p-2">
                      <div className="label-xs mb-1">Historically profitable</div>
                      <div className="num text-text-1">Median PnL $2.1M · WR 58%</div>
                    </div>
                    <div className="border border-border p-2">
                      <div className="label-xs mb-1">Historically predictive</div>
                      <div className="num text-text-1">IC 0.071 · lead 4.2D</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10.5px] text-text-3">Cohort hit rate: 2× 31% · 5× 9% · 10× 2%. Profitability ≠ predictiveness; only predictive-IC cohorts enter the factor.</div>
                </>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Panel title="Tokenomics" right={<Tag tone="warn">Unlock feed stale</Tag>}>
              <KV rows={[
                { k: "Circulating supply", v: fmtUsd(r.mcap / r.price, 1).slice(1) },
                { k: "Total supply", v: fmtUsd((r.mcap / r.price) * 1.34, 1).slice(1) },
                { k: "Max supply", v: r.symbol === "BTC" ? "21.00M" : r.symbol === "ETH" ? "N/A" : fmtUsd((r.mcap / r.price) * 1.6, 1).slice(1) },
                { k: "Annual inflation", v: r.symbol === "BTC" ? "0.83%" : `${(2 + r.unlockRisk * 0.3).toFixed(1)}%` },
                { k: "Unlock / mcap (90D)", v: `${r.unlockRisk.toFixed(1)}%`, tone: r.unlockRisk > 15 ? "warn" : undefined },
                { k: "Unlock / ADV", v: `${(r.unlockRisk * 0.35).toFixed(1)} days` },
                { k: "Supply expansion 30 / 90 / 180D", v: `${(r.unlockRisk / 3).toFixed(1)}% / ${r.unlockRisk.toFixed(1)}% / ${(r.unlockRisk * 1.7).toFixed(1)}%` },
                { k: "Team / VC / treasury", v: r.symbol === "BTC" ? "N/A" : "18% / 22% / 14%" },
                { k: "Burns / buybacks (30D)", v: r.symbol === "ETH" ? "-0.02% / N/A" : "N/A" },
              ]} />
            </Panel>
            <Panel title="Fundamentals" right={<Tag tone="warn">DefiLlama stale (3h)</Tag>}>
              {r.symbol === "BTC" ? (
                <Unavailable reason="Not applicable (no protocol fundamentals)" />
              ) : (
                <KV rows={[
                  { k: "TVL", v: fmtUsd(r.mcap * 0.4), },
                  { k: "TVL 30D", v: fmtPct(r.fundGrowth * 0.6, 1), tone: r.fundGrowth > 0 ? "pos" : "neg" },
                  { k: "Fees 30D", v: fmtUsd(r.mcap * 0.004) },
                  { k: "Revenue 30D", v: fmtUsd(r.mcap * 0.0015) },
                  { k: "Revenue 30D growth", v: fmtPct(r.fundGrowth, 1), tone: r.fundGrowth > 0 ? "pos" : "neg" },
                  { k: "Active users 7D / trend", v: `${fmtUsd(r.mcap / 4000, 1).slice(1)} / ${fmtPct(r.fundGrowth * 0.4, 1)}` },
                  { k: "Dev commits 30D / trend", v: `184 / ${fmtPct(r.holderGrowth, 1)}` },
                  { k: "Treasury", v: fmtUsd(r.mcap * 0.08) },
                  { k: "P / F (annualised)", v: (r.mcap / (r.mcap * 0.004 * 12)).toFixed(1) },
                ]} />
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Panel title="Derivatives">
              <KV rows={[
                { k: "Funding (8h)", v: `${r.funding.toFixed(3)}%`, tone: r.funding > 0.03 ? "warn" : undefined },
                { k: "Funding percentile (1Y)", v: `P${Math.min(99, Math.round(50 + r.funding * 800))}` },
                { k: "Open interest", v: fmtUsd(r.vol24h * 0.8) },
                { k: "ΔOI 24h", v: fmtPct(r.oiChange, 1), tone: r.oiChange > 0 ? "pos" : "neg" },
                { k: "3M basis (ann.)", v: `${(6 + r.funding * 100).toFixed(1)}%` },
                { k: "Liquidations 24h", v: fmtUsd(r.vol24h * 0.004) },
                { k: "Perp volume 24h", v: fmtUsd(r.vol24h * 1.9) },
                { k: "Spot / perp", v: (1 / 1.9).toFixed(2) },
              ]} />
              <div className="mt-3 border border-border p-2 text-[11px]">
                <div className="label-xs mb-1">Divergence detection</div>
                <div className="num text-text-2">Price {r.ret7d > 0 ? "↑" : "↓"} · OI {r.oiChange > 0 ? "↑" : "↓"} · Funding {r.funding > 0.01 ? "↑" : "→"}</div>
                <div className="mt-1 text-text-1">{r.ret7d > 0 && r.oiChange > 0 && r.funding > 0.01 ? "Potential leverage expansion (long-crowded rally)." : r.ret7d < 0 && r.oiChange > 0 ? "Short build-up into weakness; squeeze risk elevated." : r.ret7d > 0 && r.oiChange < 0 ? "Short-covering rally; spot-led." : "No structural divergence flagged."}</div>
              </div>
            </Panel>
            <Panel title="Social / narrative" right={<Tag>Social firehose: no data</Tag>}>
              <Unavailable reason="social firehose not yet ingested" className="mb-3" />
              <KV rows={[
                { k: "Mention velocity (z)", v: fmtZ(r.socialVelocity), tone: undefined },
                { k: "Unique authors 7D", v: "NO DATA" },
                { k: "New authors 7D", v: "NO DATA" },
                { k: "Engagement velocity", v: "NO DATA" },
                { k: "Narrative class", v: "NO DATA" },
                { k: "Bot / coordination prob.", v: "NO DATA" },
              ]} className="text-text-3" />
              <div className="mt-2 text-[10.5px] text-text-3">Mention velocity is derived from the partial GitHub / news proxy; the social factor is down-weighted until the firehose is live.</div>
            </Panel>
          </div>

          <Panel title="What could make this thesis wrong?" className="border-neg/30">
            <ol className="space-y-2 text-[11.5px]">
              {counter.map((c, i) => (
                <li key={c.t} className="grid grid-cols-[24px_180px_1fr] gap-2">
                  <span className="num text-text-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-text-1">{c.t}</span>
                  <span className="text-text-2">{c.d}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        {/* Right rail */}
        <div className="col-span-12 xl:col-span-4 space-y-3">
          <Panel title="AI research note" right={<span>Secondary layer · evidence-bound</span>}>
            <p className="text-[12px] text-text-1 leading-relaxed">
              {r.smartMoneyFlow > 1
                ? "Smart-money accumulation increased significantly over the last 72 hours while price remained range-bound."
                : r.smartMoneyFlow < -1
                ? "Historically predictive wallets are net distributing while retail holder count continues to grow."
                : "No anomalous smart-money behaviour detected; model output is driven primarily by regime and momentum."}
            </p>
            <div className="label-xs mt-3 mb-1">Evidence</div>
            <ul className="text-[11px] num text-text-2 space-y-0.5">
              <li>· SM net flow {fmtZ(r.smartMoneyFlow)} vs 90D baseline</li>
              <li>· Rel. strength {fmtZ(r.relStrength)}; 7D {fmtPct(r.ret7d, 1)}</li>
              <li>· Holder growth {fmtPct(r.holderGrowth, 1)} / 30D</li>
              <li>· Regime alignment: {r.regime}</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
              {["Explain model output", "Summarise governance", "Investigate anomaly", "Propose hypothesis"].map((a) => (
                <button key={a} className="border border-border px-1.5 h-5 text-text-3 hover:text-text-1 hover:border-border-strong transition-colors rounded-sm">{a}</button>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-text-3">The assistant explains and investigates; it never generates the signal.</div>
          </Panel>

          <Panel title="Cross-section rank" dense>
            <KV className="px-3 py-1" rows={[
              { k: "E[R] rank", v: `${rank(r.symbol, "expReturn")} / ${D.discovery.data!.length}` },
              { k: "P(+50%) rank", v: `${rank(r.symbol, "p50")} / ${D.discovery.data!.length}` },
              { k: "SM flow rank", v: `${rank(r.symbol, "smartMoneyFlow")} / ${D.discovery.data!.length}` },
              { k: "Rel. strength rank", v: `${rank(r.symbol, "relStrength")} / ${D.discovery.data!.length}` },
              { k: "Liquidity rank", v: `${rank(r.symbol, "liquidity")} / ${D.discovery.data!.length}` },
            ]} />
          </Panel>

          <Panel title="Related edges" dense>
            <ul className="divide-y divide-border/60 text-[11px]">
              {D.edges.data!.filter((e) => e.status === "ACTIVE" || e.status === "VALIDATED").slice(0, 4).map((e) => (
                <li key={e.id} className="px-3 py-1.5 row-hover">
                  <div className="flex justify-between"><Link to="/models" className="num text-text-1 hover:text-primary">{e.id}</Link><span className="num text-text-3">OOS IC {e.oosIC.toFixed(3)}</span></div>
                  <div className="text-text-3 truncate">{e.hypothesis}</div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Peers (same chain)" dense>
            <ul className="divide-y divide-border/60 text-[11px]">
              {D.discovery.data!.filter((p) => p.chain === r.chain && p.symbol !== r.symbol).slice(0, 6).map((p) => (
                <li key={p.symbol} className="flex items-center justify-between px-3 h-7 row-hover">
                  <Link to="/research/$symbol" params={{ symbol: p.symbol }} className="num text-text-1 hover:text-primary">{p.symbol}</Link>
                  <span className={cn("num", signClass(p.ret7d))}>{fmtPct(p.ret7d, 1)}</span>
                  <SignalTag s={p.status} />
                </li>
              ))}
              {D.discovery.data!.filter((p) => p.chain === r.chain && p.symbol !== r.symbol).length === 0 && <li className="px-3 h-7 flex items-center text-text-3">No peers in universe</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function H({ k, v, tone }: { k: string; v: string; tone?: string | undefined }) {
  return <div><div className="label-xs">{k}</div><div className={cn("num text-text-1 text-[12.5px]", tone)}>{v}</div></div>;
}
function O({ k, v, tone }: { k: string; v: string; tone?: string | undefined }) {
  return <div><div className="text-[10px] text-text-3">{k}</div><div className={cn("num text-[15px] text-text-1 mt-0.5", tone)}>{v}</div></div>;
}
function rank(symbol: string, key: "expReturn" | "p50" | "smartMoneyFlow" | "relStrength" | "liquidity") {
  const s = [...D.discovery.data!].sort((a, b) => b[key] - a[key]);
  return s.findIndex((r) => r.symbol === symbol) + 1;
}
