import { createFileRoute } from "@tanstack/react-router";
import { data as D, DATA_SOURCE, type DataState } from "@/lib/data";
import { relTime } from "@/lib/format";
import { DataQualityIndicator, KV, MetricStrip, PageHeader, Panel, Tag, dataStateLabel } from "@/components/terminal/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "System & Data Quality — crypto-analyst" },
      { name: "description", content: "Provider health, latency, coverage, staleness and explicit NO DATA / STALE / API ERROR states for every ingestion source." },
      { property: "og:title", content: "System & Data Quality — crypto-analyst" },
      { property: "og:description", content: "Pipeline and data-quality monitor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: System,
});

const NOW = new Date(D.MOCK_AS_OF).getTime() + 120000;
const na = (v: number | null | undefined, f: (n: number) => string, state: DataState) => (v === null || v === undefined ? <span className="text-text-3">{state === "not_applicable" ? "N/A" : "—"}</span> : f(v));

function System() {
  const p = D.providers.data!;
  const ok = p.filter((x) => x.staleness === "ok").length;
  const applicable = p.filter((x) => x.staleness !== "not_applicable").length;
  const q = p.filter((x) => x.quality !== null).map((x) => x.quality!);
  return (
    <div className="space-y-3">
      <PageHeader title="System · Data quality" sub="Bad data is shown, not hidden. Model outputs that depend on stale or missing sources are down-weighted and flagged on their pages." right={DATA_SOURCE === "mock" ? <Tag tone="warn">Frontend running on mock data source</Tag> : undefined} />
      <MetricStrip items={[
        { label: "Providers healthy", value: `${ok} / ${applicable}` },
        { label: "Composite data quality", value: `${((q.reduce((a, b) => a + b, 0) / q.length) * 100).toFixed(1)}%` },
        { label: "Rows processed 24h", value: "11.53M" },
        { label: "API errors 24h", value: String(p.reduce((a, x) => a + (x.apiErrors24h ?? 0), 0)), tone: "neg" },
        { label: "Model version", value: D.system.data!.modelVersion },
        { label: "Last full pipeline run", value: relTime(D.system.data!.lastUpdate, NOW) },
        { label: "Health", value: D.system.data!.health, tone: "neg" },
      ]} />
      <Panel title="Provider status" dense>
        <table className="w-full text-[11px]">
          <thead className="border-b">
            <tr>{["Provider", "Domain", "State", "Last success", "Latency", "Rows", "Missing", "Errors 24h", "Coverage", "History", "Quality"].map((h, i) => <th key={h} className={cn("label-xs font-medium h-7 px-3", i < 3 ? "text-left" : "text-right")}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {p.map((x) => (
              <tr key={x.provider} className={cn("border-b border-border/60 row-hover", x.staleness === "api_error" && "bg-neg/5")}>
                <td className="px-3 h-8 text-text-1">{x.provider}</td>
                <td className="px-3 text-text-2">{x.domain}</td>
                <td className="px-3"><DataQualityIndicator state={x.staleness} /></td>
                <td className="px-3 text-right num">{x.lastSuccess ? relTime(x.lastSuccess, NOW) : <span className="text-text-3">never</span>}</td>
                <td className="px-3 text-right num">{na(x.latencyMs, (n) => `${n} ms`, x.staleness)}</td>
                <td className="px-3 text-right num">{na(x.rows, (n) => n.toLocaleString(), x.staleness)}</td>
                <td className={cn("px-3 text-right num", (x.missingPct ?? 0) > 3 && "text-warn")}>{na(x.missingPct, (n) => `${n.toFixed(1)}%`, x.staleness)}</td>
                <td className={cn("px-3 text-right num", (x.apiErrors24h ?? 0) > 5 && "text-neg")}>{na(x.apiErrors24h, (n) => String(n), x.staleness)}</td>
                <td className="px-3 text-right num">{na(x.coverage, (n) => `${(n * 100).toFixed(0)}%`, x.staleness)}</td>
                <td className="px-3 text-right num">{na(x.historyDays, (n) => `${n}d`, x.staleness)}</td>
                <td className={cn("px-3 text-right num", x.quality !== null && x.quality < 0.8 && "text-warn")}>{na(x.quality, (n) => `${(n * 100).toFixed(0)}%`, x.staleness)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div className="grid grid-cols-12 gap-3">
        <Panel title="State definitions" className="col-span-12 lg:col-span-4">
          <ul className="text-[11px] space-y-1.5">
            {(Object.keys(dataStateLabel) as DataState[]).map((s) => (
              <li key={s} className="flex gap-3"><DataQualityIndicator state={s} /><span className="text-text-3">{{ ok: "Updated within SLA, schema valid.", no_data: "Source configured, no rows ever ingested.", stale: "Last success older than SLA (per-provider).", api_error: "Consecutive request failures; last good snapshot retained but flagged.", not_applicable: "Source not relevant to this entity or not yet configured." }[s]}</span></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Pipeline" className="col-span-12 lg:col-span-4">
          <KV rows={[
            { k: "Scheduler", v: "Awaiting backend" },
            { k: "Feature store rows", v: "Awaiting backend" },
            { k: "Model registry", v: "xs-prob v0.4.2 (mock)" },
            { k: "Last retrain", v: "2026-09-14" },
            { k: "Drift (PSI, features)", v: "0.08" },
            { k: "Drift (PSI, predictions)", v: "0.05" },
          ]} />
        </Panel>
        <Panel title="Integration status" className="col-span-12 lg:col-span-4">
          <p className="text-[11.5px] text-text-2 leading-relaxed">
            The frontend consumes typed contracts from a single data facade. The current source is <span className="num text-warn">mock</span>; all figures are synthetic and uncalibrated. Switching the facade to the live API surfaces real provider health here and removes the development banner.
          </p>
        </Panel>
      </div>
    </div>
  );
}
