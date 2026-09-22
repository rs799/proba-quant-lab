import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useHoldings, usePortfolio, type Position } from "@/lib/data";
import { fmtPct, fmtPrice, fmtUsd, signClass } from "@/lib/format";
import { DataTable } from "@/components/terminal/DataTable";
import { MetricStrip, PageHeader, Panel, Unavailable } from "@/components/terminal/primitives";
import { QueryState, SourceTag } from "@/components/terminal/QueryState";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — crypto-analyst" },
      { name: "description", content: "Live holdings, unrealized P/L and honest gaps in portfolio-level risk analytics." },
      { property: "og:title", content: "Portfolio — crypto-analyst" },
      { property: "og:description", content: "Portfolio holdings and risk analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

const priceReturn = (p: Position) => (p.entry !== null && p.price !== null && p.entry !== 0 ? (p.price / p.entry - 1) * 100 : null);

const columns: ColumnDef<Position, any>[] = [
  { accessorKey: "symbol", header: "Asset", meta: { align: "left" }, cell: ({ getValue }) => <Link to="/research/$symbol" params={{ symbol: getValue() }} className="num text-text-1 hover:text-primary">{getValue()}</Link> },
  { accessorKey: "entry", header: "Entry", cell: ({ getValue }) => fmtPrice(getValue()) },
  { accessorKey: "price", header: "Price", cell: ({ getValue }) => fmtPrice(getValue()) },
  { id: "priceReturn", header: "Price Δ", accessorFn: priceReturn, cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
  { accessorKey: "size", header: "Size", cell: ({ getValue }) => fmtUsd(getValue()) },
  { accessorKey: "unrealized", header: "Unrealized", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtUsd(getValue())}</span> },
  { accessorKey: "realized", header: "Realized", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtUsd(getValue())}</span> },
  { accessorKey: "expReturn", header: "E[R] 30D", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
  { accessorKey: "liquidity", header: "Liquidity", cell: ({ getValue }) => fmtUsd(getValue()) },
  { accessorKey: "corrBtc", header: "ρ BTC", cell: ({ getValue }) => (typeof getValue() === "number" ? getValue().toFixed(2) : "—") },
  { accessorKey: "riskContribution", header: "Risk contrib.", cell: ({ getValue }) => (typeof getValue() === "number" ? `${(getValue() * 100).toFixed(1)}%` : "—") },
];

function avg(vals: (number | null)[]) {
  const xs = vals.filter((v): v is number => v !== null);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function Portfolio() {
  const holdingsQ = useHoldings();
  const portfolioQ = usePortfolio();
  const positions = holdingsQ.data?.data ?? [];
  const note = portfolioQ.data?.data?.note;
  const priced = positions.filter((p) => p.entry !== null && p.price !== null);
  const avgReturn = avg(positions.map(priceReturn));
  const anySize = positions.some((p) => p.size !== null);
  const anyUnrealized = positions.some((p) => p.unrealized !== null);

  return (
    <div className="space-y-3">
      <PageHeader title="Portfolio" sub="Holdings are read directly from the backend. Risk analytics that require position sizing or a fitted factor model are shown as unavailable, never estimated." right={<SourceTag env={holdingsQ.data} />} />
      <MetricStrip items={[
        { label: "Positions", value: String(positions.length) },
        { label: "Priced positions", value: `${priced.length} / ${positions.length}` },
        { label: "Avg price return (unweighted)", value: fmtPct(avgReturn, 1), tone: avgReturn !== null ? (avgReturn > 0 ? "pos" : "neg") : "neutral" },
        { label: "Total value", value: anySize ? fmtUsd(positions.reduce((a, p) => a + (p.size ?? 0), 0)) : "—", ...(anySize ? {} : { sub: "Awaiting position sizing" }) },
        { label: "Unrealized P/L", value: anyUnrealized ? fmtUsd(positions.reduce((a, p) => a + (p.unrealized ?? 0), 0)) : "—", ...(anyUnrealized ? {} : { sub: "Awaiting position sizing" }) },
        { label: "Expected volatility", value: "—", sub: "Awaiting factor model" },
        { label: "Sharpe estimate", value: "—", sub: "Awaiting factor model" },
        { label: "Max DD estimate (P95)", value: "—", sub: "Awaiting factor model" },
      ]} />
      <QueryState query={holdingsQ} emptyReason="no open positions tracked yet">
        {(data) => <DataTable data={data} columns={columns} pageSize={50} maxHeight="45vh" />}
      </QueryState>
      {note && <div className="text-[10.5px] text-text-3 border border-border px-3 py-2">{note}</div>}
      <Panel title="Exposure & risk analytics">
        <Unavailable reason="position sizing, factor betas and correlation are not yet exposed by the backend — sector, chain, market-cap and factor exposure require weighted positions, and a correlation matrix requires a return history the point-in-time store has not accumulated yet" />
      </Panel>
    </div>
  );
}
