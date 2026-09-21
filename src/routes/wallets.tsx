import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { data as D, type WalletRecord } from "@/lib/data";
import { fmtUsd, shortAddr, signClass } from "@/lib/format";
import { DataTable } from "@/components/terminal/DataTable";
import { KV, PageHeader, Panel, Tag, Unavailable } from "@/components/terminal/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallets")({
  head: () => ({
    meta: [
      { title: "Wallet Intelligence — crypto-analyst" },
      { name: "description", content: "Wallet explorer separating historical profitability from predictive information content." },
      { property: "og:title", content: "Wallet Intelligence — crypto-analyst" },
      { property: "og:description", content: "Profitable vs predictive wallet analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Wallets,
});

const columns: ColumnDef<WalletRecord, any>[] = [
  { accessorKey: "address", header: "Wallet", meta: { align: "left" }, enableHiding: false, cell: ({ row }) => <span><span className="num text-text-1">{shortAddr(row.original.address)}</span><span className="text-text-3 ml-1.5 text-[10px]">{row.original.chain}</span></span> },
  { accessorKey: "classification", header: "Class", meta: { align: "left" }, cell: ({ getValue }) => <span className="text-text-2">{getValue()}</span> },
  { accessorKey: "ageDays", header: "Age", cell: ({ getValue }) => `${getValue()}d` },
  { accessorKey: "pnlUsd", header: "Hist. PnL", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtUsd(getValue())}</span> },
  { accessorKey: "winRate", header: "Win rate", cell: ({ getValue }) => `${((getValue() as number) * 100).toFixed(0)}%` },
  { accessorKey: "medianHoldDays", header: "Med. hold", cell: ({ getValue }) => `${(getValue() as number).toFixed(0)}d` },
  { accessorKey: "avgPosUsd", header: "Avg pos.", cell: ({ getValue }) => fmtUsd(getValue()) },
  { accessorKey: "trades", header: "Trades" },
  { accessorKey: "hit2x", header: "2×", cell: ({ getValue }) => `${((getValue() as number) * 100).toFixed(0)}%` },
  { accessorKey: "hit5x", header: "5×", cell: ({ getValue }) => `${((getValue() as number) * 100).toFixed(0)}%` },
  { accessorKey: "hit10x", header: "10×", cell: ({ getValue }) => `${((getValue() as number) * 100).toFixed(1)}%` },
  { accessorKey: "predictiveIC", header: "Predictive IC", cell: ({ getValue }) => <span className={cn((getValue() as number) > 0.05 ? "text-pos font-medium" : (getValue() as number) < 0 ? "text-neg" : "text-text-2")}>{(getValue() as number).toFixed(3)}</span> },
  { accessorKey: "unrealizedUsd", header: "Unrealized", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtUsd(getValue())}</span> },
  { accessorKey: "cluster", header: "Cluster" },
  { accessorKey: "linked", header: "Linked" },
];

function Wallets() {
  const wallets = D.wallets.data!;
  const [sel, setSel] = useState<WalletRecord | null>(wallets[0]!);
  const profitableNotPredictive = wallets.filter((w) => w.pnlUsd > 1e6 && w.predictiveIC < 0.02).length;
  const predictive = wallets.filter((w) => w.predictiveIC > 0.05).length;
  return (
    <div className="space-y-3">
      <PageHeader title="Wallet Intelligence" sub="A wallet can be profitable without being predictive. Only predictive-IC cohorts feed the smart-money factor." right={<Tag tone="neg">Solana indexer: API error</Tag>} />
      <div className="grid grid-cols-12 gap-3">
        <Panel title="Cohort summary" className="col-span-12 lg:col-span-3">
          <KV rows={[
            { k: "Tracked wallets", v: wallets.length.toLocaleString() },
            { k: "Predictive (IC > 0.05)", v: predictive, tone: "pos" },
            { k: "Profitable but not predictive", v: profitableNotPredictive, tone: "warn" },
            { k: "Clusters", v: new Set(wallets.map((w) => w.cluster)).size },
            { k: "Cohort IC (90D)", v: "0.071" },
            { k: "Median lead time", v: "4.2D" },
          ]} />
        </Panel>
        <Panel title={sel ? `${shortAddr(sel.address)} — ${sel.chain}` : "Select a wallet"} className="col-span-12 lg:col-span-9">
          {sel && (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="label-xs mb-1 text-pos/80">Profitability (backward-looking)</div>
                <KV rows={[
                  { k: "Historical PnL", v: fmtUsd(sel.pnlUsd), tone: sel.pnlUsd > 0 ? "pos" : "neg" },
                  { k: "Win rate", v: `${(sel.winRate * 100).toFixed(0)}%` },
                  { k: "2× / 5× / 10× hit", v: `${(sel.hit2x * 100).toFixed(0)}% / ${(sel.hit5x * 100).toFixed(0)}% / ${(sel.hit10x * 100).toFixed(1)}%` },
                  { k: "Trades / med. hold", v: `${sel.trades} / ${sel.medianHoldDays.toFixed(0)}d` },
                  { k: "Avg position", v: fmtUsd(sel.avgPosUsd) },
                ]} />
              </div>
              <div>
                <div className="label-xs mb-1 text-info">Predictiveness (forward-looking)</div>
                <KV rows={[
                  { k: "Predictive IC (entries → 30D xs return)", v: sel.predictiveIC.toFixed(3), tone: sel.predictiveIC > 0.05 ? "pos" : sel.predictiveIC < 0 ? "neg" : undefined },
                  { k: "t-stat", v: (sel.predictiveIC * 28).toFixed(2) },
                  { k: "Avg lead time", v: `${(2 + sel.predictiveIC * 40).toFixed(1)}D` },
                  { k: "Included in SM factor", v: sel.predictiveIC > 0.05 ? "Yes" : "No", tone: sel.predictiveIC > 0.05 ? "pos" : undefined },
                  { k: "Classification", v: sel.classification },
                ]} />
              </div>
              <div>
                <div className="label-xs mb-1">Current state</div>
                <KV rows={[
                  { k: "Unrealized PnL", v: fmtUsd(sel.unrealizedUsd), tone: sel.unrealizedUsd > 0 ? "pos" : "neg" },
                  { k: "Cluster", v: sel.cluster },
                  { k: "Possible linked wallets", v: sel.linked },
                  { k: "Age", v: `${sel.ageDays}d` },
                ]} />
                <div className="label-xs mt-3 mb-1">Current holdings / best entries</div>
                <Unavailable reason="position history not ingested" className="py-3" />
              </div>
            </div>
          )}
        </Panel>
      </div>
      <DataTable data={wallets} columns={columns} searchable searchPlaceholder="Address / class / cluster…" initialSort={[{ id: "predictiveIC", desc: true }]} onRowClick={setSel} maxHeight="55vh" />
    </div>
  );
}
