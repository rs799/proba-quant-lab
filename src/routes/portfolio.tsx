import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { data as D, type Position } from "@/lib/data";
import { fmtPct, fmtPrice, fmtUsd, signClass } from "@/lib/format";
import { DataTable } from "@/components/terminal/DataTable";
import { HBar, KV, MetricStrip, PageHeader, Panel } from "@/components/terminal/primitives";
import { FactorContributionChart } from "@/components/terminal/charts";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — crypto-analyst" },
      { name: "description", content: "Positions, expected return and volatility, risk contribution and factor / sector / chain exposures." },
      { property: "og:title", content: "Portfolio — crypto-analyst" },
      { property: "og:description", content: "Portfolio risk and exposure analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

const columns: ColumnDef<Position, any>[] = [
  { accessorKey: "symbol", header: "Asset", meta: { align: "left" }, cell: ({ getValue }) => <Link to="/research/$symbol" params={{ symbol: getValue() }} className="num text-text-1 hover:text-primary">{getValue()}</Link> },
  { accessorKey: "size", header: "Size", cell: ({ getValue }) => fmtUsd(getValue()) },
  { id: "weight", header: "Weight", accessorFn: (r) => r.size, cell: ({ getValue }) => `${((getValue() as number) / total * 100).toFixed(1)}%` },
  { accessorKey: "entry", header: "Entry", cell: ({ getValue }) => fmtPrice(getValue()) },
  { accessorKey: "price", header: "Price", cell: ({ getValue }) => fmtPrice(getValue()) },
  { accessorKey: "unrealized", header: "Unrealized", cell: ({ row }) => <span className={signClass(row.original.unrealized)}>{fmtUsd(row.original.unrealized)} <span className="text-[10px] opacity-80">({fmtPct((row.original.price / row.original.entry - 1) * 100, 1)})</span></span> },
  { accessorKey: "realized", header: "Realized", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtUsd(getValue())}</span> },
  { accessorKey: "expReturn", header: "E[R] 30D", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
  { accessorKey: "expVol", header: "E[σ]", cell: ({ getValue }) => `${getValue()}%` },
  { accessorKey: "downside", header: "P(−20% first)", cell: ({ getValue }) => `${((getValue() as number) * 100).toFixed(0)}%` },
  { accessorKey: "liquidity", header: "Liquidity", cell: ({ getValue }) => <div className="w-14 ml-auto"><HBar value={getValue()} tone={(getValue() as number) < 0.6 ? "warn" : "neutral"} /></div> },
  { accessorKey: "contribution", header: "Return contrib.", cell: ({ getValue }) => `${((getValue() as number) * 100).toFixed(0)}%` },
  { accessorKey: "corrBtc", header: "ρ BTC", cell: ({ getValue }) => (getValue() as number).toFixed(2) },
  { accessorKey: "riskContribution", header: "Risk contrib.", cell: ({ getValue }) => <span className={(getValue() as number) > 0.25 ? "text-warn" : ""}>{((getValue() as number) * 100).toFixed(1)}%</span> },
];
const total = D.positions.data!.reduce((a, p) => a + p.size, 0);

function Portfolio() {
  const pos = D.positions.data!;
  const unreal = pos.reduce((a, p) => a + p.unrealized, 0);
  const expR = pos.reduce((a, p) => a + p.expReturn * (p.size / total), 0);
  return (
    <div className="space-y-3">
      <PageHeader title="Portfolio" sub="Risk is reported as contribution to portfolio variance, not position size." />
      <MetricStrip items={[
        { label: "NAV", value: fmtUsd(total + unreal) },
        { label: "Unrealized P/L", value: fmtUsd(unreal), tone: unreal > 0 ? "pos" : "neg" },
        { label: "Expected return 30D", value: fmtPct(expR, 1), tone: "pos" },
        { label: "Expected volatility", value: "46.2%", sub: "ann." },
        { label: "Sharpe estimate", value: "1.24", sub: "fwd, ex-ante" },
        { label: "Max DD estimate (P95)", value: "−28.4%", tone: "neg" },
        { label: "Liquidity-adj. exposure", value: "88.1%", sub: "of gross" },
        { label: "Positions", value: String(pos.length) },
      ]} />
      <DataTable data={pos} columns={columns} pageSize={50} maxHeight="40vh" />
      <div className="grid grid-cols-12 gap-3">
        <Panel title="Factor exposure (β to factor portfolios)" className="col-span-12 lg:col-span-4">
          <FactorContributionChart height={0} items={[
            { factor: "Market (BTC)", contribution: 0.86 }, { factor: "Momentum", contribution: 0.42 }, { factor: "Smart Money", contribution: 0.31 },
            { factor: "Size (small)", contribution: -0.18 }, { factor: "Liquidity", contribution: 0.12 }, { factor: "Funding carry", contribution: -0.09 },
          ]} />
        </Panel>
        <Panel title="Sector exposure" className="col-span-6 lg:col-span-2"><Exp rows={[["L1", 0.79], ["DeFi", 0.13], ["Perp DEX", 0.08]]} /></Panel>
        <Panel title="Chain exposure" className="col-span-6 lg:col-span-2"><Exp rows={[["Bitcoin", 0.42], ["Ethereum", 0.30], ["Solana", 0.19], ["Hyperliquid", 0.09]]} /></Panel>
        <Panel title="Market-cap exposure" className="col-span-6 lg:col-span-2"><Exp rows={[["Mega (>$100B)", 0.66], ["Large ($10–100B)", 0.19], ["Mid ($1–10B)", 0.15], ["Small", 0]]} /></Panel>
        <Panel title="Risk contribution" className="col-span-6 lg:col-span-2"><Exp rows={pos.map((p) => [p.symbol, p.riskContribution] as [string, number])} warnAbove={0.25} /></Panel>
      </div>
      <Panel title="Correlation matrix (30D, log returns)" dense>
        <table className="text-[11px] num">
          <thead><tr><th className="px-3 h-7" />{pos.map((p) => <th key={p.symbol} className="label-xs px-3 font-medium text-right">{p.symbol}</th>)}</tr></thead>
          <tbody>
            {pos.map((a, i) => (
              <tr key={a.symbol} className="border-t border-border/60">
                <td className="px-3 h-7 text-text-2">{a.symbol}</td>
                {pos.map((b, j) => { const v = i === j ? 1 : Math.min(a.corrBtc, b.corrBtc) * (0.9 + 0.1 * Math.max(a.corrBtc, b.corrBtc)); return <td key={b.symbol} className="px-3 text-right" style={{ color: `color-mix(in oklch, var(--text-1) ${v * 100}%, var(--text-3))` }}>{v.toFixed(2)}</td>; })}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
function Exp({ rows, warnAbove }: { rows: [string, number][]; warnAbove?: number }) {
  return (
    <div className="space-y-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="text-[11px]">
          <div className="flex justify-between mb-0.5"><span className="text-text-2">{k}</span><span className={`num ${warnAbove && v > warnAbove ? "text-warn" : "text-text-1"}`}>{(v * 100).toFixed(1)}%</span></div>
          <HBar value={v} tone={warnAbove && v > warnAbove ? "warn" : "neutral"} height={3} />
        </div>
      ))}
    </div>
  );
}
