import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { data as D, type DiscoveryRow } from "@/lib/data";
import { fmtPct, fmtPrice, fmtUsd, signClass } from "@/lib/format";
import { DataTable } from "@/components/terminal/DataTable";
import { MetricStrip, PageHeader, Panel, KV } from "@/components/terminal/primitives";
import { Sparkline } from "@/components/terminal/charts";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets — crypto-analyst" },
      { name: "description", content: "Market-wide statistics, breadth, derivatives positioning and asset price table." },
      { property: "og:title", content: "Markets — crypto-analyst" },
      { property: "og:description", content: "Market statistics and asset table." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Markets,
});

const columns: ColumnDef<DiscoveryRow, any>[] = [
  { accessorKey: "symbol", header: "Asset", meta: { align: "left" }, cell: ({ row }) => <span><span className="num text-text-1">{row.original.symbol}</span><span className="text-text-3 ml-1.5">{row.original.name}</span></span> },
  { accessorKey: "price", header: "Price", cell: ({ getValue }) => fmtPrice(getValue()) },
  { id: "spark", header: "30D", enableSorting: false, cell: ({ row }) => <div className="w-20 ml-auto"><Sparkline data={D.priceSeries(row.original.symbol, 30).map((p) => p.close)} tone={row.original.ret30d >= 0 ? "pos" : "neg"} height={20} /></div> },
  { accessorKey: "ret7d", header: "7D", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
  { accessorKey: "ret30d", header: "30D", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
  { accessorKey: "mcap", header: "Mcap", cell: ({ getValue }) => fmtUsd(getValue()) },
  { accessorKey: "vol24h", header: "Vol 24h", cell: ({ getValue }) => fmtUsd(getValue()) },
  { id: "volMcap", header: "Vol / Mcap", accessorFn: (r) => r.vol24h / r.mcap, cell: ({ getValue }) => (getValue() as number).toFixed(3) },
  { accessorKey: "funding", header: "Funding", cell: ({ getValue }) => `${(getValue() as number).toFixed(3)}%` },
  { accessorKey: "oiChange", header: "ΔOI 24h", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
];

function Markets() {
  const nav = useNavigate();
  const rows = D.discovery.data!;
  const up = rows.filter((r) => r.ret7d > 0).length;
  return (
    <div className="space-y-3">
      <PageHeader title="Markets" sub="Universe-wide state. Breadth and positioning feed the regime model." />
      <MetricStrip items={D.marketStats.data!} />
      <div className="grid grid-cols-12 gap-3">
        <Panel title="Breadth" className="col-span-12 lg:col-span-4">
          <KV rows={[
            { k: "Advancers / decliners (7D)", v: `${up} / ${rows.length - up}` },
            { k: "% above 30D MA", v: "62%" },
            { k: "% above 200D MA", v: "48%" },
            { k: "Median 7D return", v: fmtPct(median(rows.map((r) => r.ret7d)), 1), tone: median(rows.map((r) => r.ret7d)) > 0 ? "pos" : "neg" },
            { k: "Cross-sectional σ (30D)", v: "14.2%" },
            { k: "Avg pairwise corr (30D)", v: "0.61" },
          ]} />
        </Panel>
        <Panel title="Derivatives positioning" className="col-span-12 lg:col-span-4">
          <KV rows={[
            { k: "Aggregate OI", v: "$61.4B" },
            { k: "OI 7D", v: "+6.4%", tone: "pos" },
            { k: "Funding (OI-weighted, 8h)", v: "0.008%" },
            { k: "Funding percentile (1Y)", v: "P54" },
            { k: "Liquidations 24h (L/S)", v: "$129M / $83M" },
            { k: "Spot / perp volume", v: "0.42" },
            { k: "3M basis (annualised)", v: "8.1%" },
          ]} />
        </Panel>
        <Panel title="Liquidity" className="col-span-12 lg:col-span-4">
          <KV rows={[
            { k: "Stablecoin supply", v: "$284.1B" },
            { k: "Stablecoin supply 30D", v: "+1.8%", tone: "pos" },
            { k: "Exchange BTC balance 30D", v: "-2.1%" },
            { k: "Aggregate DEX depth ±2%", v: "$1.84B" },
            { k: "Depth 7D", v: "+3.4%", tone: "pos" },
            { k: "ETF net flow 5D", v: "+$812M", tone: "pos" },
          ]} />
        </Panel>
      </div>
      <DataTable data={rows} columns={columns} searchable pageSize={50} initialSort={[{ id: "mcap", desc: true }]} onRowClick={(r) => nav({ to: "/research/$symbol", params: { symbol: r.symbol } })} />
    </div>
  );
}
function median(a: number[]) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]!; }
