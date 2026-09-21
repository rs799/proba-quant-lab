/**
 * Data contracts for the research terminal.
 * Every payload carries a `source` and `asOf` so the UI can distinguish
 * real backend output from development mock data, and stale from fresh.
 */

export type DataSource = "mock" | "api";
export type DataState = "ok" | "no_data" | "stale" | "api_error" | "not_applicable";

export interface Envelope<T> {
  source: DataSource;
  asOf: string; // ISO timestamp
  state: DataState;
  data: T | null;
}

export type Regime = "Risk-On / Expansion" | "Risk-On / Late" | "Neutral" | "Risk-Off / Contraction" | "Risk-Off / Capitulation";

export interface RegimeDriver {
  name: string;
  reading: string;
  direction: "pos" | "neg" | "neutral";
}

export interface RegimeSnapshot {
  regime: Regime;
  /** Calibrated probabilities over regimes, sum to 1 */
  probabilities: { regime: Regime; p: number }[];
  drivers: RegimeDriver[];
  metrics: { label: string; value: string; delta?: number; note?: string }[];
}

export interface MarketStat {
  label: string;
  value: string;
  delta?: number; // pct
  sub?: string;
}

export type SignalStatus = "Positive Expected Alpha" | "Signal" | "Watch" | "Research" | "Deteriorating" | "Avoid";

export interface DiscoveryRow {
  symbol: string;
  name: string;
  chain: string;
  price: number;
  mcap: number;
  liquidity: number;
  vol24h: number;
  ret7d: number;
  ret30d: number;
  relStrength: number;
  smartMoneyFlow: number; // z-score
  holderGrowth: number; // pct 30d
  socialVelocity: number; // z-score
  funding: number; // pct 8h
  oiChange: number; // pct 24h
  unlockRisk: number; // unlock / mcap pct 90d
  fundGrowth: number; // pct 30d
  regime: "Aligned" | "Neutral" | "Against";
  p20: number;
  p50: number;
  p100: number;
  expReturn: number;
  downside: number; // P(-20% before +50%)
  status: SignalStatus;
}

export interface Quantiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface FactorContribution {
  factor: string;
  contribution: number; // signed, in units of model logit / bps
}

export interface AlertItem {
  id: string;
  ts: string;
  category: "INFO" | "SIGNAL" | "THESIS" | "RISK" | "PORTFOLIO" | "REGIME";
  asset?: string;
  message: string;
  evidence?: string[];
}

export type EdgeStatus = "RESEARCH" | "VALIDATED" | "ACTIVE" | "DEGRADING" | "SUSPENDED" | "RETIRED";

export interface EdgeRecord {
  id: string;
  hypothesis: string;
  universe: string;
  factor: string;
  target: string;
  holding: string;
  n: number;
  isSharpe: number;
  oosSharpe: number;
  isIC: number;
  oosIC: number;
  maxDD: number;
  turnover: number;
  regimeDep: "Low" | "Medium" | "High";
  paramStab: "Stable" | "Moderate" | "Fragile";
  dataQuality: number;
  lastTested: string;
  status: EdgeStatus;
}

export interface WalletRecord {
  address: string;
  chain: string;
  ageDays: number;
  pnlUsd: number;
  winRate: number;
  medianHoldDays: number;
  avgPosUsd: number;
  trades: number;
  hit2x: number;
  hit5x: number;
  hit10x: number;
  predictiveIC: number;
  classification: string;
  cluster: string;
  linked: number;
  unrealizedUsd: number;
}

export interface Position {
  symbol: string;
  size: number;
  entry: number;
  price: number;
  unrealized: number;
  realized: number;
  expReturn: number;
  expVol: number;
  downside: number;
  liquidity: number;
  contribution: number;
  corrBtc: number;
  riskContribution: number;
}

export interface ProviderHealth {
  provider: string;
  domain: string;
  lastSuccess: string | null;
  latencyMs: number | null;
  rows: number | null;
  missingPct: number | null;
  staleness: DataState;
  apiErrors24h: number | null;
  coverage: number | null;
  historyDays: number | null;
  quality: number | null;
}
