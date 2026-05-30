# Project Notes

## Positioning

Shape Of It helps people understand the world visually. The core interaction is simple: ask a question, see the shape of the answer, and explore the data on your own terms.

## Design Principles

- Visual first, but never mysterious
- Plain language over analyst jargon
- Data confidence must always be visible
- Comparison should be easy because differences make patterns click
- Daily stories should make the app worth opening even before the user has a question
- The product should not tell users why something matters; it should make the data beautiful, legible, and interactive enough for users to follow their own curiosity

## Current Scope

This is a local MVP. It is intentionally not an auth, payment, or database-backed SaaS yet.

Included:

- Local Next.js app
- Claude integration with mock fallback
- Typed chart schema
- Daily story endpoint
- Chart generation endpoint
- Keyless live data routes for Treasury public debt and CoinGecko crypto prices
- Keyless FRED macro route for inflation, rates, jobs, gas prices, wages, and home prices
- FRED-backed rent CPI and indexed rent-vs-wages comparisons
- Keyless World Bank route for population, urbanization, life expectancy, and country rankings
- Canonical data catalog for supported and planned series
- Chart planner layer for source, comparison, derived, and unsupported intents
- Derived living-cost chart for "cost of living since 1971 inflation adjusted"
- Derived housing-payment pressure chart for affordability questions
- Partial-answer protection for mixed supported/unsupported comparisons
- Searchable source catalog endpoint
- Shareable query URLs and source-trust details
- Copy-link and local-save actions for chart results
- Clickable point explanations and local chart notes
- Shareable chart-note URLs
- PNG chart image export and social preview metadata
- Comparison presets for high-value starter questions
- Query intent routing for common everyday phrasing
- Editorial UI and chart rendering

Deferred:

- Accounts
- Payments
- Database persistence
- CSV upload

## Product Todo

### Priority Order

1. Data coverage, source-aware routing, and a clear catalog of supported sources.
2. Chart planning for derived questions that need transforms before fetching data.
3. Graceful unsupported-query states that offer nearby supported questions instead of pretending.
4. First-time visitor flow and interaction clarity.
5. Chart beauty and interaction quality: layout, motion, hover/click states, source visibility, and comparison ergonomics.
6. Share pages with durable chart URLs and social metadata.
7. Daily story archive and stronger editorial rotation.
8. CSV upload for personal data visualization.
9. Account-backed saved charts and collections.
10. Payments and Pro tier.
11. Cloudflare security hardening for real traffic and high-cost routes.

### Data Foundation

Open question: what can Shape Of It answer with real data today, and how honestly does it handle everything else?

Work to do:

- Expand the canonical data catalog with each source, route, supported topic, freshness, limitation, transform, series id, and example query.
- Improve source-aware routing before expanding editorial copy.
- Block partial answers when a comparison contains one mapped and one unmapped source.
- Add direct source adapters for planned but understood questions, starting with College Scorecard tuition data.
- Prefer real sourced charts over broad mock answers.
- For unsupported questions, show a clear unsupported state with nearby supported prompts.
- Avoid confident interpretation when the source is thin, approximate, or missing.
- Treat "why this matters" style copy as optional context, not the product's job.

Success criteria:

- A user can tell when a chart is live, estimated, uploaded, or unsupported.
- The app does not produce fake confidence for weak data.
- Supported topics feel reliable enough to trust.
- Unsupported topics still guide the user toward useful nearby charts.

### First-Time Visitor Flow

Open question: does the site make immediate sense to someone arriving cold, and do they understand what to do next without explanation?

Work to do:

- Review the homepage as a first-time visitor, not as the builder.
- Clarify the primary action: type a question and get a chart.
- Make the daily story feel like an invitation, not a competing entry point.
- Make category prompts teach what kinds of questions work.
- Show a clearer transition from query to chart to source context to follow-up.
- Add lightweight onboarding cues only where they remove uncertainty.
- Test the page with a few cold-start queries and note where the user might hesitate.
- Decide whether the first screen should lead with the query bar, the daily story, or a tighter combination of both.

Success criteria:

- A new visitor can say what Shape Of It does within five seconds.
- A new visitor knows where to click or type first.
- The page makes the chart legible without telling the user what to conclude.
- Follow-up prompts make the next interaction obvious.

## Stack Direction

Use Vercel as the primary Next.js host and Cloudflare as the DNS/security edge. Keep new work portable by default: standard Next.js route handlers, platform-neutral environment variables, and no Netlify-specific product services. The production domain is `shapeofit.app`.

Current production state: `shapeofit.app` and `www.shapeofit.app` are attached to the Vercel project and managed through Cloudflare DNS. Cloudflare remains the planned security edge for WAF, rate limiting, bot controls, and Turnstile as the product adds auth and higher-cost AI flows.
