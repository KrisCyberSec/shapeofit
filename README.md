# ShapeOfIt

ShapeOfIt is a visual answer app for everyday curiosity. Ask a plain-English data question and get a clear, interactive chart with a short takeaway, visible data-confidence labeling, categories, daily visual stories, and comparison support.

## What Works Now

- Daily Visual Story homepage
- Ask-anything query interface
- Category prompt browsing
- Richer daily story headlines, plain-language context, and "why this matters" explanations
- Clarification options for vague queries
- Multi-series charts with legends, tooltips, and stat cards
- Clickable chart points with "what happened here?" explanations and local notes
- Compare-with flow for layering a second idea onto the current chart
- One-click comparison presets for common questions like wages vs inflation and rates vs home prices
- PNG chart export for sharing outside the app
- Keyless live routes for U.S. Treasury public debt and CoinGecko crypto prices
- Keyless FRED macro charts for inflation, mortgage rates, unemployment, Fed funds, gas prices, wages, food inflation, and home prices
- Keyless World Bank charts for world population, urbanization, life expectancy, and largest countries by population
- Shareable query URLs with copy-link support and encoded chart notes
- Social preview metadata and an Open Graph image route
- Query intent routing for common natural-language asks about groceries, housing, wages, rates, jobs, population, and crypto
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
NEXT_PUBLIC_SITE_URL=https://shapeofit.app
ANTHROPIC_API_KEY=
```

Without `ANTHROPIC_API_KEY`, the app still runs using local mock chart data.

`NEXT_PUBLIC_SITE_URL` controls canonical/social metadata. Use the custom production domain once it is connected through Vercel and Cloudflare.

## Live Data Routes

- `/api/live/money?limit=30` returns a chart spec from the U.S. Treasury Fiscal Data Debt to the Penny API.
- `/api/live/crypto?coins=bitcoin,ethereum&days=30` returns a chart spec from the CoinGecko market chart API.
- `/api/live/macro?q=US%20inflation%20rate%20since%202020` returns a chart spec from public FRED graph data.
- `/api/live/worldbank?q=life%20expectancy%20in%20the%20US%20vs%20Japan%20since%201960` returns a chart spec from the World Bank indicators API.

The main `/api/chart` route automatically uses those live sources for matching money, macro, population, health, and crypto queries, then falls back to Claude or local mock data.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment Direction

The production stack is Vercel for Next.js hosting with Cloudflare in front for DNS, WAF, rate limiting, bot controls, and Turnstile. Target domain: `shapeofit.app`. See [docs/STACK.md](docs/STACK.md).

## Product Direction

The first audience is everyday people who understand ideas better visually. The app should feel approachable before it feels professional: daily stories, simple categories, direct comparisons, and plain-language explanations come before publisher workflows or pro analytics features.

Next likely milestones:

- Add CSV upload for personal data visualization
- Add account-backed saved charts once the mock sharing loop proves useful
- Add richer ranking/comparison templates for more categories
- Add lightweight onboarding around what kinds of questions work best
