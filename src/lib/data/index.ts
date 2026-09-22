/**
 * Data access facade.
 *
 * Live backend (FastAPI, proxied server-side at /api/backend/*) currently
 * serves: candidates (discovery), wallets/{token}, holdings, alerts,
 * portfolio, edge-registry.
 *
 * Sections with no backend endpoint yet (regime model, factor lab, backtests,
 * provider health, price history) still read the clearly-labelled development
 * mock module and are marked as such in the UI.
 */
import { useQuery } from "@tanstack/react-query";
import * as mock from "./mock";
import * as api from "./api";
import type { DataSource } from "./types";

export const DATA_SOURCE: DataSource = "api";

/** Sections still backed by the labelled development mock module. */
export const MOCK_SECTIONS = [
  "Market regime model",
  "Factor Lab",
  "Backtest Lab",
  "Market aggregates",
  "Provider health",
  "Price history",
] as const;

export const data = mock;
export { classifySignal } from "./mock";
export * from "./types";
export { api };

const COMMON = { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } as const;

export function useDiscovery() {
  return useQuery({ queryKey: api.qk.discovery, queryFn: api.fetchDiscovery, ...COMMON });
}
export function useAlertsQuery() {
  return useQuery({ queryKey: api.qk.alerts, queryFn: () => api.fetchAlerts(), ...COMMON });
}
export function useHoldings() {
  return useQuery({ queryKey: api.qk.holdings, queryFn: api.fetchHoldings, ...COMMON });
}
export function usePortfolio() {
  return useQuery({ queryKey: api.qk.portfolio, queryFn: api.fetchPortfolio, ...COMMON });
}
export function useEdges() {
  return useQuery({ queryKey: api.qk.edges, queryFn: api.fetchEdges, ...COMMON });
}
export function useWallets(token: string | null) {
  return useQuery({
    queryKey: api.qk.wallets(token ?? ""),
    queryFn: () => api.fetchWallets(token!),
    enabled: !!token,
    ...COMMON,
  });
}
