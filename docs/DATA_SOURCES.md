# Data Source Strategy

Shape Of It should feel open-ended, but the data layer must be intentionally narrow.

The product does not generate fake charts for unmapped questions. A query is supported only when it maps to a canonical catalog entry in `lib/data-catalog.ts`, and that catalog entry points to a real source adapter.

Some questions are not single-source lookups. They are planned first by `lib/chart-planner.ts`, which decides whether the query is a source lookup, comparison, derived transform, or unsupported request. Derived plans must still resolve to cataloged sources before a chart is returned.

## Source Order

1. Official public sources first:
   - FRED for US macro time series.
   - BLS, BEA, Census, and Treasury for official US labor, price, output, demographic, and fiscal data.
   - World Bank for global annual indicators.
2. Specialist market APIs where official sources do not fit:
   - CoinGecko for crypto prices.
   - Polygon or another licensed provider for equities only after licensing and redistribution rules are clear.
3. User-provided files later:
   - CSV upload should become a separate adapter, not a shortcut around source labeling.

## Current Contract

Every supported series should have:

- Stable catalog id.
- Human label.
- Provider and source URL.
- Cadence.
- Unit.
- Optional transform.
- Limitations.
- Example prompts.
- Adapter key used by the chart route.

Every chart response should expose:

- `source`
- `sourceUrl`
- `sourceUpdatedAt`
- `sourceCadence`
- `sourceTransform` when applicable.
- `seriesIds` when the provider has stable ids.

## Derived Charts

Derived charts are allowed when the transform is explicit and the source requirements are cataloged. The first signature derived chart is:

- `cost of living since 1971 inflation adjusted`
- Sources: FRED/BLS all-items CPI, shelter CPI, food CPI, energy CPI, medical CPI, and average hourly earnings.
- Transform: divide each series by all-items CPI, then index to the first shared year.
- Limitation: this is a curated pressure chart, not a household budget calculator.

The housing affordability derived chart is:

- `are houses affordable today`
- Sources: FRED Case-Shiller national home price index, 30-year fixed mortgage rate, and average hourly earnings.
- Transform: estimate 30-year mortgage payment pressure, compare against wages, and index to the first shared year.
- Limitation: excludes taxes, insurance, down payments, credit constraints, and local market differences.

## Partial Answers

If a comparison contains one mapped source and one unmapped or planned source, the app should not answer only the mapped half. It should return an unsupported state explaining what is missing. Example:

- `college tuition vs wages since 1980`
- Wages are mapped through FRED.
- College tuition is understood as a planned College Scorecard source.
- The app should refuse the chart until the tuition adapter exists.

## Product Rule

If a source is not mapped, the UI should say so plainly and offer nearby supported prompts. Trust is more important than apparent coverage.

## Reference Context

Grokipedia can be used as optional context through xAI web search restricted to `grokipedia.com`.

Rules:

- Grokipedia is a reference layer, not a chart data provider.
- Numeric chart values must still come from cataloged data adapters.
- Reference context should be labeled `Context only`.
- Missing or failed Grokipedia context must not block chart generation.
