# Quant Ledger

Build a professional, sophisticated quantitative crypto research dashboard for my existing project crypto-analyst.

This is NOT a generic crypto dashboard, trading terminal, SaaS landing page, or “AI crypto app.”

It should look like a serious institutional-grade quantitative research platform used by a professional systematic trader/researcher.

The visual language should communicate:

quantitative research

statistical rigor

financial markets

institutional software

data integrity

sophisticated analytics

restrained confidence

Avoid anything that looks like a gaming interface, meme-coin dashboard, retail trading app, Web3 casino, or AI-generated “vibe coded” SaaS.

1. OVERALL DESIGN DIRECTION

Use a dark professional interface.

Think:

Bloomberg Terminal

institutional quant research platform

modern hedge-fund internal tooling

professional market-data workstation

high-end financial analytics software

But do NOT simply copy Bloomberg.

The UI should feel modern and minimal while retaining the seriousness of financial software.

Visual principles

Use:

dark charcoal / near-black backgrounds

subtle borders

restrained contrast

muted typography

dense but readable information

small, precise charts

compact tables

consistent spacing

subtle hover states

restrained accent colors

strong typographic hierarchy

Avoid:

gradients everywhere

glowing cards

neon crypto colors

giant rounded cards

excessive glassmorphism

huge numbers

cartoon icons

emojis

excessive animations

giant hero sections

“AI magic” visual effects

excessive badges

fake-looking confidence meters

decorative illustrations

unnecessarily rounded UI

excessive shadows

The application should feel like a tool that an experienced quant would actually use every day.

2. COLOR SYSTEM

Primary background:

#0B0D0F or similar near-black

Secondary surfaces:

#111418

#15191D

Borders:

subtle neutral gray

low contrast

Text:

primary: off-white

secondary: muted gray

tertiary: darker gray

Use green and red ONLY where they have financial meaning:

Green:

positive returns

positive factor contribution

favorable signal

increasing liquidity

positive flow

Red:

negative returns

risk warnings

negative factor contribution

deterioration

drawdown

Do not make the whole application green/red.

Use one restrained accent color for interactive elements, preferably a muted blue/cyan rather than neon.

3. TYPOGRAPHY

Use a highly readable professional sans-serif.

Prefer:

Inter

IBM Plex Sans

Geist

or another high-quality UI font

Numbers should use tabular/monospaced numerals where appropriate.

Financial numbers need to align cleanly.

Examples:

$2.481M
+18.42%
1.74
63.2%
$428.1K

Avoid oversized typography.

A $2.4M market cap should not take up half the screen.

4. LAYOUT

Use a persistent left sidebar.

Navigation:

OVERVIEW

MARKETS

DISCOVERY

RESEARCH

WALLETS

FACTORS

BACKTESTS

MODELS

PORTFOLIO

ALERTS

SYSTEM

At the bottom:

Data status
Model version
Last update
System health

The sidebar should be compact and elegant.

Main content should use a dense research-oriented layout.

Do not make every section into a giant card.

Use cards only when they improve information hierarchy.

Tables, charts, split panes and structured sections should be heavily used.

5. TOP BAR

Top navigation should contain:

current market regime

BTC price

BTC 24h

total crypto market cap

BTC dominance

volatility indicator

data freshness

system status

Example:

REGIME
Risk-On / Expansion

BTC
$112,481
+2.14%

BTC DOM.
56.2%

VOL
Elevated

DATA
2m ago

SYSTEM
Operational

Keep these compact.

6. OVERVIEW PAGE

The overview page is the main research cockpit.

It should immediately answer:

What is happening in the market?

What assets currently have unusual characteristics?

What signals are appearing?

What does the statistical model currently believe?

What risks are increasing?

Is the data/model pipeline healthy?

Market regime section

Display:

regime classification

BTC trend

BTC volatility

ETH/BTC

breadth

altcoin participation

stablecoin liquidity

funding

open interest

correlation

dispersion

Example:

MARKET REGIME

Risk-On Expansion

Confidence:
calibrated probability, not an arbitrary AI score

Drivers:

BTC trend Positive
Breadth Improving
Liquidity Expanding
Funding Neutral
OI Increasing

Do not use circular “AI confidence” gauges.

Prefer simple probability distributions or horizontal bars.

Market statistics

Show compact metrics:

BTC

ETH

total market cap

BTC dominance

24h volume

funding

open interest

liquidations

stablecoin supply

7. DISCOVERY PAGE

This is one of the most important pages.

It should be a quantitative candidate discovery system.

Create a sophisticated sortable/filterable table.

Columns:

Asset

Price

Market Cap

Liquidity

24h Volume

7D Return

30D Return

Relative Strength

Smart Money Flow

Holder Growth

Social Velocity

Funding

OI Change

Token Unlock Risk

Fundamental Growth

Regime

P(+20%)

P(+50%)

P(+100%)

Expected Return

Downside Risk

Signal Status

The probabilities must look like statistical outputs, not “AI predictions.”

Example:

P(+50% / 30D)
28.4%

P(-20% before +50%)
41.7%

Expected return
+8.2%

Do NOT label something simply:

BUY 97%

Instead use language such as:

Positive Expected Alpha

Watch

Research

Signal

Deteriorating

Avoid

But these statuses must be generated from explicit quantitative rules.

8. TOKEN RESEARCH PAGE

Clicking an asset opens a detailed research page.

Example:

BTC / ETH / SOL / any discovered token

Header:

Asset name
Ticker
chain
price
market cap
liquidity
24h volume

Then:

Price / Structure

Professional interactive chart.

Allow:

1H

4H

1D

1W

1M

Overlay optional:

market regime

volume

liquidity

major events

smart-money accumulation

unlock events

Avoid excessive indicators.

Statistical Outlook

Show:

Probability of +20% within 7D
Probability of +50% within 30D
Probability of +100% within 90D

Probability of -20% before +50%

Expected return

Expected volatility

Expected drawdown

These should be presented as distributions, not just single numbers.

Example:

30D Forward Return Distribution

P10 -31%
P25 -12%
P50 +14%
P75 +38%
P90 +81%

This is much more useful than saying:

“AI Score: 91/100”

Factor decomposition

Show which measurable factors are contributing to the current model output.

Example:

Momentum +++
Relative Strength ++
Smart Money +++
Liquidity ++
Social Momentum +
Fundamentals ++
Tokenomics -
Funding -
Regime +++

Use a clean horizontal contribution chart.

Do not use arbitrary decorative scores.

Smart Money

Show:

smart-wallet accumulation

smart-wallet net flow

number of relevant wallets

accumulation velocity

wallet concentration

new smart wallets

historical success rate

average lead time

historical 2x / 5x / 10x hit rate

Important:

Distinguish:

“wallet historically profitable”

from:

“wallet historically predictive of future returns.”

Tokenomics

Show:

circulating supply

total supply

max supply

inflation

emissions

upcoming unlocks

team allocation

VC allocation

treasury

staking emissions

burns

buybacks

Include:

Unlock / Market Cap

Unlock / Average Daily Volume

Supply expansion over:

30D
90D
180D

Fundamentals

Show:

TVL

fees

revenue

active users

transactions

developer activity

GitHub activity

treasury

growth rates

Focus on trends rather than isolated numbers.

Derivatives

Show:

funding

open interest

OI change

basis

liquidations

perp volume

spot/perp ratio

Include divergence detection.

Example:

Price ↑
OI ↑
Funding ↑

Potential leverage expansion.

Social / Narrative

Show:

mention velocity

unique authors

new authors

engagement velocity

sentiment

narrative classification

narrative novelty

account quality

bot/coordination probability

Do not create a giant “sentiment score.”

Show the underlying measurements.

Counter-thesis

Every research page should include:

WHAT COULD MAKE THIS THESIS WRONG?

Examples:

liquidity deterioration

smart-money distribution

upcoming unlock

funding overheating

declining fundamentals

social activity becoming highly concentrated

BTC regime deterioration

This should be a serious research section, not an AI-generated motivational paragraph.

9. FACTOR LAB

Create a research environment for testing whether individual factors actually contain predictive information.

Users should be able to select:

Factor:

Momentum
Relative Strength
Smart Money Flow
Holder Growth
Liquidity
Social Velocity
Funding
OI
TVL Growth
Revenue Growth
Unlock Risk
etc.

Then select:

Target:

+20% / 7D
+50% / 30D
+100% / 90D
Forward Return
Excess Return vs BTC
Maximum Drawdown

Show:

sample size

hit rate

average forward return

median return

IC

rank IC

Sharpe

max drawdown

turnover

statistical significance

stability across periods

stability across market regimes

Most importantly:

show whether the factor survives out-of-sample testing.

Example:

IN-SAMPLE

IC: 0.081

OUT-OF-SAMPLE

IC: 0.046

OOS Sharpe: 1.31

This makes the system look like an actual research platform.

10. BACKTEST LAB

Create a professional backtesting interface.

Users should define:

Universe

Date range

Entry conditions

Factors

Thresholds

Holding period

Exit conditions

Fees

Slippage

Liquidity constraints

Position sizing

Portfolio limits

Then run the backtest.

Results:

CAGR

Sharpe

Sortino

Calmar

Max Drawdown

Win Rate

Profit Factor

Turnover

Average Holding Period

Exposure

Number of Trades

Return Distribution

Drawdown Curve

Monthly Returns

Regime Breakdown

Long/Short Breakdown

Market-cap Breakdown

Sector Breakdown

Most importantly:

IN-SAMPLE

VALIDATION

OUT-OF-SAMPLE

These must be visually separated.

Never present a backtest as valid simply because it has a high historical return.

11. EDGE REGISTRY

Create a database-like interface containing discovered statistical edges.

Each edge should contain:

Edge ID

Hypothesis

Universe

Factor

Target

Holding Period

Sample Size

In-Sample Performance

OOS Performance

Sharpe

IC

Drawdown

Turnover

Regime Dependence

Parameter Stability

Data Quality

Last Tested

Status

Statuses:

RESEARCH

VALIDATED

ACTIVE

DEGRADING

SUSPENDED

RETIRED

This should look like a research database, not a collection of flashy cards.

12. WALLET INTELLIGENCE

Create a professional wallet explorer.

For each wallet:

Wallet address

Chain

Age

Historical PnL

Win Rate

Median Hold Time

Average Position Size

Number of Trades

2x hit rate

5x hit rate

10x hit rate

Predictive IC

Best historical entries

Current holdings

Current unrealized PnL

Wallet classification

Possible linked wallets

Wallet cluster

Important distinction:

A wallet can be profitable without being predictive.

Show these as separate metrics.

13. PORTFOLIO

Portfolio page should show:

Current positions

Position size

Entry

Current price

Unrealized P/L

Realized P/L

Expected return

Expected volatility

Downside risk

Liquidity

Portfolio contribution

Correlation

Factor exposure

Sector exposure

Chain exposure

Market-cap exposure

Risk contribution

Also show:

Portfolio expected return

Portfolio volatility

Portfolio Sharpe estimate

Maximum drawdown estimate

Liquidity-adjusted exposure

Do not make this look like a retail broker app.

14. ALERTS

Create a clean event-driven alert system.

Categories:

INFO

SIGNAL

THESIS

RISK

PORTFOLIO

Examples:

SIGNAL
Smart-money accumulation increased 3.2σ above baseline.

RISK
Liquidity decreased 27% over 24h.

THESIS
Upcoming unlock represents 18.4% of current circulating supply.

REGIME
BTC volatility regime transitioned to high-volatility.

Alerts should be concise and data-backed.

15. DATA QUALITY

Create a system/data-health page.

Show:

Provider

Last successful update

Latency

Rows processed

Missing data

Stale data

API errors

Coverage

Historical depth

Data quality score

Do not hide bad data.

Explicitly distinguish:

NO DATA

STALE DATA

API ERROR

NOT APPLICABLE

This is critical.

16. AI RESEARCH ASSISTANT

AI should be a secondary layer.

Do NOT make the AI the source of the quantitative signal.

The AI can:

explain model outputs

summarize news

classify events

investigate anomalies

summarize protocol documentation

analyze governance proposals

summarize GitHub activity

identify potential counter-theses

generate research reports

propose hypotheses for quantitative testing

The AI must always show the underlying evidence.

Example:

AI RESEARCH NOTE

“Smart-money accumulation increased significantly over the last 72 hours.”

Evidence:

+31% smart-wallet net flow
+18 new historically predictive wallets
2.4σ above 90-day baseline

The AI should never simply say:

“This token looks bullish.”

17. NO FAKE PRECISION

This is extremely important.

Never display:

AI confidence: 97.42%

unless the number is actually statistically calibrated and backed by the model.

Do not invent data.

Do not fabricate API responses.

Do not create fake backtest results.

If backend data does not exist yet, clearly display:

Data unavailable

or

Awaiting ingestion

Do not populate the dashboard with fake realistic-looking numbers.

For development/demo purposes, create clearly marked mock data only if necessary, and structure it so it can easily be replaced by real backend data.

18. CHART STYLE

Charts should be restrained.

Use:

thin lines

subtle grids

minimal labels

clean axes

tooltips

professional financial chart conventions

Avoid:

giant glowing charts

gradients

excessive colors

unnecessary animations

Charts should prioritize information density.

19. TABLE STYLE

Tables are extremely important.

Use:

sticky headers

column sorting

filtering

search

column visibility

compact rows

consistent numeric alignment

hover highlighting

pagination/virtualization where necessary

Numbers should align by decimal where possible.

Use monospace/tabular numerals for quantitative columns.

20. RESPONSIVENESS

Primary target:

Desktop / MacBook

Secondary:

large tablet

The application is primarily a research workstation, so prioritize desktop information density over mobile-first card stacking.

Still make it usable on smaller screens.

21. INTERACTION DESIGN

Animations should be subtle.

Use transitions around:

100–200ms

No flashy entrance animations.

No bouncing cards.

No particle effects.

No animated gradients.

No unnecessary loading animations.

For expensive operations such as backtests or wallet scans, show professional progress states:

QUEUED

INGESTING DATA

NORMALIZING

CALCULATING FEATURES

RUNNING MODEL

VALIDATING

COMPLETE

22. TECHNICAL REQUIREMENTS

Do not rewrite the entire existing backend unnecessarily.

First inspect the existing project structure and identify:

existing API endpoints

database models

data schemas

available Python modules

existing calculations

existing dashboard functionality

Then build the frontend around the actual backend.

Use a clean architecture so the frontend can consume real API data as the backend develops.

Prefer:

React / TypeScript

Tailwind

shadcn/ui

Recharts or another high-quality charting library

TanStack Table for complex tables

Use reusable components.

Create:

AppShell

Sidebar

TopBar

MetricStrip

DataTable

FactorContributionChart

ProbabilityDistribution

PriceChart

ResearchSection

AlertFeed

DataQualityIndicator

RegimeIndicator

BacktestResults

EdgeRegistryTable

Keep components modular.

23. IMPORTANT PRODUCT PRINCIPLE

This application is not trying to “predict crypto” with a magical AI.

It is a quantitative research system that estimates conditional probabilities and expected returns from historical data.

The UI should communicate that philosophy.

The core question is:

“Given everything that was observable at time t, what has historically happened to assets with similar characteristics?”

Not:

“Will this coin moon?”

The dashboard should make that distinction obvious through its language and design.

24. FINAL VISUAL QUALITY BAR

Before considering the UI complete, ask:

Would this look credible if shown to:

a quantitative researcher?

a hedge fund analyst?

a professional systematic trader?

a data scientist?

If it looks like a crypto influencer dashboard, redesign it.

If it looks like an AI-generated SaaS landing page, redesign it.

If it looks like a casino, redesign it.

If it looks like a serious internal quantitative research terminal, keep it.

Prioritize:

DATA DENSITY
CLARITY
PRECISION
CONSISTENCY
RESEARCH INTEGRITY
PROFESSIONALISM

over visual spectacle.

Build the dashboard so that it feels like a serious piece of financial research infrastructure rather than a flashy crypto product.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a5648945-df37-4708-bc89-594f92cd71db).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
