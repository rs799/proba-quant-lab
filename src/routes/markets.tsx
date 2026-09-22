import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useDiscovery, data as D, type DiscoveryRow } from "@/lib/data";
import { fmtPct, fmtPrice, fmtUsd, fmtZ, signClass } from "@/lib/format";
import { DataTable } from "@/components/terminal/DataTable";
import { MetricStrip, PageHeader, Panel, Unavailable } from "@/components/terminal/primitives";
import { QueryState, SourceTag } from "@/components/terminal/QueryState";

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
  { accessorKey: "symbol", header: "Asset", meta: { align: "left" }, cell: ({ row }) => <span><span className="num text-text-1">{row.original.symbol}</span><span className="text-text-3 ml-1.5">{row.original.chain}</span></span> },
  { accessorKey: "price", header: "Price", cell: ({ getValue }) => fmtPrice(getValue()) },
  { accessorKey: "ret7d", header: "7D", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
  { accessorKey: "ret30d", header: "30D", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
  { accessorKey: "mcap", header: "FDV", cell: ({ getValue }) => fmtUsd(getValue()) },
  { accessorKey: "vol24h", header: "Vol 24h", cell: ({ getValue }) => fmtUsd(getValue()) },
  { id: "volMcap", header: "Vol / FDV", accessorFn: (r) => (r.vol24h !== null && r.mcap ? r.vol24h / r.mcap : null), cell: ({ getValue }) => (typeof getValue() === "number" ? getValue().toFixed(3) : "—") },
  { accessorKey: "funding", header: "Funding", cell: ({ getValue }) => (typeof getValue() === "number" ? `${getValue().toFixed(3)}%` : "—") },
  { accessorKey: "oiChange", header: "ΔOI 24h", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), 1)}</span> },
];

function median(a: number[]) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]!; }

function Markets() {
  const nav = useNavigate();
  const query = useDiscovery();
  const rows = query.data?.data ?? [];
  const withRet = rows.filter((r) => r.ret7d !== null);
  const up = withRet.filter((r) => r.ret7d! > 0).length;
  const medRet = median(withRet.map((r) => r.ret7d!));

  return (
    <div className="space-y-3">
      <PageHeader title="Markets" sub="Universe-wide state. Breadth and positioning feed the regime model." right={<SourceTag env={query.data} />} />
      <div className="flex items-center justify-between">
        <span className="label-xs">Market aggregates</span>
        <SourceTag env={D.marketStats} />
      </div>
      <MetricStrip items={D.marketStats.data!} />
      <div className="grid grid-cols-12 gap-3">
        <Panel title="Breadth" className="col-span-12 lg:col-span-4">
          {withRet.length ? (
            <div className="text-[11px] space-y-1.5">
              <div className="flex justify-between"><span className="text-text-2">Advancers / decliners (7D)</span><span className="num text-text-1">{up} / {withRet.length - up}</span></div>
              <div className="flex justify-between"><span className="text-text-2">Median 7D return</span><span className={`num ${medRet !== null && medRet > 0 ? "text-pos" : "text-neg"}`}>{fmtPct(medRet, 1)}</span></div>
            </div>
          ) : (
            <Unavailable reason="no return data in the current candidate set" />
          )}
          <div className="mt-3"><Unavailable reason="moving-average breadth and cross-sectional dispersion require a price history the backend does not expose yet" /></div>
        </Panel>
        <Panel title="Derivatives positioning" className="col-span-12 lg:col-span-4">
          <Unavailable reason="aggregate OI, funding percentile and liquidation flow are not exposed by any current backend endpoint" />
        </Panel>
        <Panel title="Liquidity" className="col-span-12 lg:col-span-4">
          <Unavailable reason="stablecoin supply, exchange balances and DEX depth series are not exposed by any current backend endpoint" />
        </Panel>
      </div>
      <QueryState query={query} emptyReason="the screener has not written any candidates yet">
        {(data) => <DataTable data={data} columns={columns} searchable pageSize={50} initialSort={[{ id: "mcap", desc: true }]} onRowClick={(r) => nav({ to: "/research/$symbol", params: { symbol: r.symbol } })} />}
      </QueryState>
    </div>
  );
}
