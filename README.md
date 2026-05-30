# Shape Of It

Shape Of It is a visual answer app for everyday curiosity. Ask a plain-English data question and get a clear, interactive chart with visible source labeling, categories, daily visual stories, and comparison support.

## What Works Now

- Daily Visual Story homepage
- Ask-anything query interface
- Category prompt browsing
- Richer daily story headlines and plain-language context
- Clarification options for vague queries
- Multi-series charts with legends, tooltips, and stat cards
- Clickable chart points with local context and notes
- Compare-with flow for layering a second idea onto the current chart
- One-click comparison presets for common questions like wages vs inflation and rates vs home prices
- PNG chart export for sharing outside the app
- Keyless live routes for U.S. Treasury public debt and CoinGecko crypto prices
- Keyless FRED macro charts for inflation, mortgage rates, unemployment, Fed funds, gas prices, wages, food inflation, and home prices
- FRED-backed rent CPI and indexed rent-vs-wages comparisons
- Keyless World Bank charts for world population, urbanization, life expectancy, and largest countries by population
- Shareable query URLs with copy-link support and encoded chart notes
- Social preview metadata and an Open Graph image route
- Query intent routing for common natural-language asks about groceries, housing, wages, rates, jobs, population, and crypto
- Canonical data catalog for supported/planned series and graceful unsupported-query handling
- Chart planner layer that classifies source, comparison, derived, and unsupported intents before fetching data
- Derived living-cost chart for `cost of living since 1971 inflation adjusted`
- Derived housing-payment pressure chart for affordability questions like `are houses affordable today`
- Partial-answer protection for mixed comparisons such as `college tuition vs wages since 1980`
- Searchable `/api/sources?q=...` catalog endpoint with supported and planned source entries
- Optional Grokipedia reference context through xAI web search, labeled separately from chart data sources
- Source details panel with cadence, transform, series IDs, assumptions, and source links when available
- Copy-link and local-save actions for chart results
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
XAI_API_KEY=
XAI_GROKIPEDIA_MODEL=grok-4.3
```

Without `ANTHROPIC_API_KEY`, the app still runs using local mock chart data.

`NEXT_PUBLIC_SITE_URL` controls canonical/social metadata. Production should use `https://shapeofit.app`.

`XAI_API_KEY` is optional. When configured, chart responses can include Grokipedia reference context using xAI web search restricted to `grokipedia.com`. Grokipedia context is never treated as the numeric data source for a chart.

## Live Data Routes

- `/api/live/money?limit=30` returns a chart spec from the U.S. Treasury Fiscal Data Debt to the Penny API.
- `/api/live/crypto?coins=bitcoin,ethereum&days=30` returns a chart spec from the CoinGecko market chart API.
- `/api/live/macro?q=US%20inflation%20rate%20since%202020` returns a chart spec from public FRED graph data.
- `/api/live/worldbank?q=life%20expectancy%20in%20the%20US%20vs%20Japan%20since%201960` returns a chart spec from the World Bank indicators API.

The main `/api/chart` route automatically uses those live sources for matching money, macro, population, health, and crypto queries, handles direct comparison phrasing such as `wages since 2020 vs US inflation rate since 2020`, and returns a mapped unsupported state when no reliable source exists yet.

The chart route plans the query before fetching. For derived questions such as `cost of living since 1971 inflation adjusted`, the planner chooses a curated transform, required FRED/BLS-backed series, and chart shape before the data adapter runs.

When `XAI_API_KEY` is configured, `/api/chart` may attach `referenceContext` from Grokipedia. This is displayed as contextual reference material, separate from source/cadence/series metadata.

`/api/sources?q=tuition` searches the catalog and can return planned sources as well as supported ones. This lets the planner identify when a query is understood but not fully sourceable yet.

`/api/sources` returns the internal data catalog: source labels, routes, supported topics, cadence, transforms, limitations, and example queries.

See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for the sourcing contract.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment Direction

The production stack is Vercel for Next.js hosting with Cloudflare in front for DNS, WAF, rate limiting, bot controls, and Turnstile. Production domain: `shapeofit.app`. See [docs/STACK.md](docs/STACK.md).

## Product Direction

The first audience is everyday people who understand ideas better visually. The app should feel approachable before it feels professional: daily stories, simple categories, direct comparisons, source clarity, and beautiful interactive charts come before publisher workflows or pro analytics features.

Next likely milestones:

- Expand the chart planner for more derived questions such as affordability, purchasing power, and housing-payment pressure
- Expand the data catalog and source-aware routing beyond the first official-source set
- Add direct College Scorecard support for tuition and school-cost questions
- Add graceful unsupported-query states with nearby supported prompts
- Improve chart beauty, interaction polish, and comparison ergonomics
- Add CSV upload for personal data visualization
- Add account-backed saved charts once the mock sharing loop proves useful
- Add richer ranking/comparison templates for more categories
