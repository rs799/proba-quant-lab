/**
 * DEVELOPMENT MOCK DATA
 * ---------------------
 * Every export here is synthetic and exists only so the UI can be developed
 * before the ingestion / model pipeline exists. All values are generated
 * deterministically (seeded) and are NOT statistically calibrated.
 *
 * Replace by implementing the same shapes in `src/lib/data/api.ts`
 * and flipping `DATA_SOURCE` in `src/lib/data/index.ts`.
 */
import type {
  AlertItem, DiscoveryRow, EdgeRecord, Envelope, FactorContribution, MarketStat,
  Position, ProviderHealth, Quantiles, RegimeSnapshot, SignalStatus, WalletRecord,
} from "./types";

// Deterministic PRNG so mock values are stable across renders/SSR.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOCK_AS_OF = "2026-09-21T12:24:00Z";

const envelope = <T,>(data: T): Envelope<T> => ({ source: "mock", asOf: MOCK_AS_OF, state: "ok", data });

// ---------------------------------------------------------------- Regime
export const regime = envelope<RegimeSnapshot>({
  regime: "Risk-On / Expansion",
  probabilities: [
    { regime: "Risk-On / Expansion", p: 0.58 },
    { regime: "Risk-On / Late", p: 0.21 },
    { regime: "Neutral", p: 0.14 },
    { regime: "Risk-Off / Contraction", p: 0.06 },
    { regime: "Risk-Off / Capitulation", p: 0.01 },
  ],
  drivers: [
    { name: "BTC trend", reading: "Positive (above 50D/200D)", direction: "pos" },
    { name: "Breadth", reading: "Improving (62% above 30D MA)", direction: "pos" },
    { name: "Liquidity", reading: "Expanding (+1.8% stable supply 30D)", direction: "pos" },
    { name: "Funding", reading: "Neutral (0.008% / 8h)", direction: "neutral" },
    { name: "Open interest", reading: "Increasing (+6.4% 7D)", direction: "pos" },
    { name: "Correlation", reading: "Falling (avg pairwise 0.61)", direction: "neutral" },
    { name: "Dispersion", reading: "Elevated (30D xsec σ 14.2%)", direction: "pos" },
  ],
  metrics: [
    { label: "BTC 30D realized vol", value: "38.4%", note: "Elevated" },
    { label: "ETH/BTC", value: "0.0412", delta: 1.24 },
    { label: "Breadth (>30D MA)", value: "62%", delta: 4.0 },
    { label: "Alt participation", value: "0.71", note: "Alt vol / BTC vol" },
    { label: "Stablecoin supply 30D", value: "+1.8%" },
    { label: "Funding (agg, 8h)", value: "0.008%" },
    { label: "Open interest 7D", value: "+6.4%" },
    { label: "Avg pairwise corr", value: "0.61", delta: -3.2 },
    { label: "Cross-sec dispersion", value: "14.2%" },
  ],
});

export const topBar = envelope({
  regime: "Risk-On / Expansion",
  btc: 112481,
  btc24h: 2.14,
  mcap: 3.92e12,
  dominance: 56.2,
  vol: "Elevated",
  system: "Operational",
});

export const marketStats = envelope<MarketStat[]>([
  { label: "BTC", value: "$112,481", delta: 2.14 },
  { label: "ETH", value: "$4,631", delta: 3.41 },
  { label: "Total mcap", value: "$3.92T", delta: 1.87 },
  { label: "BTC dominance", value: "56.2%", delta: -0.31 },
  { label: "24h volume", value: "$148.2B", delta: 12.4 },
  { label: "Funding (agg)", value: "0.008%", sub: "8h" },
  { label: "Open interest", value: "$61.4B", delta: 1.9 },
  { label: "Liquidations 24h", value: "$212.4M", sub: "L 61% / S 39%" },
  { label: "Stablecoin supply", value: "$284.1B", delta: 0.42 },
]);

// ---------------------------------------------------------------- Discovery
const NAMES: [string, string, string][] = [
  ["BTC", "Bitcoin", "Bitcoin"], ["ETH", "Ethereum", "Ethereum"], ["SOL", "Solana", "Solana"],
  ["HYPE", "Hyperliquid", "Hyperliquid"], ["SUI", "Sui", "Sui"], ["AAVE", "Aave", "Ethereum"],
  ["LINK", "Chainlink", "Ethereum"], ["PENDLE", "Pendle", "Ethereum"], ["JUP", "Jupiter", "Solana"],
  ["ENA", "Ethena", "Ethereum"], ["ONDO", "Ondo", "Ethereum"], ["TIA", "Celestia", "Celestia"],
  ["ARB", "Arbitrum", "Arbitrum"], ["OP", "Optimism", "Optimism"], ["RAY", "Raydium", "Solana"],
  ["MKR", "Maker", "Ethereum"], ["UNI", "Uniswap", "Ethereum"], ["INJ", "Injective", "Injective"],
  ["SEI", "Sei", "Sei"], ["APT", "Aptos", "Aptos"], ["NEAR", "Near", "Near"], ["TAO", "Bittensor", "Bittensor"],
  ["RENDER", "Render", "Solana"], ["WLD", "Worldcoin", "Optimism"], ["STRK", "Starknet", "Starknet"],
  ["ZK", "ZKsync", "ZKsync"], ["EIGEN", "EigenLayer", "Ethereum"], ["MORPHO", "Morpho", "Ethereum"],
  ["ETHFI", "Ether.fi", "Ethereum"], ["DRIFT", "Drift", "Solana"],
];

/** Explicit, inspectable status rules — not a black box. */
export function classifySignal(r: Omit<DiscoveryRow, "status">): SignalStatus {
  if (r.liquidity < 2e6 || r.unlockRisk > 25) return "Avoid";
  if (r.smartMoneyFlow < -1.5 || (r.ret7d < -12 && r.oiChange > 15)) return "Deteriorating";
  if (r.expReturn > 8 && r.p50 > 0.25 && r.downside < 0.45 && r.regime === "Aligned") return "Positive Expected Alpha";
  if (r.expReturn > 4 && r.p50 > 0.18) return "Signal";
  if (r.smartMoneyFlow > 1 || r.relStrength > 1) return "Watch";
  return "Research";
}

export const discovery = envelope<DiscoveryRow[]>(
  NAMES.map(([symbol, name, chain], i) => {
    const rnd = mulberry32(1000 + i);
    const n = (lo: number, hi: number) => lo + (hi - lo) * rnd();
    const mcap = i < 3 ? [2.23e12, 5.58e11, 1.12e11][i] : Math.exp(n(Math.log(3e7), Math.log(2e10)));
    const price = i < 3 ? [112481, 4631, 241.2][i] : Math.exp(n(Math.log(0.05), Math.log(400)));
    const base = {
      symbol, name, chain, price, mcap,
      liquidity: mcap * n(0.004, 0.06),
      vol24h: mcap * n(0.02, 0.35),
      ret7d: n(-18, 32),
      ret30d: n(-35, 90),
      relStrength: n(-2, 2.6),
      smartMoneyFlow: n(-2.2, 3.4),
      holderGrowth: n(-4, 22),
      socialVelocity: n(-1.5, 3),
      funding: n(-0.02, 0.06),
      oiChange: n(-20, 45),
      unlockRisk: n(0, 32),
      fundGrowth: n(-20, 65),
      regime: (["Aligned", "Aligned", "Neutral", "Against"] as const)[Math.floor(rnd() * 4)],
      p20: n(0.12, 0.55),
      p50: n(0.05, 0.42),
      p100: n(0.01, 0.2),
      expReturn: n(-9, 19),
      downside: n(0.25, 0.65),
    };
    return { ...base, status: classifySignal(base) };
  }),
);

// ---------------------------------------------------------------- Research
export const forwardDist30d: Record<string, Quantiles> = {
  default: { p10: -31, p25: -12, p50: 14, p75: 38, p90: 81 },
  BTC: { p10: -14, p25: -5, p50: 4.2, p75: 12, p90: 24 },
  ETH: { p10: -19, p25: -7, p50: 6.1, p75: 17, p90: 33 },
};

export const factorContribs: FactorContribution[] = [
  { factor: "Regime", contribution: 0.31 },
  { factor: "Smart Money", contribution: 0.28 },
  { factor: "Momentum", contribution: 0.26 },
  { factor: "Relative Strength", contribution: 0.17 },
  { factor: "Liquidity", contribution: 0.14 },
  { factor: "Fundamentals", contribution: 0.12 },
  { factor: "Social Momentum", contribution: 0.06 },
  { factor: "Tokenomics", contribution: -0.09 },
  { factor: "Funding", contribution: -0.11 },
];

export function priceSeries(symbol: string, points = 180) {
  const rnd = mulberry32(symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 7));
  const row = discovery.data!.find((r) => r.symbol === symbol);
  const end = row?.price ?? 100;
  const out: { t: number; close: number; volume: number; regime: 0 | 1 | 2 }[] = [];
  let p = end * (0.55 + rnd() * 0.4);
  const start = new Date(MOCK_AS_OF).getTime() - points * 86400000;
  for (let i = 0; i < points; i++) {
    const drift = ((end / p) ** (1 / (points - i)) - 1) * 0.6;
    p = p * (1 + drift + (rnd() - 0.5) * 0.07);
    out.push({
      t: start + i * 86400000,
      close: p,
      volume: (row?.vol24h ?? 1e8) * (0.5 + rnd()),
      regime: i < points * 0.35 ? 2 : i < points * 0.55 ? 1 : 0,
    });
  }
  out[out.length - 1]!.close = end;
  return out;
}

// ---------------------------------------------------------------- Alerts
export const alerts = envelope<AlertItem[]>([
  { id: "a1", ts: "2026-09-21T12:18:00Z", category: "SIGNAL", asset: "PENDLE", message: "Smart-money accumulation increased 3.2σ above 90D baseline.", evidence: ["+31% smart-wallet net flow / 72h", "+18 historically predictive wallets", "Concentration unchanged (top10 = 41%)"] },
  { id: "a2", ts: "2026-09-21T11:52:00Z", category: "RISK", asset: "SEI", message: "Liquidity decreased 27% over 24h.", evidence: ["Pool depth ±2%: $4.1M → $3.0M", "Volume / liquidity ratio 2.1× 30D mean"] },
  { id: "a3", ts: "2026-09-21T10:40:00Z", category: "THESIS", asset: "ZK", message: "Upcoming unlock represents 18.4% of current circulating supply.", evidence: ["Unlock in 9D", "Unlock / ADV = 6.3 days of volume"] },
  { id: "a4", ts: "2026-09-21T09:05:00Z", category: "REGIME", message: "BTC volatility regime transitioned to high-volatility.", evidence: ["30D realized vol 38.4% (prior 27.1%)", "Threshold: 35% (P70 of 2Y distribution)"] },
  { id: "a5", ts: "2026-09-21T08:31:00Z", category: "PORTFOLIO", asset: "SOL", message: "Position risk contribution exceeded 25% limit.", evidence: ["Risk contribution 27.8%", "Driven by vol expansion, not size change"] },
  { id: "a6", ts: "2026-09-21T07:12:00Z", category: "INFO", message: "Derivatives ingestion completed. 1.42M rows normalized.", evidence: ["Latency 840ms", "0 schema violations"] },
  { id: "a7", ts: "2026-09-20T22:48:00Z", category: "SIGNAL", asset: "HYPE", message: "Price ↑, OI ↑, funding ↑ — potential leverage expansion.", evidence: ["OI +14.2% / 24h", "Funding 0.042% / 8h (P92)"] },
  { id: "a8", ts: "2026-09-20T19:20:00Z", category: "RISK", asset: "ARB", message: "Social activity concentration rising: top 20 authors = 58% of mentions.", evidence: ["Bot / coordination probability 0.34", "Unique authors -12% w/w"] },
]);

// ---------------------------------------------------------------- Edges
export const edges = envelope<EdgeRecord[]>([
  { id: "EDG-0007", hypothesis: "Smart-money net flow z>2 predicts positive 30D excess return vs BTC", universe: "Top 300 ex-stables, liq>$2M", factor: "Smart Money Flow", target: "Excess vs BTC / 30D", holding: "30D", n: 4812, isSharpe: 1.84, oosSharpe: 1.31, isIC: 0.081, oosIC: 0.046, maxDD: -22.4, turnover: 0.42, regimeDep: "Medium", paramStab: "Stable", dataQuality: 0.94, lastTested: "2026-09-19", status: "ACTIVE" },
  { id: "EDG-0012", hypothesis: "Relative strength top decile + rising breadth → P(+20%/7D) uplift", universe: "Top 200", factor: "Relative Strength", target: "+20% / 7D", holding: "7D", n: 9120, isSharpe: 1.42, oosSharpe: 0.98, isIC: 0.062, oosIC: 0.038, maxDD: -18.9, turnover: 0.88, regimeDep: "High", paramStab: "Moderate", dataQuality: 0.97, lastTested: "2026-09-18", status: "VALIDATED" },
  { id: "EDG-0015", hypothesis: "Unlock / ADV > 5 predicts negative 14D forward return", universe: "Tokens with vesting schedules", factor: "Unlock Risk", target: "Forward Return / 14D", holding: "14D", n: 1364, isSharpe: 1.12, oosSharpe: 0.91, isIC: -0.071, oosIC: -0.055, maxDD: -11.2, turnover: 0.21, regimeDep: "Low", paramStab: "Stable", dataQuality: 0.81, lastTested: "2026-09-15", status: "ACTIVE" },
  { id: "EDG-0019", hypothesis: "Social velocity spike (>3σ) predicts mean reversion within 7D", universe: "Top 500", factor: "Social Velocity", target: "Forward Return / 7D", holding: "7D", n: 2210, isSharpe: 0.94, oosSharpe: 0.22, isIC: -0.044, oosIC: -0.009, maxDD: -26.1, turnover: 1.4, regimeDep: "High", paramStab: "Fragile", dataQuality: 0.72, lastTested: "2026-09-12", status: "DEGRADING" },
  { id: "EDG-0021", hypothesis: "Holder growth >10%/30D with flat price precedes breakout", universe: "Mid-cap $100M–$2B", factor: "Holder Growth", target: "+50% / 30D", holding: "30D", n: 886, isSharpe: 1.05, oosSharpe: 0.71, isIC: 0.052, oosIC: 0.029, maxDD: -31.0, turnover: 0.35, regimeDep: "Medium", paramStab: "Moderate", dataQuality: 0.88, lastTested: "2026-09-10", status: "RESEARCH" },
  { id: "EDG-0003", hypothesis: "Funding > P95 predicts negative 3D return (crowded long)", universe: "Perp-listed, OI>$20M", factor: "Funding", target: "Forward Return / 3D", holding: "3D", n: 15480, isSharpe: 1.61, oosSharpe: 0.34, isIC: -0.058, oosIC: -0.012, maxDD: -14.7, turnover: 2.1, regimeDep: "High", paramStab: "Fragile", dataQuality: 0.98, lastTested: "2026-08-30", status: "SUSPENDED" },
  { id: "EDG-0001", hypothesis: "12-1 momentum cross-sectional decile spread", universe: "Top 100", factor: "Momentum", target: "Excess vs BTC / 30D", holding: "30D", n: 21400, isSharpe: 0.88, oosSharpe: -0.11, isIC: 0.031, oosIC: -0.004, maxDD: -44.2, turnover: 0.6, regimeDep: "High", paramStab: "Fragile", dataQuality: 0.99, lastTested: "2026-06-02", status: "RETIRED" },
  { id: "EDG-0024", hypothesis: "Revenue growth >30% q/q with P/F compression → 90D outperformance", universe: "Fee-generating protocols", factor: "Revenue Growth", target: "+100% / 90D", holding: "90D", n: 412, isSharpe: 1.28, oosSharpe: 1.02, isIC: 0.074, oosIC: 0.061, maxDD: -27.8, turnover: 0.18, regimeDep: "Low", paramStab: "Stable", dataQuality: 0.79, lastTested: "2026-09-20", status: "VALIDATED" },
]);

// ---------------------------------------------------------------- Wallets
export const wallets = envelope<WalletRecord[]>(
  Array.from({ length: 24 }, (_, i) => {
    const rnd = mulberry32(500 + i);
    const n = (lo: number, hi: number) => lo + (hi - lo) * rnd();
    const hex = "0123456789abcdef";
    const address = "0x" + Array.from({ length: 40 }, () => hex[Math.floor(rnd() * 16)]).join("");
    const pnl = Math.exp(n(Math.log(2e5), Math.log(4e7))) * (rnd() > 0.15 ? 1 : -1);
    return {
      address,
      chain: ["Ethereum", "Solana", "Arbitrum", "Base"][Math.floor(rnd() * 4)]!,
      ageDays: Math.floor(n(90, 1800)),
      pnlUsd: pnl,
      winRate: n(0.38, 0.72),
      medianHoldDays: n(2, 60),
      avgPosUsd: Math.exp(n(Math.log(1e4), Math.log(2e6))),
      trades: Math.floor(n(40, 900)),
      hit2x: n(0.08, 0.42),
      hit5x: n(0.01, 0.14),
      hit10x: n(0, 0.05),
      predictiveIC: n(-0.03, 0.12),
      classification: ["Early accumulator", "Momentum follower", "Market maker", "Fund / treasury", "Airdrop farmer", "Insider-like"][Math.floor(rnd() * 6)]!,
      cluster: `C-${Math.floor(n(1, 40)).toString().padStart(3, "0")}`,
      linked: Math.floor(n(0, 9)),
      unrealizedUsd: pnl * n(-0.3, 0.6),
    };
  }),
);

// ---------------------------------------------------------------- Portfolio
export const positions = envelope<Position[]>([
  { symbol: "BTC", size: 412000, entry: 98420, price: 112481, unrealized: 58860, realized: 12400, expReturn: 4.2, expVol: 38, downside: 0.22, liquidity: 1, contribution: 0.34, corrBtc: 1, riskContribution: 0.28 },
  { symbol: "ETH", size: 236000, entry: 3980, price: 4631, unrealized: 38600, realized: 0, expReturn: 6.1, expVol: 52, downside: 0.31, liquidity: 1, contribution: 0.2, corrBtc: 0.82, riskContribution: 0.24 },
  { symbol: "SOL", size: 188000, entry: 201, price: 241.2, unrealized: 37600, realized: 8100, expReturn: 9.4, expVol: 71, downside: 0.38, liquidity: 0.9, contribution: 0.16, corrBtc: 0.74, riskContribution: 0.278 },
  { symbol: "HYPE", size: 94000, entry: 38.1, price: 44.9, unrealized: 16800, realized: 0, expReturn: 12.8, expVol: 96, downside: 0.44, liquidity: 0.6, contribution: 0.08, corrBtc: 0.58, riskContribution: 0.12 },
  { symbol: "PENDLE", size: 61000, entry: 4.82, price: 5.31, unrealized: 6200, realized: -1900, expReturn: 11.2, expVol: 88, downside: 0.41, liquidity: 0.5, contribution: 0.05, corrBtc: 0.49, riskContribution: 0.082 },
]);

// ---------------------------------------------------------------- Data quality
export const providers = envelope<ProviderHealth[]>([
  { provider: "CoinGecko", domain: "Prices / mcap", lastSuccess: "2026-09-21T12:22:00Z", latencyMs: 412, rows: 184200, missingPct: 0.1, staleness: "ok", apiErrors24h: 0, coverage: 0.99, historyDays: 2400, quality: 0.98 },
  { provider: "Binance / Bybit / OKX", domain: "Derivatives", lastSuccess: "2026-09-21T12:21:00Z", latencyMs: 840, rows: 1420000, missingPct: 0.4, staleness: "ok", apiErrors24h: 2, coverage: 0.92, historyDays: 1100, quality: 0.94 },
  { provider: "DefiLlama", domain: "TVL / fees / revenue", lastSuccess: "2026-09-21T09:00:00Z", latencyMs: 1210, rows: 61400, missingPct: 3.8, staleness: "stale", apiErrors24h: 1, coverage: 0.81, historyDays: 1500, quality: 0.86 },
  { provider: "On-chain indexer (EVM)", domain: "Wallets / holders", lastSuccess: "2026-09-21T12:10:00Z", latencyMs: 2300, rows: 9820000, missingPct: 1.2, staleness: "ok", apiErrors24h: 0, coverage: 0.74, historyDays: 900, quality: 0.89 },
  { provider: "On-chain indexer (Solana)", domain: "Wallets / holders", lastSuccess: null, latencyMs: null, rows: null, missingPct: null, staleness: "api_error", apiErrors24h: 14, coverage: null, historyDays: null, quality: null },
  { provider: "Token unlock feed", domain: "Vesting schedules", lastSuccess: "2026-09-20T18:00:00Z", latencyMs: 560, rows: 3120, missingPct: 8.4, staleness: "stale", apiErrors24h: 0, coverage: 0.66, historyDays: 700, quality: 0.78 },
  { provider: "Social firehose", domain: "Mentions / authors", lastSuccess: null, latencyMs: null, rows: null, missingPct: null, staleness: "no_data", apiErrors24h: 0, coverage: null, historyDays: null, quality: null },
  { provider: "GitHub", domain: "Developer activity", lastSuccess: "2026-09-21T06:00:00Z", latencyMs: 980, rows: 44100, missingPct: 2.1, staleness: "ok", apiErrors24h: 0, coverage: 0.88, historyDays: 2000, quality: 0.91 },
  { provider: "News / governance", domain: "Events", lastSuccess: null, latencyMs: null, rows: null, missingPct: null, staleness: "not_applicable", apiErrors24h: null, coverage: null, historyDays: null, quality: null },
]);

export const system = envelope({
  dataStatus: "Partial",
  modelVersion: "xs-prob v0.4.2",
  lastUpdate: MOCK_AS_OF,
  health: "Degraded",
});
