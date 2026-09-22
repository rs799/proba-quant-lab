import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDiscovery, type DiscoveryRow, type SignalStatus } from "@/lib/data";
import { NA, fmtPct, fmtPrice, fmtProb, fmtUsd, fmtZ, signClass } from "@/lib/format";
import { DataTable } from "@/components/terminal/DataTable";
import { PageHeader, SignalTag } from "@/components/terminal/primitives";
import { QueryState, SourceTag } from "@/components/terminal/QueryState";
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

type V = { getValue: () => any };
const pctCell = (d = 1) => ({ getValue }: V) => <span className={signClass(getValue())}>{fmtPct(getValue(), d)}</span>;
const probCell = () => ({ getValue }: V) => <span className="text-text-1">{fmtProb(getValue())}</span>;
const zCell = () => ({ getValue }: V) => <span className={signClass(getValue(), 0.5)}>{fmtZ(getValue())}</span>;
const fixedCell = (d = 3, suffix = "") => ({ getValue }: V) => {
  const v = getValue();
  return typeof v === "number" ? `${v.toFixed(d)}${suffix}` : NA;
};

const columns: ColumnDef<DiscoveryRow, any>[] = [
  { accessorKey: "symbol", header: "Asset", meta: { align: "left" }, enableHiding: false, cell: ({ row }) => <span><span className="num text-text-1">{row.original.symbol}</span><span className="text-text-3 ml-1.5 text-[10px]">{row.original.chain}</span></span> },
  { accessorKey: "price", header: "Price", cell: ({ getValue }) => fmtPrice(getValue()) },
  { accessorKey: "mcap", header: "FDV", cell: ({ getValue }) => fmtUsd(getValue()) },
  { accessorKey: "liquidity", header: "Liquidity", cell: ({ getValue }) => <span className={cn(typeof getValue() === "number" && getValue() < 2e5 && "text-neg")}>{fmtUsd(getValue())}</span> },
  { accessorKey: "vol24h", header: "Vol 24h", cell: ({ getValue }) => fmtUsd(getValue()) },
  { id: "volLiq", header: "Vol / Liq.", accessorFn: (r) => (r.vol24h !== null && r.liquidity ? r.vol24h / r.liquidity : null), cell: fixedCell(2, "×") },
  { accessorKey: "ret7d", header: "7D", cell: pctCell() },
  { accessorKey: "ret30d", header: "30D", cell: pctCell() },
  { accessorKey: "relStrength", header: "Rel. str.", cell: zCell() },
  { accessorKey: "smartMoneyFlow", header: "SM flow", cell: zCell() },
  { accessorKey: "holderGrowth", header: "Holders 30D", cell: pctCell() },
  { accessorKey: "socialVelocity", header: "Social", cell: zCell() },
  { accessorKey: "funding", header: "Funding", cell: fixedCell(3, "%") },
  { accessorKey: "oiChange", header: "ΔOI", cell: pctCell() },
  { accessorKey: "unlockRisk", header: "Unlock/Mcap", cell: fixedCell(1, "%") },
  { accessorKey: "fundGrowth", header: "Fund. growth", cell: pctCell() },
  { accessorKey: "regime", header: "Regime", cell: ({ getValue }) => <span className={getValue() === "Aligned" ? "text-pos" : getValue() === "Against" ? "text-neg" : "text-text-3"}>{getValue() ?? NA}</span> },
  { accessorKey: "p20", header: "P(+20%/7D)", cell: probCell() },
  { accessorKey: "p50", header: "P(+50%/30D)", cell: probCell() },
  { accessorKey: "p100", header: "P(+100%/90D)", cell: probCell() },
  { accessorKey: "expReturn", header: "E[R] 30D", cell: pctCell() },
  { accessorKey: "downside", header: "P(-20% first)", cell: ({ getValue }) => <span className={cn(typeof getValue() === "number" && getValue() > 0.5 && "text-neg")}>{fmtProb(getValue())}</span> },
  { accessorKey: "status", header: "Status", enableHiding: false, cell: ({ getValue }) => <SignalTag s={getValue()} />, sortingFn: (a, b) => STATUSES.indexOf(a.original.status as SignalStatus) - STATUSES.indexOf(b.original.status as SignalStatus) },
];

function Discovery() {
  const nav = useNavigate();
  const query = useDiscovery();
  const [status, setStatus] = useState<SignalStatus | "All" | "Unclassified">("All");
  const [minLiq, setMinLiq] = useState(0);

  const all = query.data?.data ?? [];
  const rows = useMemo(
    () =>
      all.filter(
        (r) =>
          (status === "All" || (status === "Unclassified" ? r.status === null : r.status === status)) &&
          (r.liquidity ?? 0) >= minLiq,
      ),
    [all, status, minLiq],
  );
  const counts = useMemo(
    () => Object.fromEntries([...STATUSES, "Unclassified"].map((s) => [s, all.filter((r) => (s === "Unclassified" ? r.status === null : r.status === s)).length])),
    [all],
  );

  return (
    <div>
      <PageHeader
        title="Discovery"
        sub="Given what was observable at t, what has historically happened to assets with similar characteristics? Model features not yet emitted by the backend are shown as unavailable, never imputed."
        right={<SourceTag env={query.data} />}
      />
      <div className="flex gap-1 mb-2 text-[10px] flex-wrap">
        {(["All", ...STATUSES, "Unclassified"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn("border px-2 h-6 uppercase tracking-wide rounded-sm transition-colors", status === s ? "border-primary/60 text-text-1 bg-surface-2" : "border-border text-text-3 hover:text-text-1")}>
            {s} <span className="num text-text-3 ml-1">{s === "All" ? all.length : counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      <QueryState query={query} emptyReason="the screener has not written any candidates yet">
        {() => (
          <DataTable
            data={rows}
            columns={columns}
            searchable
            searchPlaceholder="Symbol / chain…"
            pageSize={50}
            initialSort={[{ id: "liquidity", desc: true }]}
            onRowClick={(r) => nav({ to: "/research/$symbol", params: { symbol: r.symbol } })}
            toolbar={
              <label className="flex items-center gap-1.5 text-[10px] text-text-3">
                Min liquidity
                <select value={minLiq} onChange={(e) => setMinLiq(Number(e.target.value))} className="h-6 bg-surface-2 border border-border px-1 text-[11px] text-text-1 rounded-sm outline-none">
                  <option value={0}>Any</option><option value={1e5}>$100K</option><option value={5e5}>$500K</option><option value={2e6}>$2M</option>
                </select>
              </label>
            }
          />
        )}
      </QueryState>
      <div className="mt-2 text-[10px] text-text-3 leading-relaxed">
        <span className="uppercase tracking-wide text-text-2">Status rules</span> — a candidate is classified only when the required inputs exist. Avoid: liquidity &lt; $2M or unlock/mcap &gt; 25%. Deteriorating: SM flow &lt; −1.5σ or (7D &lt; −12% and ΔOI &gt; 15%). Positive Expected Alpha: E[R] &gt; 8%, P(+50%/30D) &gt; 25%, P(−20% first) &lt; 45%, regime aligned. Signal: E[R] &gt; 4% and P(+50%/30D) &gt; 18%. Watch: SM flow or rel. strength &gt; 1σ. Rows sourced from <span className="num">/candidates</span> currently expose screen fields only (FDV, liquidity, 24h volume) — all model outputs read {NA} until the backend emits them.
      </div>
    </div>
  );
}
