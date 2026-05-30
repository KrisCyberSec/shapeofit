import {
  DATA_CATALOG,
  resolveSupportedCatalogEntry,
  supportedCatalogEntries,
  supportedPrompts
} from "./data-catalog";
import { bestSupportedCatalogMatch } from "./query-intelligence";

const DEFAULT_PROMPTS = [
  "US inflation rate since 2020",
  "Bitcoin vs Ethereum live over the last 30 days",
  "how many immigrants have come to the United States in the past 20 years",
  "life expectancy in the US vs Japan since 1960",
  "US national debt live last 30 days"
];

export function supportedSourceForQuery(query: string) {
  return resolveSupportedCatalogEntry(query) ?? bestSupportedCatalogMatch(query)?.entry ?? null;
}

export function isSupportedQuery(query: string) {
  return Boolean(supportedSourceForQuery(query));
}

export function nearbySupportedPrompts(query: string, limit = 4) {
  const matched = supportedSourceForQuery(query);
  const prompts = matched
    ? [...matched.examples, ...supportedPrompts()]
    : supportedPrompts();

  return Array.from(new Set([...prompts, ...DEFAULT_PROMPTS])).slice(0, limit);
}

export function sourceRegistrySummary() {
  const byProvider = supportedCatalogEntries().reduce(
    (providers, entry) => {
      const current = providers.get(entry.provider) ?? {
        id: entry.provider,
        label: entry.providerLabel,
        route: entry.route,
        freshness: freshnessForProvider(entry.provider),
        topics: new Set<string>(),
        limitations: new Set<string>(),
        examples: new Set<string>()
      };

      current.route ??= entry.route;
      current.topics.add(entry.label);
      entry.limitations.forEach((limitation) => current.limitations.add(limitation));
      entry.examples.forEach((example) => current.examples.add(example));
      providers.set(entry.provider, current);
      return providers;
    },
    new Map<
      string,
      {
        id: string;
        label: string;
        route?: string;
        freshness: string;
        topics: Set<string>;
        limitations: Set<string>;
        examples: Set<string>;
      }
    >()
  );

  return {
    providers: Array.from(byProvider.values()).map((provider) => ({
      ...provider,
      topics: Array.from(provider.topics),
      limitations: Array.from(provider.limitations),
      examples: Array.from(provider.examples)
    })),
    series: DATA_CATALOG.map(({ patterns: _patterns, ...entry }) => entry)
  };
}

function freshnessForProvider(provider: string) {
  if (provider === "fred") return "Fetched from FRED graph data and cached for several hours.";
  if (provider === "coingecko") return "Fetched from CoinGecko market chart data and cached briefly.";
  if (provider === "worldbank") return "Fetched from World Bank indicator data and cached daily.";
  if (provider === "treasury") return "Fetched from Treasury Fiscal Data and cached hourly.";
  if (provider === "dhs") return "Fetched from DHS/OHSS Yearbook immigration data and cached daily.";
  if (provider === "college_scorecard") return "Planned College Scorecard adapter.";
  return "Cataloged for a future source adapter.";
}
