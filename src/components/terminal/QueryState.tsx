import type { ReactNode } from "react";
import type { Envelope } from "@/lib/data";
import { cn } from "@/lib/utils";
import { DataQualityIndicator } from "./primitives";

/**
 * Renders honest states for a live backend query: request in flight,
 * transport failure, upstream error, or an empty (but valid) response.
 * Never substitutes placeholder numbers.
 */
export function QueryState<T>({
  query,
  emptyReason = "backend returned no rows",
  children,
  className,
}: {
  query: { isPending: boolean; isError: boolean; error?: unknown; data?: Envelope<T> | undefined };
  emptyReason?: string;
  children: (data: T, env: Envelope<T>) => ReactNode;
  className?: string;
}) {
  const box = (label: string, detail?: string, tone: "neutral" | "neg" | "warn" = "neutral") => (
    <div className={cn("border border-dashed border-border-strong/70 flex flex-col items-center justify-center gap-1 py-8 text-[11px] tracking-wide uppercase", tone === "neg" ? "text-neg" : tone === "warn" ? "text-warn" : "text-text-3", className)}>
      <span>{label}</span>
      {detail && <span className="text-[10px] normal-case tracking-normal text-text-3 max-w-lg text-center">{detail}</span>}
    </div>
  );

  if (query.isPending) return box("Loading — querying backend");
  if (query.isError) return box("API error", query.error instanceof Error ? query.error.message : "Request failed", "neg");

  const env = query.data;
  if (!env) return box("No data");
  if (env.state === "api_error") return box("API error", env.error, "neg");
  if (env.state === "stale") return box("Stale data", `Last successful update ${env.asOf}`, "warn");
  if (!env.data) return box("Data unavailable", emptyReason);

  return <>{children(env.data, env)}</>;
}

export function SourceTag<T>({ env }: { env: Envelope<T> | undefined }) {
  if (!env) return null;
  return (
    <span className="flex items-center gap-2">
      <DataQualityIndicator state={env.state} />
      <span className="text-[10px] uppercase tracking-wide text-text-3">{env.source === "api" ? "live backend" : "mock"}</span>
    </span>
  );
}
