import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDiscovery, useWallets, type WalletRecord } from "@/lib/data";
import { fmtUsd, shortAddr, signClass } from "@/lib/format";
import { DataTable } from "@/components/terminal/DataTable";
import { KV, PageHeader, Panel } from "@/components/terminal/primitives";
import { QueryState, SourceTag } from "@/components/terminal/QueryState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallets")({
  head: () => ({
    meta: [
      { title: "Wallet Intelligence — crypto-analyst" },
      { name: "description", content: "Per-token wallet explorer separating historical profitability from predictive information content." },
      { property: "og:title", content: "Wallet Intelligence — crypto-analyst" },
      { property: "og:description", content: "Profitable vs predictive wallet analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Wallets,
});

const fmt3 = (v: number | null) => (v === null ? "—" : v.toFixed(3));
const fmtPctv = (v: number | null, d = 0) => (v === null ? "—" : `${(v * 100).toFixed(d)}%`);
const fmtDays = (v: number | null) => (v === null ? "—" : `${v.toFixed(0)}d`);

const columns: ColumnDef<WalletRecord, any>[] = [
  { accessorKey: "address", header: "Wallet", meta: { align: "left" }, enableHiding: false, cell: ({ row }) => <span><span className="num text-text-1">{shortAddr(row.original.address)}</span><span className="text-text-3 ml-1.5 text-[10px]">{row.original.chain}</span></span> },
  { accessorKey: "classification", header: "Class", meta: { align: "left" }, cell: ({ getValue }) => <span className="text-text-2">{getValue()}</span> },
  { accessorKey: "reputation", header: "Reputation", cell: ({ getValue }) => (getValue() == null ? "—" : (getValue() as number).toFixed(2)) },
  { accessorKey: "completeness", header: "Data completeness", cell: ({ getValue }) => getValue() ?? "—" },
  { accessorKey: "ageDays", header: "Age", cell: ({ getValue }) => fmtDays(getValue()) },
  { accessorKey: "trades", header: "Closed positions", cell: ({ getValue }) => getValue() ?? "—" },
  { accessorKey: "unrealizedUsd", header: "Current balance", cell: ({ getValue }) => <span className={signClass(getValue())}>{fmtUsd(getValue())}</span> },
  { accessorKey: "pnlUsd", header: "Realized PnL", cell: ({ getValue }) => (getValue() === null ? <span className="text-text-3">Awaiting trade history</span> : <span className={signClass(getValue())}>{fmtUsd(getValue())}</span>) },
  { accessorKey: "winRate", header: "Win rate", cell: ({ getValue }) => (getValue() === null ? <span className="text-text-3">—</span> : fmtPctv(getValue())) },
  { accessorKey: "medianHoldDays", header: "Avg hold", cell: ({ getValue }) => (getValue() === null ? "—" : fmtDays(getValue())) },
  { accessorKey: "predictiveIC", header: "Predictive IC", cell: ({ getValue }) => (getValue() === null ? "—" : <span className={cn((getValue() as number) > 0.05 ? "text-pos font-medium" : (getValue() as number) < 0 ? "text-neg" : "text-text-2")}>{fmt3(getValue())}</span>) },
];

function Wallets() {
  const discoveryQ = useDiscovery();
  const tickers = useMemo(() => Array.from(new Set((discoveryQ.data?.data ?? []).map((r) => r.symbol))), [discoveryQ.data]);
  const [ticker, setTicker] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker && tickers.length) setTicker(tickers[0]!);
  }, [tickers, ticker]);

  const walletsQ = useWallets(ticker);
  const payload = walletsQ.data?.data;
  const wallets = payload?.wallets ?? [];
  const [sel, setSel] = useState<WalletRecord | null>(null);
  useEffect(() => setSel(wallets[0] ?? null), [payload]);

  const withReputation = wallets.filter((w) => w.reputation != null);
  const avgReputation = withReputation.length ? withReputation.reduce((a, w) => a + w.reputation!, 0) / withReputation.length : null;
  const withAge = wallets.filter((w) => w.ageDays !== null);
  const avgAge = withAge.length ? withAge.reduce((a, w) => a + w.ageDays!, 0) / withAge.length : null;
  const withIC = wallets.filter((w) => w.predictiveIC !== null);

  return (
    <div className="space-y-3">
      <PageHeader title="Wallet Intelligence" sub="A wallet can be profitable without being predictive. Only predictive-IC cohorts feed the smart-money factor." right={<SourceTag env={walletsQ.data} />} />
      <div className="flex items-center gap-2 text-[11px]">
        <label className="text-text-3">Ticker</label>
        <select value={ticker ?? ""} onChange={(e) => setTicker(e.target.value)} disabled={!tickers.length} className="h-7 bg-surface-2 border border-border px-2 text-[11px] text-text-1 rounded-sm outline-none">
          {!tickers.length && <option value="">No candidates yet</option>}
          {tickers.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-12 gap-3">
        <Panel title="Cohort summary" className="col-span-12 lg:col-span-3">
          <KV rows={[
            { k: "Wallets scanned", v: wallets.length },
            { k: "Avg reputation score", v: avgReputation !== null ? avgReputation.toFixed(2) : "—" },
            { k: "Avg wallet age", v: avgAge !== null ? fmtDays(avgAge) : "—" },
            { k: "Clusters", v: new Set(wallets.map((w) => w.cluster)).size },
            { k: "Wallets with predictive IC", v: withIC.length ? `${withIC.length} / ${wallets.length}` : "Awaiting trade history" },
            { k: "Token FDV / liquidity", v: payload ? `${fmtUsd(payload.fdv)} / ${fmtUsd(payload.liquidity)}` : "—" },
          ]} />
        </Panel>
        <Panel title={sel ? `${shortAddr(sel.address)} — ${sel.chain}` : "Select a wallet"} className="col-span-12 lg:col-span-9">
          {sel && (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="label-xs mb-1 text-pos/80">Profitability (backward-looking)</div>
                <KV rows={[
                  { k: "Realized PnL", v: sel.pnlUsd !== null ? fmtUsd(sel.pnlUsd) : "Awaiting trade history", tone: sel.pnlUsd !== null ? (sel.pnlUsd > 0 ? "pos" : "neg") : undefined },
                  { k: "Win rate", v: sel.winRate !== null ? fmtPctv(sel.winRate) : "Awaiting trade history" },
                  { k: "2× / 5× / 10× hit", v: sel.hit2x !== null ? `${fmtPctv(sel.hit2x)} / ${fmtPctv(sel.hit5x)} / ${fmtPctv(sel.hit10x, 1)}` : "Awaiting trade history" },
                  { k: "Closed positions / avg hold", v: `${sel.trades ?? "—"} / ${sel.medianHoldDays !== null ? fmtDays(sel.medianHoldDays) : "—"}` },
                  { k: "Avg position", v: sel.avgPosUsd !== null ? fmtUsd(sel.avgPosUsd) : "Awaiting trade history" },
                ]} />
              </div>
              <div>
                <div className="label-xs mb-1 text-info">Predictiveness (forward-looking)</div>
                <KV rows={[
                  { k: "Predictive IC (entries → 30D xs return)", v: sel.predictiveIC !== null ? fmt3(sel.predictiveIC) : "Awaiting trade history", tone: sel.predictiveIC !== null ? (sel.predictiveIC > 0.05 ? "pos" : sel.predictiveIC < 0 ? "neg" : undefined) : undefined },
                  { k: "Included in SM factor", v: sel.predictiveIC !== null ? (sel.predictiveIC > 0.05 ? "Yes" : "No") : "—" },
                  { k: "Classification", v: sel.classification },
                  { k: "Data completeness", v: sel.completeness ?? "—" },
                ]} />
              </div>
              <div>
                <div className="label-xs mb-1">Current state</div>
                <KV rows={[
                  { k: "Current balance", v: fmtUsd(sel.unrealizedUsd), tone: sel.unrealizedUsd !== null ? (sel.unrealizedUsd > 0 ? "pos" : "neg") : undefined },
                  { k: "Reputation score", v: sel.reputation != null ? sel.reputation.toFixed(2) : "—" },
                  { k: "Cluster", v: sel.cluster },
                  { k: "Age", v: sel.ageDays !== null ? fmtDays(sel.ageDays) : "—" },
                  { k: "Address", v: sel.address },
                ]} />
              </div>
            </div>
          )}
        </Panel>
      </div>
      <QueryState query={walletsQ} emptyReason={ticker ? `no wallets have been scanned for ${ticker} yet` : "select a ticker with discovered candidates"}>
        {() => <DataTable data={wallets} columns={columns} searchable searchPlaceholder="Address / class / cluster…" initialSort={[{ id: "reputation", desc: true }]} onRowClick={setSel} maxHeight="50vh" />}
      </QueryState>
    </div>
  );
}
