import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAlertsQuery, type AlertItem } from "@/lib/data";
import { AlertFeed } from "@/components/terminal/AlertFeed";
import { PageHeader, Panel, KV } from "@/components/terminal/primitives";
import { QueryState, SourceTag } from "@/components/terminal/QueryState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — crypto-analyst" },
      { name: "description", content: "Event-driven, data-backed alerts across signal, thesis, risk, portfolio and regime categories." },
      { property: "og:title", content: "Alerts — crypto-analyst" },
      { property: "og:description", content: "Concise, evidence-backed research alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Alerts,
});

const CATS: (AlertItem["category"] | "ALL")[] = ["ALL", "SIGNAL", "THESIS", "RISK", "PORTFOLIO", "REGIME", "INFO"];

function Alerts() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("ALL");
  const query = useAlertsQuery();
  const all = query.data?.data ?? [];
  const items = useMemo(() => all.filter((a) => cat === "ALL" || a.category === cat), [all, cat]);
  return (
    <div className="space-y-3">
      <PageHeader title="Alerts" sub="Every alert cites the measurement that triggered it. Thresholds are defined per rule and versioned." right={<SourceTag env={query.data} />} />
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 xl:col-span-9">
          <div className="flex gap-1 mb-2 text-[10px]">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("border px-2 h-6 tracking-wide rounded-sm transition-colors", cat === c ? "border-primary/60 text-text-1 bg-surface-2" : "border-border text-text-3 hover:text-text-1")}>
                {c} <span className="num ml-1 text-text-3">{c === "ALL" ? all.length : all.filter((a) => a.category === c).length}</span>
              </button>
            ))}
          </div>
          <QueryState query={query} emptyReason="the backend alert feed is empty">
            {() => <Panel dense><AlertFeed items={items} /></Panel>}
          </QueryState>
        </div>
        <Panel title="Active rules" className="col-span-12 xl:col-span-3">
          <KV rows={[
            { k: "SM accumulation z", v: "> 2.5σ / 72h" },
            { k: "Liquidity drawdown", v: "< −20% / 24h" },
            { k: "Unlock / circ. supply", v: "> 10% within 14D" },
            { k: "Funding percentile", v: "> P90 for 3 windows" },
            { k: "Regime transition", v: "P(state) > 0.5 flip" },
            { k: "Risk contribution", v: "> 25% per position" },
            { k: "Social concentration", v: "top-20 authors > 50%" },
            { k: "Ingestion failure", v: "3 consecutive errors" },
          ]} />
          <div className="mt-3 text-[10.5px] text-text-3">Rule definitions are the intended backend contract; only alerts actually emitted by the backend feed are listed on the left.</div>
        </Panel>
      </div>
    </div>
  );
}
