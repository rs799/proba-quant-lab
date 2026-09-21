import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { data as D, type DiscoveryRow, type SignalStatus } from "@/lib/data";
import { fmtPct, fmtPrice, fmtUsd, fmtZ, signClass } from "@/lib/format";
import { DataTable } from "@/components/terminal/DataTable";
import { PageHeader, SignalTag } from "@/components/terminal/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discovery")({
  head: () => ({
    meta: [
      { title: "Discovery — crypto-analyst" },
      { name: "description", content: "Cross-sectional candidate discovery: conditional probabilities, expected return and downside risk across the universe." },
      { property: "og:title", content: "Discovery — crypto-analyst" },
      { property: "og:description", content: "Quantitative candidate discovery table." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discovery,
});

const STATUSES: SignalStatus[] = ["Positive Expected Alpha", "Signal", "Watch", "Research", "Deteriorating", "Avoid"];

const pct = (k: keyof DiscoveryRow, d = 1): ColumnDef<DiscoveryRow, number>["cell"] => ({ getValue }) => <span className={signClass(getValue())}>{fmtPct(getValue(), d)}</span>;
const prob = (): ColumnDef<DiscoveryRow, number>["cell"] => ({ getValue }) => <span className="text-text-1">{(getValue() * 100).toFixed(1)}%</span>;
const z = (): ColumnDef<DiscoveryRow, number>["cell"] => ({ getValue }) => <span className={signClass(getValue(), 0.5)}>{fmtZ(getValue())}</span>;

const columns: ColumnDef<DiscoveryRow, any>[] = [
  { accessorKey: "symbol", header: "Asset", meta: { align: "left" }, enableHiding: false, cell: ({ row }) => <span><span className="num text-text-1">{row.original.symbol}</span><span className="text-text-3 ml-1.5 text-[10px]">{row.original.chain}</span></span> },
  { accessorKey: "price", header: "Price", cell: ({ getValue }) => fmtPrice(getValue()) },
  { accessorKey: "mcap", header: "Mcap", cell: ({ getValue }) => fmtUsd(getValue()) },
  { accessorKey: "liquidity", header: "Liquidity", cell: ({ getValue }) => <span className={cn(getValue() < 2e6 && "text-neg")}>{fmtUsd(getValue())}</span> },
  { accessorKey: "vol24h", header: "Vol 24h", cell: ({ getValue }) => fmtUsd(getValue()) },
  { accessorKey: "ret7d", header: "7D", cell: pct("ret7d") },
  { accessorKey: "ret30d", header: "30D", cell: pct("ret30d") },
  { accessorKey: "relStrength", header: "Rel. str.", cell: z() },
  { accessorKey: "smartMoneyFlow", header: "SM flow", cell: z() },
  { accessorKey: "holderGrowth", header: "Holders 30D", cell: pct("holderGrowth") },
  { accessorKey: "socialVelocity", header: "Social", cell: z() },
  { accessorKey: "funding", header: "Funding", cell: ({ getValue }) => <span className={cn(getValue() > 0.03 && "text-warn")}>{(getValue() as number).toFixed(3)}%</span> },
  { accessorKey: "oiChange", header: "ΔOI", cell: pct("oiChange") },
  { accessorKey: "unlockRisk", header: "Unlock/Mcap", cell: ({ getValue }) => <span className={cn(getValue() > 15 && "text-warn", getValue() > 25 && "text-neg")}>{(getValue() as number).toFixed(1)}%</span> },
  { accessorKey: "fundGrowth", header: "Fund. growth", cell: pct("fundGrowth") },
  { accessorKey: "regime", header: "Regime", cell: ({ getValue }) => <span className={getValue() === "Aligned" ? "text-pos" : getValue() === "Against" ? "text-neg" : "text-text-2"}>{getValue()}</span> },
  { accessorKey: "p20", header: "P(+20%/7D)", cell: prob() },
  { accessorKey: "p50", header: "P(+50%/30D)", cell: prob() },
  { accessorKey: "p100", header: "P(+100%/90D)", cell: prob() },
  { accessorKey: "expReturn", header: "E[R] 30D", cell: pct("expReturn") },
  { accessorKey: "downside", header: "P(-20% first)", cell: ({ getValue }) => <span className={cn(getValue() > 0.5 && "text-neg")}>{(getValue() * 100).toFixed(1)}%</span> },
  { accessorKey: "status", header: "Status", enableHiding: false, cell: ({ getValue }) => <SignalTag s={getValue()} />, sortingFn: (a, b) => STATUSES.indexOf(a.original.status) - STATUSES.indexOf(b.original.status) },
];

function Discovery() {
  const nav = useNavigate();
  const [status, setStatus] = useState<SignalStatus | "All">("All");
  const [minLiq, setMinLiq] = useState(0);
  const rows = useMemo(() => D.discovery.data!.filter((r) => (status === "All" || r.status === status) && r.liquidity >= minLiq), [status, minLiq]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, D.discovery.data!.filter((r) => r.status === s).length])), []);

  return (
    <div>
      <PageHeader title="Discovery" sub="Given what was observable at t, what has historically happened to assets with similar characteristics? Probabilities are conditional frequencies from the cross-sectional model, not predictions." />
      <div className="flex gap-1 mb-2 text-[10px]">
        {(["All", ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn("border px-2 h-6 uppercase tracking-wide rounded-sm transition-colors", status === s ? "border-primary/60 text-text-1 bg-surface-2" : "border-border text-text-3 hover:text-text-1")}>
            {s} <span className="num text-text-3 ml-1">{s === "All" ? D.discovery.data!.length : counts[s]}</span>
          </button>
        ))}
      </div>
      <DataTable
        data={rows}
        columns={columns}
        searchable
        searchPlaceholder="Symbol / name…"
        pageSize={50}
        initialSort={[{ id: "expReturn", desc: true }]}
        onRowClick={(r) => nav({ to: "/research/$symbol", params: { symbol: r.symbol } })}
        toolbar={
          <label className="flex items-center gap-1.5 text-[10px] text-text-3">
            Min liquidity
            <select value={minLiq} onChange={(e) => setMinLiq(Number(e.target.value))} className="h-6 bg-surface-2 border border-border px-1 text-[11px] text-text-1 rounded-sm outline-none">
              <option value={0}>Any</option><option value={2e6}>$2M</option><option value={1e7}>$10M</option><option value={5e7}>$50M</option>
            </select>
          </label>
        }
      />
      <div className="mt-2 text-[10px] text-text-3 leading-relaxed">
        <span className="uppercase tracking-wide text-text-2">Status rules</span> — Avoid: liquidity &lt; $2M or unlock/mcap &gt; 25%. Deteriorating: SM flow &lt; −1.5σ or (7D &lt; −12% and ΔOI &gt; 15%). Positive Expected Alpha: E[R] &gt; 8%, P(+50%/30D) &gt; 25%, P(−20% first) &lt; 45%, regime aligned. Signal: E[R] &gt; 4% and P(+50%/30D) &gt; 18%. Watch: SM flow or rel. strength &gt; 1σ. Otherwise Research.
      </div>
    </div>
  );
}
