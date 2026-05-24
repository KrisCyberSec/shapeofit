# Project Notes

## Positioning

ChartQuery helps people understand the world visually. The core interaction is simple: ask a question, see the data, and get a clear explanation of what matters.

## Design Principles

- Visual first, but never mysterious
- Plain language over analyst jargon
- Data confidence must always be visible
- Comparison should be easy because differences make patterns click
- Daily stories should make the app worth opening even before the user has a question

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
- Keyless World Bank route for population, urbanization, life expectancy, and country rankings
- Shareable query URLs and source-trust details
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

## Stack Direction

Use Vercel as the primary Next.js host and Cloudflare as the DNS/security edge. Keep new work portable by default: standard Next.js route handlers, platform-neutral environment variables, and no Netlify-specific product services. The live Vercel MVP is `https://chartquery.vercel.app`; the next infrastructure step is attaching a custom domain through Cloudflare.
