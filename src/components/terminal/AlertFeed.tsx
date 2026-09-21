import { Link } from "@tanstack/react-router";
import type { AlertItem } from "@/lib/data";
import { data as D } from "@/lib/data";
import { cn } from "@/lib/utils";

const tone: Record<AlertItem["category"], string> = {
  INFO: "text-text-3 border-border-strong",
  SIGNAL: "text-pos border-pos/40",
  THESIS: "text-info border-info/40",
  RISK: "text-neg border-neg/40",
  PORTFOLIO: "text-warn border-warn/40",
  REGIME: "text-text-1 border-border-strong",
};

export function AlertFeed({ items, compact }: { items: AlertItem[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-border/60">
      {items.map((a) => (
        <li key={a.id} className="py-2 px-3 row-hover">
          <div className="flex items-start gap-2">
            <span className={cn("border px-1 py-px text-[9.5px] tracking-wide rounded-sm shrink-0 mt-px w-[68px] text-center", tone[a.category])}>{a.category}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                {a.asset && <Link to="/research/$symbol" params={{ symbol: a.asset }} className="num text-[11px] text-text-1 hover:text-primary">{a.asset}</Link>}
                <span className="text-[11.5px] text-text-1">{a.message}</span>
                <span className="ml-auto num text-[10px] text-text-3 shrink-0">{new Date(a.ts).toISOString().slice(5, 16).replace("T", " ")}</span>
              </div>
              {!compact && a.evidence && (
                <ul className="mt-1 text-[10.5px] text-text-3 num space-y-px">
                  {a.evidence.map((e) => <li key={e}>· {e}</li>)}
                </ul>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function useAlerts() { return D.alerts.data!; }
