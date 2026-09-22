import { createFileRoute, Link } from "@tanstack/react-router";
import { useDiscovery, useEdges, useWallets } from "@/lib/data";
import { fmtPct, fmtPrice, fmtUsd, signClass } from "@/lib/format";
import { KV, Panel, SignalTag, Tag, Unavailable } from "@/components/terminal/primitives";
import { QueryState, SourceTag } from "@/components/terminal/QueryState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research/$symbol")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol.toUpperCase()} research — crypto-analyst` },
      { name: "description", content: `Live screen data and wallet intelligence for ${params.symbol.toUpperCase()}, with honest labels on any research panel not yet backed by the pipeline.` },
      { property: "og:title", content: `${params.symbol.toUpperCase()} research — crypto-analyst` },
      { property: "og:description", content: `Research page for ${params.symbol.toUpperCase()}.` },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Research,
});

function Research() {
  const { symbol } = Route.useParams();
  const ticker = symbol.toUpperCase();
  const discoveryQ = useDiscovery();
  const edgesQ = useEdges();
  const walletsQ = useWallets(ticker);

  if (discoveryQ.isPending) {
    return <div className="p-8 text-[11px] text-text-3">Loading candidate universe…</div>;
  }
  if (discoveryQ.isError || discoveryQ.data?.state === "api_error") {
    return <div className="p-8 text-[11px] text-neg">Could not reach the backend to look up {ticker}.</div>;
  }
  const all = discoveryQ.data?.data ?? [];
  const r = all.find((x) => x.symbol === ticker);
  if (!r) {
    return (
      <div className="p-8 space-y-2">
        <div className="text-[13px] text-text-1">{ticker} is not in the current candidate universe.</div>
        <div className="text-[11px] text-text-3">It may not have been discovered by the screener yet, or the ticker is misspelled.</div>
        <Link to="/discovery" className="text-[11px] text-primary hover:underline">Back to Discovery →</Link>
      </div>
    );
  }

  const wallets = walletsQ.data?.data?.wallets ?? [];
  const withReputation = wallets.filter((w) => w.reputation != null);
  const avgReputation = withReputation.length ? withReputation.reduce((a, w) => a + w.reputation!, 0) / withReputation.length : null;
  const withIC = wallets.filter((w) => w.predictiveIC !== null);

  const peers = all.filter((p) => p.chain === r.chain && p.symbol !== r.symbol).slice(0, 6);
  const edges = (edgesQ.data?.data ?? []).filter((e) => e.status === "ACTIVE" || e.status === "VALIDATED").slice(0, 4);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between border-b pb-3 mb-3 flex-wrap gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-semibold text-text-1 tracking-tight">{r.name}</h1>
          <span className="num text-text-2">{r.symbol}</span>
          <Tag>{r.chain}</Tag>
          <SignalTag s={r.status} />
          <SourceTag env={discoveryQ.data} />
        </div>
        <div className="flex gap-6 text-[11px]">
          <H k="Price" v={fmtPrice(r.price)} />
          <H k="FDV" v={fmtUsd(r.mcap)} />
          <H k="Liquidity" v={fmtUsd(r.liquidity)} />
          <H k="Vol 24h" v={fmtUsd(r.vol24h)} />
          <H k="7D" v={fmtPct(r.ret7d, 1)} tone={signClass(r.ret7d)} />
          <H k="30D" v={fmtPct(r.ret30d, 1)} tone={signClass(r.ret30d)} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 xl:col-span-8 space-y-3">
          <Panel title="Price / structure">
            <Unavailable reason="historical price series awaiting ingestion — no candle/OHLC endpoint is exposed yet" />
          </Panel>

          <Panel title="Statistical outlook" right={<span>Awaiting research engine</span>}>
            <Unavailable reason="the research engine has not trained and exposed point-in-time probability outputs for this candidate — P(+20%/7D), P(+50%/30D), P(+100%/90D), expected return/volatility and drawdown quantiles all read as unavailable rather than estimated" />
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <Panel title="Factor decomposition">
              <Unavailable reason="factor model not yet attached to this candidate" />
            </Panel>
            <Panel title="Smart money" right={<SourceTag env={walletsQ.data} />}>
              <QueryState query={walletsQ} emptyReason={`no wallets have been scanned for ${ticker} yet`}>
                {() => (
                  <>
                    <KV rows={[
                      { k: "Wallets scanned", v: wallets.length },
                      { k: "Avg reputation score", v: avgReputation !== null ? avgReputation.toFixed(2) : "—" },
                      { k: "Wallets with predictive IC", v: withIC.length ? `${withIC.length} / ${wallets.length}` : "Awaiting trade history" },
                      { k: "Clusters", v: new Set(wallets.map((w) => w.cluster)).size },
                    ]} />
                    <div className="mt-2 text-[10.5px] text-text-3">
                      Profitability ≠ predictiveness; only predictive-IC cohorts enter the smart-money factor. <Link to="/wallets" className="text-primary hover:underline">Full wallet table →</Link>
                    </div>
                  </>
                )}
              </QueryState>
            </Panel>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Panel title="Tokenomics">
              <Unavailable reason="supply schedule, unlocks and inflation are not exposed by any current backend endpoint" />
            </Panel>
            <Panel title="Fundamentals">
              <Unavailable reason="TVL, fees, revenue and protocol usage are not exposed by any current backend endpoint" />
            </Panel>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Panel title="Derivatives">
              <Unavailable reason="open interest, funding history and liquidation flow are not exposed by any current backend endpoint" />
            </Panel>
            <Panel title="Social / narrative">
              <Unavailable reason="social firehose not yet ingested" />
            </Panel>
          </div>

          <Panel title="What could make this thesis wrong?">
            <Unavailable reason="counter-thesis generation reads from the factor decomposition and statistical outlook models, neither of which is attached to this candidate yet" />
          </Panel>
        </div>

        {/* Right rail */}
        <div className="col-span-12 xl:col-span-4 space-y-3">
          <Panel title="Research note" right={<span>Screen data only</span>}>
            <p className="text-[12px] text-text-1 leading-relaxed">
              {r.name} ({r.symbol}) is tracked on {r.chain} with FDV {fmtUsd(r.mcap)}, 24h liquidity {fmtUsd(r.liquidity)} and 24h volume {fmtUsd(r.vol24h)}.
              No statistical model output, factor decomposition, or smart-money classification has been computed for this candidate yet — only raw screen fields from <span className="num">/candidates</span> are available.
            </p>
          </Panel>

          <Panel title="Cross-section rank" dense right={<SourceTag env={discoveryQ.data} />}>
            <KV className="px-3 py-1" rows={[
              { k: "Liquidity rank", v: r.liquidity !== null ? `${rank(all, r.symbol, "liquidity")} / ${all.length}` : "—" },
              { k: "FDV rank", v: r.mcap !== null ? `${rank(all, r.symbol, "mcap")} / ${all.length}` : "—" },
              { k: "24h volume rank", v: r.vol24h !== null ? `${rank(all, r.symbol, "vol24h")} / ${all.length}` : "—" },
              { k: "E[R] rank", v: "Not ranked — no model output" },
              { k: "Smart-money flow rank", v: "Not ranked — no model output" },
            ]} />
          </Panel>

          <Panel title="Related edges" dense right={<SourceTag env={edgesQ.data} />}>
            {edges.length === 0 ? (
              <div className="px-3 py-3 text-[11px] text-text-3">No active or validated edges in the registry yet.</div>
            ) : (
              <ul className="divide-y divide-border/60 text-[11px]">
                {edges.map((e) => (
                  <li key={e.id} className="px-3 py-1.5 row-hover">
                    <div className="flex justify-between"><Link to="/models" className="num text-text-1 hover:text-primary">{e.id}</Link><span className="num text-text-3">OOS IC {e.oosIC !== null ? e.oosIC.toFixed(3) : "—"}</span></div>
                    <div className="text-text-3 truncate">{e.hypothesis}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Peers (same chain)" dense right={<SourceTag env={discoveryQ.data} />}>
            <ul className="divide-y divide-border/60 text-[11px]">
              {peers.map((p, i) => (
                <li key={`${p.symbol}-${i}`} className="flex items-center justify-between px-3 h-7 row-hover">
                  <Link to="/research/$symbol" params={{ symbol: p.symbol }} className="num text-text-1 hover:text-primary">{p.symbol}</Link>
                  <span className={cn("num", signClass(p.ret7d))}>{fmtPct(p.ret7d, 1)}</span>
                  <SignalTag s={p.status} />
                </li>
              ))}
              {peers.length === 0 && <li className="px-3 h-7 flex items-center text-text-3">No peers in universe</li>}
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
function rank(all: { symbol: string; liquidity: number | null; mcap: number | null; vol24h: number | null }[], symbol: string, key: "liquidity" | "mcap" | "vol24h") {
  const s = [...all].filter((r) => r[key] !== null).sort((a, b) => b[key]! - a[key]!);
  return s.findIndex((r) => r.symbol === symbol) + 1;
}
