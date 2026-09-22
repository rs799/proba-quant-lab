/**
 * Live backend adapter.
 *
 * All requests go through the same-origin server proxy at /api/backend/*,
 * which attaches the X-API-Key header server-side. The key is never present
 * in client code or in browser network requests.
 *
 * Fields the backend does not (yet) provide are returned as `null`, never
 * as invented values.
 */
import type {
  AlertItem,
  DiscoveryRow,
  EdgeRecord,
  Envelope,
  Num,
  Position,
  WalletRecord,
} from "./types";

const PROXY = "/api/backend";

function nowIso() {
  return new Date().toISOString();
}

function ok<T>(data: T): Envelope<T> {
  return { source: "api", asOf: nowIso(), state: "ok", data };
}
function empty<T>(): Envelope<T> {
  return { source: "api", asOf: nowIso(), state: "no_data", data: null };
}
function failed<T>(error: string): Envelope<T> {
  return { source: "api", asOf: nowIso(), state: "api_error", data: null, error };
}

async function get<T>(path: string): Promise<Envelope<T>> {
  try {
    const res = await fetch(`${PROXY}${path}`, { headers: { Accept: "application/json" } });
    const text = await res.text();
    if (!res.ok) return failed<T>(`HTTP ${res.status} — ${text.slice(0, 180)}`);
    const parsed = text ? (JSON.parse(text) as T) : null;
    if (parsed === null || (Array.isArray(parsed) && parsed.length === 0)) return empty<T>();
    return ok(parsed);
  } catch (err) {
    return failed<T>(err instanceof Error ? err.message : String(err));
  }
}

/* ------------------------------ coercion ------------------------------ */

const num = (v: unknown): Num => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);
const pick = (o: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};

/* ------------------------------ mappers ------------------------------- */

/** GET /candidates — discovery universe (screen output, no model features yet). */
function mapCandidate(raw: Record<string, unknown>): DiscoveryRow {
  const address = str(pick(raw, "contract_address", "token_address", "address") as string);
  return {
    symbol: String(pick(raw, "ticker", "symbol") ?? "—"),
    name: String(pick(raw, "name", "ticker", "symbol") ?? "—"),
    chain: String(pick(raw, "chain") ?? "—"),
    ...(address ? { address } : {}),
    price: num(pick(raw, "price", "price_usd")),
    mcap: num(pick(raw, "fdv", "market_cap", "mcap")),
    liquidity: num(pick(raw, "liquidity", "liquidity_usd")),
    vol24h: num(pick(raw, "volume_24h", "vol24h")),
    ret7d: num(pick(raw, "return_7d", "ret7d")),
    ret30d: num(pick(raw, "return_30d", "ret30d")),
    relStrength: num(pick(raw, "relative_strength")),
    smartMoneyFlow: num(pick(raw, "smart_money_flow")),
    holderGrowth: num(pick(raw, "holder_growth")),
    socialVelocity: num(pick(raw, "social_velocity")),
    funding: num(pick(raw, "funding_rate", "funding")),
    oiChange: num(pick(raw, "oi_change")),
    unlockRisk: num(pick(raw, "unlock_risk")),
    fundGrowth: num(pick(raw, "fundamental_growth")),
    regime: null,
    p20: num(pick(raw, "p_up_20_7d")),
    p50: num(pick(raw, "p_up_50_30d")),
    p100: num(pick(raw, "p_up_100_90d")),
    expReturn: num(pick(raw, "expected_return")),
    downside: num(pick(raw, "downside_risk")),
    status: null,
  };
}

/** GET /wallets/{token} */
function mapWallet(raw: Record<string, unknown>, chain: string): WalletRecord {
  const pnl = num(pick(raw, "realized_pnl_usd"));
  const holdHours = num(pick(raw, "avg_hold_time_hours"));
  return {
    address: String(pick(raw, "wallet_address", "address") ?? "—"),
    chain,
    ageDays: num(pick(raw, "wallet_age_days")),
    pnlUsd: pnl,
    winRate: num(pick(raw, "win_rate")),
    medianHoldDays: holdHours === null ? null : holdHours / 24,
    avgPosUsd: num(pick(raw, "avg_position_usd")),
    trades: num(pick(raw, "closed_positions", "trades")),
    hit2x: num(pick(raw, "hit_2x")),
    hit5x: num(pick(raw, "hit_5x")),
    hit10x: num(pick(raw, "hit_10x")),
    predictiveIC: num(pick(raw, "predictive_ic")),
    classification: String(pick(raw, "classification") ?? "Unclassified"),
    cluster: String(pick(raw, "cluster") ?? "—"),
    linked: num(pick(raw, "linked_wallets")),
    unrealizedUsd: num(pick(raw, "current_balance")),
    reputation: num(pick(raw, "reputation_score")),
    ...(str(pick(raw, "data_completeness") as string) ? { completeness: String(raw["data_completeness"]) } : {}),
  };
}

const ALERT_CATEGORIES = ["INFO", "SIGNAL", "THESIS", "RISK", "PORTFOLIO", "REGIME"] as const;

function mapAlert(raw: Record<string, unknown>, i: number): AlertItem {
  const level = String(pick(raw, "level", "category", "severity") ?? "INFO").toUpperCase();
  const category = (ALERT_CATEGORIES as readonly string[]).includes(level)
    ? (level as AlertItem["category"])
    : "INFO";
  const evidence = Array.isArray(raw["evidence"]) ? (raw["evidence"] as unknown[]).map(String) : undefined;
  const asset = str(pick(raw, "ticker", "asset", "symbol") as string);
  return {
    id: String(pick(raw, "id", "alert_id") ?? `alert-${i}`),
    ts: String(pick(raw, "ts", "timestamp", "created_at") ?? nowIso()),
    category,
    ...(asset ? { asset } : {}),
    message: String(pick(raw, "message", "text", "title") ?? "—"),
    ...(evidence ? { evidence } : {}),
  };
}

function mapPosition(raw: Record<string, unknown>): Position {
  return {
    symbol: String(pick(raw, "ticker", "symbol") ?? "—"),
    size: num(pick(raw, "size_usd", "size", "value_usd")),
    entry: num(pick(raw, "entry_price", "entry")),
    price: num(pick(raw, "current_price", "price")),
    unrealized: num(pick(raw, "unrealized_pnl_usd", "unrealized_pnl", "pnl_usd")),
    realized: num(pick(raw, "realized_pnl_usd", "realized_pnl")),
    expReturn: num(pick(raw, "expected_return")),
    expVol: num(pick(raw, "expected_volatility")),
    downside: num(pick(raw, "downside_risk")),
    liquidity: num(pick(raw, "liquidity", "liquidity_usd")),
    contribution: num(pick(raw, "portfolio_contribution")),
    corrBtc: num(pick(raw, "corr_btc")),
    riskContribution: num(pick(raw, "risk_contribution")),
  };
}

const EDGE_STATUSES = ["RESEARCH", "VALIDATED", "ACTIVE", "DEGRADING", "SUSPENDED", "RETIRED"] as const;

function mapEdge(raw: Record<string, unknown>, i: number): EdgeRecord {
  const st = String(pick(raw, "status") ?? "RESEARCH").toUpperCase();
  return {
    id: String(pick(raw, "edge_id", "id") ?? `EDG-${i}`),
    hypothesis: String(pick(raw, "hypothesis", "description") ?? "—"),
    universe: String(pick(raw, "universe") ?? "—"),
    factor: String(pick(raw, "factor") ?? "—"),
    target: String(pick(raw, "target") ?? "—"),
    holding: String(pick(raw, "holding_period", "holding") ?? "—"),
    n: num(pick(raw, "sample_size", "n")),
    isSharpe: num(pick(raw, "is_sharpe", "in_sample_sharpe")),
    oosSharpe: num(pick(raw, "oos_sharpe", "out_of_sample_sharpe")),
    isIC: num(pick(raw, "is_ic", "in_sample_ic")),
    oosIC: num(pick(raw, "oos_ic", "out_of_sample_ic")),
    maxDD: num(pick(raw, "max_drawdown", "max_dd")),
    turnover: num(pick(raw, "turnover")),
    regimeDep: null,
    paramStab: null,
    dataQuality: num(pick(raw, "data_quality")),
    lastTested: String(pick(raw, "last_tested", "updated_at") ?? "—"),
    status: (EDGE_STATUSES as readonly string[]).includes(st) ? (st as EdgeRecord["status"]) : "RESEARCH",
  };
}

/* ------------------------------ fetchers ------------------------------ */

type Row = Record<string, unknown>;

export async function fetchDiscovery(): Promise<Envelope<DiscoveryRow[]>> {
  const res = await get<Row[]>("/candidates");
  if (!res.data) return res as Envelope<DiscoveryRow[]>;
  return { ...res, data: res.data.map(mapCandidate) };
}

export async function fetchAlerts(limit = 100): Promise<Envelope<AlertItem[]>> {
  const res = await get<Row[]>(`/alerts?limit=${limit}`);
  if (!res.data) return res as Envelope<AlertItem[]>;
  return { ...res, data: res.data.map(mapAlert) };
}

export async function fetchHoldings(): Promise<Envelope<Position[]>> {
  const res = await get<Row[]>("/holdings");
  if (!res.data) return res as Envelope<Position[]>;
  return { ...res, data: res.data.map(mapPosition) };
}

export interface PortfolioPayload {
  positions: Position[];
  note?: string;
}

export async function fetchPortfolio(): Promise<Envelope<PortfolioPayload>> {
  const res = await get<{ positions?: Row[]; note?: string }>("/portfolio");
  if (!res.data) return res as Envelope<PortfolioPayload>;
  const positions = (res.data.positions ?? []).map(mapPosition);
  return {
    ...res,
    state: positions.length ? "ok" : "no_data",
    data: { positions, ...(res.data.note ? { note: res.data.note } : {}) },
  };
}

export async function fetchEdges(): Promise<Envelope<EdgeRecord[]>> {
  const res = await get<Row[]>("/edge-registry");
  if (!res.data) return res as Envelope<EdgeRecord[]>;
  return { ...res, data: res.data.map(mapEdge) };
}

export interface TokenWallets {
  ticker: string;
  chain: string;
  address: string | null;
  scannedAt: string | null;
  fdv: Num;
  liquidity: Num;
  volume24h: Num;
  wallets: WalletRecord[];
}

export async function fetchWallets(token: string): Promise<Envelope<TokenWallets>> {
  const res = await get<Row>(`/wallets/${encodeURIComponent(token)}`);
  if (!res.data) return res as Envelope<TokenWallets>;
  const raw = res.data;
  const chain = String(pick(raw, "chain") ?? "—");
  const wallets = Array.isArray(raw["wallets"]) ? (raw["wallets"] as Row[]).map((w) => mapWallet(w, chain)) : [];
  return {
    ...res,
    state: wallets.length ? "ok" : "no_data",
    data: {
      ticker: String(pick(raw, "ticker") ?? token),
      chain,
      address: str(pick(raw, "token_address", "contract_address") as string) ?? null,
      scannedAt: str(pick(raw, "scanned_at") as string) ?? null,
      fdv: num(pick(raw, "fdv")),
      liquidity: num(pick(raw, "liquidity")),
      volume24h: num(pick(raw, "volume_24h")),
      wallets,
    },
  };
}

/* ------------------------------ query keys ---------------------------- */

export const qk = {
  discovery: ["api", "discovery"] as const,
  alerts: ["api", "alerts"] as const,
  holdings: ["api", "holdings"] as const,
  portfolio: ["api", "portfolio"] as const,
  edges: ["api", "edges"] as const,
  wallets: (token: string) => ["api", "wallets", token] as const,
};
