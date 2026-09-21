import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { data as D, DATA_SOURCE } from "@/lib/data";
import { fmtPct, fmtUsd, relTime } from "@/lib/format";
import { DataQualityIndicator } from "./primitives";

const NAV: { label: string; to: string }[] = [
  { label: "Overview", to: "/" },
  { label: "Markets", to: "/markets" },
  { label: "Discovery", to: "/discovery" },
  { label: "Research", to: "/research/BTC" },
  { label: "Wallets", to: "/wallets" },
  { label: "Factors", to: "/factors" },
  { label: "Backtests", to: "/backtests" },
  { label: "Models", to: "/models" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Alerts", to: "/alerts" },
  { label: "System", to: "/system" },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const sys = D.system.data!;
  return (
    <aside className="w-[168px] shrink-0 border-r bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="h-10 flex items-center px-3 border-b">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-text-1">CRYPTO-ANALYST</span>
      </div>
      <nav className="flex-1 py-2">
        {NAV.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to.split("/").slice(0, 2).join("/"));
          return (
            <Link key={n.to} to={n.to} className={cn("flex items-center h-7 px-3 text-[10.5px] tracking-[0.12em] uppercase border-l-2 transition-colors duration-150", active ? "border-primary text-text-1 bg-surface-2" : "border-transparent text-text-3 hover:text-text-1 hover:bg-surface-2/60")}>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-3 py-2 space-y-1.5 text-[10px]">
        <Row k="Data status" v={<DataQualityIndicator state={sys.dataStatus === "Partial" ? "stale" : "ok"} label={sys.dataStatus} />} />
        <Row k="Model" v={<span className="num text-text-2">{sys.modelVersion}</span>} />
        <Row k="Last update" v={<span className="num text-text-2">{relTime(sys.lastUpdate, new Date(D.MOCK_AS_OF).getTime() + 120000)}</span>} />
        <Row k="Health" v={<DataQualityIndicator state={sys.health === "Degraded" ? "stale" : "ok"} label={sys.health} />} />
      </div>
    </aside>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-text-3 uppercase tracking-wide">{k}</span>{v}</div>;
}

export function TopBar() {
  const t = D.topBar.data!;
  const items: { k: string; v: ReactNode }[] = [
    { k: "Regime", v: <span className="text-text-1">{t.regime}</span> },
    { k: "BTC", v: <><span className="num text-text-1">{fmtUsd(t.btc, 0).replace(/\.0K$/, "K")}</span> <span className={cn("num ml-1", t.btc24h >= 0 ? "text-pos" : "text-neg")}>{fmtPct(t.btc24h)}</span></> },
    { k: "Mcap", v: <span className="num text-text-1">{fmtUsd(t.mcap)}</span> },
    { k: "BTC dom.", v: <span className="num text-text-1">{t.dominance.toFixed(1)}%</span> },
    { k: "Vol", v: <span className="text-warn">{t.vol}</span> },
    { k: "Data", v: <span className="num text-text-1">2m ago</span> },
    { k: "System", v: <DataQualityIndicator state="ok" label={t.system} /> },
  ];
  return (
    <header className="h-10 border-b bg-background flex items-center px-3 gap-5 sticky top-0 z-20 shrink-0 overflow-x-auto">
      {items.map((i) => (
        <div key={i.k} className="flex items-baseline gap-1.5 whitespace-nowrap text-[11px]">
          <span className="label-xs">{i.k}</span>
          {i.v}
        </div>
      ))}
      {DATA_SOURCE === "mock" && (
        <span className="ml-auto text-[9.5px] tracking-[0.12em] uppercase text-warn border border-warn/40 px-1.5 py-px rounded-sm whitespace-nowrap">Development mock data — not calibrated</span>
      )}
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 p-3 min-w-0">{children}</main>
      </div>
    </div>
  );
}
