/**
 * Data contracts for the research terminal.
 * Every payload carries a `source` and `asOf` so the UI can distinguish
 * real backend output from development mock data, and stale from fresh.
 *
 * `Num = number | null`: null means the backend does not (yet) provide the
 * measurement. The UI renders it as "—" / "Awaiting ingestion" and never
 * substitutes an invented value.
 */

export type DataSource = "mock" | "api";
export type DataState = "ok" | "no_data" | "stale" | "api_error" | "not_applicable";

export type Num = number | null;

export interface Envelope<T> {
  source: DataSource;
  asOf: string; // ISO timestamp
  state: DataState;
  data: T | null;
  /** Populated when state is "api_error". */
  error?: string;
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
  address?: string;
  price: Num;
  mcap: Num; // FDV when the backend only reports fully diluted valuation
  liquidity: Num;
  vol24h: Num;
  ret7d: Num;
  ret30d: Num;
  relStrength: Num;
  smartMoneyFlow: Num; // z-score
  holderGrowth: Num; // pct 30d
  socialVelocity: Num; // z-score
  funding: Num; // pct 8h
  oiChange: Num; // pct 24h
  unlockRisk: Num; // unlock / mcap pct 90d
  fundGrowth: Num; // pct 30d
  regime: "Aligned" | "Neutral" | "Against" | null;
  p20: Num;
  p50: Num;
  p100: Num;
  expReturn: Num;
  downside: Num; // P(-20% before +50%)
  /** null = not enough ingested inputs to classify */
  status: SignalStatus | null;
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
  n: Num;
  isSharpe: Num;
  oosSharpe: Num;
  isIC: Num;
  oosIC: Num;
  maxDD: Num;
  turnover: Num;
  regimeDep: "Low" | "Medium" | "High" | null;
  paramStab: "Stable" | "Moderate" | "Fragile" | null;
  dataQuality: Num;
  lastTested: string;
  status: EdgeStatus;
}

export interface WalletRecord {
  address: string;
  chain: string;
  ageDays: Num;
  pnlUsd: Num;
  winRate: Num;
  medianHoldDays: Num;
  avgPosUsd: Num;
  trades: Num;
  hit2x: Num;
  hit5x: Num;
  hit10x: Num;
  predictiveIC: Num;
  classification: string;
  cluster: string;
  linked: Num;
  unrealizedUsd: Num;
  /** Backend reputation score (0-100) when provided. */
  reputation?: Num;
  /** e.g. "complete", "age_is_lower_bound" */
  completeness?: string;
}

export interface Position {
  symbol: string;
  size: Num;
  entry: Num;
  price: Num;
  unrealized: Num;
  realized: Num;
  expReturn: Num;
  expVol: Num;
  downside: Num;
  liquidity: Num;
  contribution: Num;
  corrBtc: Num;
  riskContribution: Num;
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
