# ChartQuery

ChartQuery is a visual learning app for everyday curiosity. Ask a plain-English data question and get a clear, interactive chart with a short takeaway, visible data-confidence labeling, categories, daily visual stories, and comparison support.

## What Works Now

- Daily Visual Story homepage
- Ask-anything query interface
- Category prompt browsing
- Richer daily story headlines, plain-language context, and "why this matters" explanations
- Clarification options for vague queries
- Multi-series charts with legends, tooltips, and stat cards
- Clickable chart points with "what happened here?" explanations and local notes
- Compare-with flow for layering a second idea onto the current chart
- Keyless live routes for U.S. Treasury public debt and CoinGecko crypto prices
- Keyless FRED macro charts for inflation, mortgage rates, unemployment, Fed funds, gas prices, wages, food inflation, and home prices
- Shareable query URLs with copy-link support
- Source details drawer with freshness, assumptions, and source links when available
- Data freshness badges for approximate, historical estimate, uploaded, and live-ready sources
- Anthropic Claude support when `ANTHROPIC_API_KEY` is configured
- Deterministic local mock fallback when no API key is configured

## Run Locally

```bash
npm install
npm run dev
```

The app starts on the default Next.js port unless another port is supplied:

```bash
npm run dev -- -p 3010 -H 127.0.0.1
```

## Environment

Copy `.env.example` to `.env.local` and add keys as needed.

```env
ANTHROPIC_API_KEY=
```

Without `ANTHROPIC_API_KEY`, the app still runs using local mock chart data.

## Live Data Routes

- `/api/live/money?limit=30` returns a chart spec from the U.S. Treasury Fiscal Data Debt to the Penny API.
- `/api/live/crypto?coins=bitcoin,ethereum&days=30` returns a chart spec from the CoinGecko market chart API.
- `/api/live/macro?q=US%20inflation%20rate%20since%202020` returns a chart spec from public FRED graph data.

The main `/api/chart` route automatically uses those live sources for matching money, macro, and crypto queries, then falls back to Claude or local mock data.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Product Direction

The first audience is everyday people who understand ideas better visually. The app should feel approachable before it feels professional: daily stories, simple categories, direct comparisons, and plain-language explanations come before publisher workflows or pro analytics features.

Next likely milestones:

- Add CSV upload for personal data visualization
- Add shareable URLs and image previews
- Add annotations on chart points
