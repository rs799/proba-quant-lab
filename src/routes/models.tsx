import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { data as D, type EdgeRecord, type EdgeStatus } from "@/lib/data";
import { DataTable } from "@/components/terminal/DataTable";
import { EdgeTag, KV, PageHeader, Panel } from "@/components/terminal/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Models & Edge Registry — crypto-analyst" },
      { name: "description", content: "Registry of discovered statistical edges with in-sample vs out-of-sample performance, stability and lifecycle status." },
      { property: "og:title", content: "Edge Registry — crypto-analyst" },
      { property: "og:description", content: "Database of tested statistical edges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Models,
});

const ORDER: EdgeStatus[] = ["ACTIVE", "VALIDATED", "RESEARCH", "DEGRADING", "SUSPENDED", "RETIRED"];
const columns: ColumnDef<EdgeRecord, any>[] = [
  { accessorKey: "id", header: "Edge ID", meta: { align: "left" }, enableHiding: false, cell: ({ getValue }) => <span className="num text-text-1">{getValue()}</span> },
  { accessorKey: "hypothesis", header: "Hypothesis", meta: { align: "left", className: "max-w-[320px] truncate" }, cell: ({ getValue }) => <span className="text-text-2">{getValue()}</span> },
  { accessorKey: "factor", header: "Factor", meta: { align: "left" } },
  { accessorKey: "target", header: "Target", meta: { align: "left" } },
  { accessorKey: "holding", header: "Hold" },
  { accessorKey: "n", header: "N", cell: ({ getValue }) => (getValue() as number).toLocaleString() },
  { accessorKey: "isIC", header: "IS IC", cell: ({ getValue }) => (getValue() as number).toFixed(3) },
  { accessorKey: "oosIC", header: "OOS IC", cell: ({ row }) => <span className={cn(Math.abs(row.original.oosIC) < Math.abs(row.original.isIC) * 0.5 ? "text-neg" : "text-text-1")}>{row.original.oosIC.toFixed(3)}</span> },
  { accessorKey: "isSharpe", header: "IS Sharpe", cell: ({ getValue }) => (getValue() as number).toFixed(2) },
  { accessorKey: "oosSharpe", header: "OOS Sharpe", cell: ({ row }) => <span className={cn(row.original.oosSharpe < row.original.isSharpe * 0.5 ? "text-neg" : "text-pos")}>{row.original.oosSharpe.toFixed(2)}</span> },
  { accessorKey: "maxDD", header: "Max DD", cell: ({ getValue }) => <span className="text-neg">{(getValue() as number).toFixed(1)}%</span> },
  { accessorKey: "turnover", header: "Turnover", cell: ({ getValue }) => `${((getValue() as number) * 100).toFixed(0)}%` },
  { accessorKey: "regimeDep", header: "Regime dep.", cell: ({ getValue }) => <span className={getValue() === "High" ? "text-warn" : ""}>{getValue()}</span> },
  { accessorKey: "paramStab", header: "Param. stab.", cell: ({ getValue }) => <span className={getValue() === "Fragile" ? "text-neg" : getValue() === "Stable" ? "text-pos" : ""}>{getValue()}</span> },
  { accessorKey: "dataQuality", header: "Data Q", cell: ({ getValue }) => <span className={(getValue() as number) < 0.8 ? "text-warn" : ""}>{((getValue() as number) * 100).toFixed(0)}%</span> },
  { accessorKey: "lastTested", header: "Last tested" },
  { accessorKey: "status", header: "Status", enableHiding: false, cell: ({ getValue }) => <EdgeTag s={getValue()} />, sortingFn: (a, b) => ORDER.indexOf(a.original.status) - ORDER.indexOf(b.original.status) },
];

function Models() {
  const [sel, setSel] = useState<EdgeRecord | null>(D.edges.data![0]!);
  const edges = D.edges.data!;
  const counts = ORDER.map((s) => [s, edges.filter((e) => e.status === s).length] as const);
  return (
    <div className="space-y-3">
      <PageHeader title="Models · Edge Registry" sub="Every entry is a falsifiable hypothesis with recorded in-sample and out-of-sample evidence. Status changes are rule-driven." />
      <div className="grid grid-cols-12 gap-3">
        <Panel title="Production model" className="col-span-12 lg:col-span-4">
          <KV rows={[
            { k: "Model", v: "xs-prob v0.4.2" },
            { k: "Type", v: "Gradient-boosted xsec classifier + isotonic calibration" },
            { k: "Targets", v: "+20/7D · +50/30D · +100/90D · DD-first" },
            { k: "Features", v: "41 (from 6 active edges)" },
            { k: "Training window", v: "2021-01 → 2025-07" },
            { k: "OOS Brier (30D)", v: "0.183" },
            { k: "OOS log-loss", v: "0.541" },
            { k: "Calibration slope", v: "0.94" },
            { k: "Last retrain", v: "2026-09-14" },
            { k: "Drift monitor", v: "PSI 0.08 (ok)", tone: "pos" },
          ]} />
        </Panel>
        <Panel title="Registry status" className="col-span-12 lg:col-span-2" dense>
          <ul className="text-[11px] divide-y divide-border/60">
            {counts.map(([s, n]) => <li key={s} className="flex items-center justify-between px-3 h-7"><EdgeTag s={s} /><span className="num text-text-1">{n}</span></li>)}
          </ul>
        </Panel>
        <Panel title={sel ? `${sel.id} — detail` : "Select an edge"} className="col-span-12 lg:col-span-6">
          {sel && (
            <>
              <p className="text-[12px] text-text-1 mb-2">{sel.hypothesis}</p>
              <div className="grid grid-cols-2 gap-x-6">
                <KV rows={[
                  { k: "Universe", v: sel.universe },
                  { k: "Factor → target", v: `${sel.factor} → ${sel.target}` },
                  { k: "Holding period", v: sel.holding },
                  { k: "Sample size", v: sel.n.toLocaleString() },
                  { k: "Regime dependence", v: sel.regimeDep, tone: sel.regimeDep === "High" ? "warn" : undefined },
                  { k: "Parameter stability", v: sel.paramStab, tone: sel.paramStab === "Fragile" ? "neg" : sel.paramStab === "Stable" ? "pos" : undefined },
                ]} />
                <KV rows={[
                  { k: "IS IC / OOS IC", v: `${sel.isIC.toFixed(3)} / ${sel.oosIC.toFixed(3)}` },
                  { k: "IS Sharpe / OOS Sharpe", v: `${sel.isSharpe.toFixed(2)} / ${sel.oosSharpe.toFixed(2)}` },
                  { k: "IC retention", v: `${((sel.oosIC / sel.isIC) * 100).toFixed(0)}%`, tone: sel.oosIC / sel.isIC < 0.5 ? "neg" : "pos" },
                  { k: "Max drawdown", v: `${sel.maxDD.toFixed(1)}%`, tone: "neg" },
                  { k: "Data quality", v: `${(sel.dataQuality * 100).toFixed(0)}%` },
                  { k: "Last tested", v: sel.lastTested },
                ]} />
              </div>
              <div className="mt-2 text-[10.5px] text-text-3">Lifecycle rules: ACTIVE requires OOS IC retention ≥ 50% and rolling 90D IC &gt; 0. DEGRADING after 2 consecutive 30D windows below threshold. SUSPENDED after 3.</div>
            </>
          )}
        </Panel>
      </div>
      <DataTable data={edges} columns={columns} searchable searchPlaceholder="ID / hypothesis / factor…" initialSort={[{ id: "status", desc: false }]} onRowClick={setSel} maxHeight="60vh" />
    </div>
  );
}
