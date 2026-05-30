export type DataProviderId =
  | "fred"
  | "worldbank"
  | "treasury"
  | "dhs"
  | "coingecko"
  | "bls"
  | "bea"
  | "census"
  | "college_scorecard"
  | "polygon";

export type DataAdapterId =
  | "fred"
  | "worldbank"
  | "treasury"
  | "dhs_immigration"
  | "coingecko"
  | "living_costs"
  | "housing_affordability";

export type CatalogStatus = "supported" | "planned";

export type DataCatalogEntry = {
  id: string;
  label: string;
  category: "money" | "markets" | "population" | "health";
  provider: DataProviderId;
  providerLabel: string;
  adapter?: DataAdapterId;
  adapterKey?: string;
  status: CatalogStatus;
  cadence: string;
  unit: string;
  transform?: string;
  sourceUrl: string;
  route?: string;
  examples: string[];
  aliases: string[];
  patterns: RegExp[];
  limitations: string[];
  seriesIds?: string[];
};

export const DATA_CATALOG: DataCatalogEntry[] = [
  {
    id: "fred.cpi.us.yoy",
    label: "US CPI inflation",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "inflation",
    status: "supported",
    cadence: "monthly",
    unit: "%",
    transform: "year-over-year percent change",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    route: "/api/live/macro",
    examples: ["US inflation rate since 2020"],
    aliases: ["inflation", "cpi", "consumer price index"],
    patterns: [/\binflation\b/i, /\bcpi\b/i, /\bconsumer price index\b/i],
    limitations: [
      "Uses national US CPI.",
      "Converted from index level to year-over-year percent change.",
      "Recent values can be revised by the source."
    ],
    seriesIds: ["CPIAUCSL"]
  },
  {
    id: "fred.wages.us.hourly",
    label: "US average hourly earnings",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "wages",
    status: "supported",
    cadence: "monthly",
    unit: "$",
    sourceUrl: "https://fred.stlouisfed.org/series/CES0500000003",
    route: "/api/live/macro",
    examples: ["wages since 2020"],
    aliases: ["wages", "pay", "hourly earnings"],
    patterns: [/\bwages?\b/i, /\bpay\b/i, /\bhourly earnings\b/i],
    limitations: [
      "Uses average hourly earnings for total private employment.",
      "Does not adjust wages for inflation unless explicitly compared with CPI.",
      "Averages can hide large differences across industries and workers."
    ],
    seriesIds: ["CES0500000003"]
  },
  {
    id: "fred.mortgage30.us",
    label: "US 30-year mortgage rate",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "mortgage",
    status: "supported",
    cadence: "weekly",
    unit: "%",
    sourceUrl: "https://fred.stlouisfed.org/series/MORTGAGE30US",
    route: "/api/live/macro",
    examples: ["mortgage rates since 2020"],
    aliases: ["mortgage", "mortgage rates"],
    patterns: [/\bmortgage(?:\s+rates?)?\b/i],
    limitations: [
      "Uses the national average 30-year fixed mortgage rate.",
      "Does not include taxes, insurance, or local home prices."
    ],
    seriesIds: ["MORTGAGE30US"]
  },
  {
    id: "fred.unemployment.us",
    label: "US unemployment rate",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "unemployment",
    status: "supported",
    cadence: "monthly",
    unit: "%",
    sourceUrl: "https://fred.stlouisfed.org/series/UNRATE",
    route: "/api/live/macro",
    examples: ["unemployment rate since 2020"],
    aliases: ["unemployment", "jobless"],
    patterns: [/\bunemployment\b/i, /\bjobless\b/i],
    limitations: [
      "Uses the seasonally adjusted civilian unemployment rate.",
      "Does not show underemployment or job quality."
    ],
    seriesIds: ["UNRATE"]
  },
  {
    id: "fred.fedfunds.us",
    label: "Effective federal funds rate",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "fed_funds",
    status: "supported",
    cadence: "monthly",
    unit: "%",
    sourceUrl: "https://fred.stlouisfed.org/series/FEDFUNDS",
    route: "/api/live/macro",
    examples: ["fed funds rate since 2015"],
    aliases: ["fed funds", "federal funds", "interest rate"],
    patterns: [/\bfed funds\b/i, /\bfederal funds\b/i, /\binterest rates?\b/i],
    limitations: [
      "Uses the effective federal funds rate monthly average.",
      "This is a policy-rate proxy, not every consumer borrowing rate."
    ],
    seriesIds: ["FEDFUNDS"]
  },
  {
    id: "fred.gas.us.regular",
    label: "US regular gas price",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "gas",
    status: "supported",
    cadence: "weekly",
    unit: "$",
    sourceUrl: "https://fred.stlouisfed.org/series/GASREGW",
    route: "/api/live/macro",
    examples: ["gas prices since 2020"],
    aliases: ["gas prices", "gasoline prices"],
    patterns: [/\bgas(?:oline)? prices?\b/i, /\bgas\b/i],
    limitations: [
      "Uses a national average price for regular gasoline.",
      "Regional prices can differ materially."
    ],
    seriesIds: ["GASREGW"]
  },
  {
    id: "fred.food.us.yoy",
    label: "US food inflation",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "food_inflation",
    status: "supported",
    cadence: "monthly",
    unit: "%",
    transform: "year-over-year percent change",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIFABSL",
    route: "/api/live/macro",
    examples: ["US food price inflation since 2020"],
    aliases: ["food inflation", "food prices", "grocery prices"],
    patterns: [/\bfood (?:price )?inflation\b/i, /\bfood prices?\b/i, /\bgrocer(?:y|ies)\b/i],
    limitations: [
      "Uses food and beverages CPI.",
      "Converted from index level to year-over-year percent change."
    ],
    seriesIds: ["CPIFABSL"]
  },
  {
    id: "fred.homeprices.us",
    label: "US national home price index",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "home_prices",
    status: "supported",
    cadence: "monthly",
    unit: "index",
    sourceUrl: "https://fred.stlouisfed.org/series/CSUSHPISA",
    route: "/api/live/macro",
    examples: ["home prices since 2000"],
    aliases: ["home prices", "house prices"],
    patterns: [/\bhome prices?\b/i, /\bhouse prices?\b/i],
    limitations: [
      "Uses a national home price index, not dollar sale prices.",
      "Does not reflect local housing markets."
    ],
    seriesIds: ["CSUSHPISA"]
  },
  {
    id: "fred.rent.us.primary",
    label: "US rent CPI",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "fred",
    adapterKey: "rent",
    status: "supported",
    cadence: "monthly",
    unit: "index",
    sourceUrl: "https://fred.stlouisfed.org/series/CUSR0000SEHA",
    route: "/api/live/macro",
    examples: ["rent vs wages since 2000", "rent since 2000"],
    aliases: ["rent", "rents", "rent prices"],
    patterns: [/\brents?\b/i, /\brent prices?\b/i],
    limitations: [
      "Uses rent of primary residence CPI for US city average.",
      "Index values show movement, not dollar rent.",
      "Local rents can differ materially from the national series."
    ],
    seriesIds: ["CUSR0000SEHA"]
  },
  {
    id: "fred.livingcosts.us.real",
    label: "Inflation-adjusted living cost pressure",
    category: "money",
    provider: "fred",
    providerLabel: "FRED/BLS",
    adapter: "living_costs",
    adapterKey: "real_living_costs",
    status: "supported",
    cadence: "annualized from monthly series",
    unit: "real index",
    transform: "deflate each series by all-items CPI, then index to the first shared year",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    route: "/api/chart",
    examples: [
      "cost of living since 1971 inflation adjusted",
      "living costs since 1971 adjusted for inflation"
    ],
    aliases: ["cost of living", "living costs", "inflation adjusted", "real cost pressure"],
    patterns: [
      /\bcost of living\b.*\b(?:inflation adjusted|adjusted for inflation|real)\b/i,
      /\bliving costs?\b.*\b(?:inflation adjusted|adjusted for inflation|real)\b/i,
      /\bwhat got more expensive\b.*\binflation\b/i
    ],
    limitations: [
      "This is a curated pressure chart, not a household budget calculator.",
      "Category series are national indexes and do not reflect local prices.",
      "All series are deflated by all-items CPI and indexed for shape comparison."
    ],
    seriesIds: ["CPIAUCSL", "CUSR0000SAH1", "CPIFABSL", "CPIENGSL", "CPIMEDSL", "AHETPI"]
  },
  {
    id: "fred.housingaffordability.us.payment",
    label: "US housing-payment pressure",
    category: "money",
    provider: "fred",
    providerLabel: "FRED",
    adapter: "housing_affordability",
    adapterKey: "housing_payment_pressure",
    status: "supported",
    cadence: "annualized from monthly/weekly series",
    unit: "index",
    transform: "estimate a mortgage-payment index from home prices and mortgage rates, then compare with hourly wages",
    sourceUrl: "https://fred.stlouisfed.org/series/CSUSHPISA",
    route: "/api/chart",
    examples: [
      "are houses affordable today",
      "housing affordability since 2000",
      "home payment pressure since 2000"
    ],
    aliases: ["housing affordability", "houses affordable", "home affordability", "payment pressure"],
    patterns: [
      /\bhous(?:e|es|ing)\b.*\baffordable\b/i,
      /\bhousing affordability\b/i,
      /\bhome affordability\b/i,
      /\bhome payment pressure\b/i
    ],
    limitations: [
      "Uses a national home price index, not local sale prices.",
      "Mortgage payment pressure is an estimate based on a 30-year fixed-rate formula.",
      "The chart does not include taxes, insurance, down payments, or credit constraints."
    ],
    seriesIds: ["CSUSHPISA", "MORTGAGE30US", "AHETPI"]
  },
  {
    id: "treasury.publicdebt.us",
    label: "US public debt outstanding",
    category: "money",
    provider: "treasury",
    providerLabel: "U.S. Treasury Fiscal Data",
    adapter: "treasury",
    adapterKey: "debt_to_penny",
    status: "supported",
    cadence: "daily business-day records",
    unit: "trillion USD",
    sourceUrl: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/",
    route: "/api/live/money",
    examples: ["US national debt live last 30 days", "debt to the penny"],
    aliases: ["national debt", "public debt", "treasury debt", "debt to the penny"],
    patterns: [/\bnational debt\b/i, /\bpublic debt\b/i, /\btreasury debt\b/i, /\bdebt to the penny\b/i],
    limitations: [
      "Only total public debt outstanding is supported today.",
      "Weekends and federal holidays may not produce a new record."
    ],
    seriesIds: ["debt_to_penny"]
  },
  {
    id: "coingecko.crypto.usd",
    label: "Crypto USD market prices",
    category: "markets",
    provider: "coingecko",
    providerLabel: "CoinGecko",
    adapter: "coingecko",
    adapterKey: "crypto_prices",
    status: "supported",
    cadence: "daily sampled from live market chart data",
    unit: "$ or index",
    sourceUrl: "https://docs.coingecko.com/reference/coins-id-market-chart",
    route: "/api/live/crypto",
    examples: [
      "Bitcoin vs Ethereum live over the last 30 days",
      "Bitcoin price over the last year",
      "Solana price over the last 30 days"
    ],
    aliases: ["crypto", "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "dogecoin", "doge"],
    patterns: [/\bcrypto\b/i, /\bbitcoin\b/i, /\bbtc\b/i, /\bethereum\b/i, /\beth\b/i, /\bsolana\b/i, /\bsol\b/i, /\bdogecoin\b/i, /\bdoge\b/i],
    limitations: [
      "USD price history only for now.",
      "Multi-coin charts are indexed to the first shared point.",
      "Supported coins are currently limited to Bitcoin, Ethereum, Solana, and Dogecoin."
    ],
    seriesIds: ["bitcoin", "ethereum", "solana", "dogecoin"]
  },
  {
    id: "dhs.lpr.admissions.us",
    label: "US lawful permanent resident admissions",
    category: "population",
    provider: "dhs",
    providerLabel: "DHS Office of Homeland Security Statistics",
    adapter: "dhs_immigration",
    adapterKey: "lpr_admissions",
    status: "supported",
    cadence: "annual fiscal-year table",
    unit: "people",
    sourceUrl: "https://ohss.dhs.gov/topics/immigration/yearbook/2023/table1",
    route: "/api/live/immigration",
    examples: [
      "how many immigrants have come to the United States in the past 20 years",
      "US immigration over the past 20 years",
      "lawful permanent residents admitted since 2004"
    ],
    aliases: [
      "immigration",
      "immigrants",
      "immigrants came",
      "immigrants have come",
      "came to the United States",
      "legal immigration",
      "lawful permanent residents",
      "permanent residents",
      "green cards",
      "green card holders",
      "LPR admissions"
    ],
    patterns: [
      /\bimmigr(?:ant|ants|ation)\b.*\b(?:united states|u\.s\.|us|america)\b/i,
      /\b(?:united states|u\.s\.|us|america)\b.*\bimmigr(?:ant|ants|ation)\b/i,
      /\blawful permanent residents?\b/i,
      /\bgreen cards?\b/i,
      /\bLPR\b.*\b(?:admissions?|status)\b/i
    ],
    limitations: [
      "Counts people obtaining lawful permanent resident status, not every border crossing or temporary stay.",
      "Includes new arrivals and people already in the United States who adjusted status.",
      "DHS Yearbook Table 1 is annual fiscal-year data; the latest mapped table runs through fiscal year 2023."
    ],
    seriesIds: ["DHS Yearbook Table 1"]
  },
  {
    id: "worldbank.population.world",
    label: "World population",
    category: "population",
    provider: "worldbank",
    providerLabel: "World Bank",
    adapter: "worldbank",
    adapterKey: "world_population",
    status: "supported",
    cadence: "annual",
    unit: "people",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    route: "/api/live/worldbank",
    examples: ["world population growth 1960 to 2024"],
    aliases: ["world population", "population growth"],
    patterns: [/\bworld population\b/i, /\bpopulation growth\b/i],
    limitations: [
      "Annual data may lag the current calendar year.",
      "Long windows are sampled for readability."
    ],
    seriesIds: ["SP.POP.TOTL"]
  },
  {
    id: "worldbank.population.largest",
    label: "Largest countries by population",
    category: "population",
    provider: "worldbank",
    providerLabel: "World Bank",
    adapter: "worldbank",
    adapterKey: "largest_population",
    status: "supported",
    cadence: "annual",
    unit: "people",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    route: "/api/live/worldbank",
    examples: ["largest countries by population today"],
    aliases: ["largest countries", "most populous"],
    patterns: [/\blargest countries\b/i, /\bmost populous\b/i],
    limitations: [
      "Uses a curated set of high-population countries before sorting.",
      "Latest available year can differ slightly by country."
    ],
    seriesIds: ["SP.POP.TOTL"]
  },
  {
    id: "worldbank.urban.world",
    label: "Global urban population share",
    category: "population",
    provider: "worldbank",
    providerLabel: "World Bank",
    adapter: "worldbank",
    adapterKey: "urban_population",
    status: "supported",
    cadence: "annual",
    unit: "%",
    sourceUrl: "https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS",
    route: "/api/live/worldbank",
    examples: ["urban population share since 1960"],
    aliases: ["urban population", "urbanization"],
    patterns: [/\burban(?:ization)?\b/i, /\burban population\b/i],
    limitations: [
      "Urban definitions vary by country and are harmonized by the source.",
      "Annual data may lag the current calendar year."
    ],
    seriesIds: ["SP.URB.TOTL.IN.ZS"]
  },
  {
    id: "worldbank.lifeexpectancy.us",
    label: "US life expectancy",
    category: "health",
    provider: "worldbank",
    providerLabel: "World Bank",
    adapter: "worldbank",
    adapterKey: "life_expectancy_us",
    status: "supported",
    cadence: "annual",
    unit: "years",
    sourceUrl: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN",
    route: "/api/live/worldbank",
    examples: ["United States life expectancy since 1950", "US life expectancy since 1960"],
    aliases: ["life expectancy", "us life expectancy", "united states life expectancy"],
    patterns: [
      /\b(?:us|u\.s\.|united states|america|american)\b.*\blife expectancy\b/i,
      /\blife expectancy\b.*\b(?:in|for)?\s*(?:the\s+)?(?:us|u\.s\.|united states|america)\b/i
    ],
    limitations: [
      "World Bank annual life expectancy data starts in 1960 for this indicator.",
      "National averages do not show subgroup differences."
    ],
    seriesIds: ["SP.DYN.LE00.IN"]
  },
  {
    id: "worldbank.lifeexpectancy.us-japan",
    label: "Life expectancy, US vs Japan",
    category: "health",
    provider: "worldbank",
    providerLabel: "World Bank",
    adapter: "worldbank",
    adapterKey: "life_expectancy",
    status: "supported",
    cadence: "annual",
    unit: "years",
    sourceUrl: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN",
    route: "/api/live/worldbank",
    examples: ["life expectancy in the US vs Japan since 1960"],
    aliases: ["life expectancy comparison", "us vs japan life expectancy", "japan life expectancy"],
    patterns: [
      /\blife expectancy\b.*\b(?:us|u\.s\.|united states)\b.*\b(?:vs\.?|versus|compared to|against)\b.*\bjapan\b/i,
      /\blife expectancy\b.*\bjapan\b.*\b(?:vs\.?|versus|compared to|against)\b.*\b(?:us|u\.s\.|united states)\b/i,
      /\b(?:us|u\.s\.|united states)\b.*\b(?:vs\.?|versus|compared to|against)\b.*\bjapan\b.*\blife expectancy\b/i,
      /\bjapan\b.*\b(?:vs\.?|versus|compared to|against)\b.*\b(?:us|u\.s\.|united states)\b.*\blife expectancy\b/i
    ],
    limitations: [
      "Only the US vs Japan comparison is mapped today.",
      "National averages do not show subgroup differences."
    ],
    seriesIds: ["SP.DYN.LE00.IN"]
  },
  {
    id: "scorecard.tuition.us",
    label: "College tuition and school cost data",
    category: "money",
    provider: "college_scorecard",
    providerLabel: "College Scorecard",
    status: "planned",
    cadence: "annual",
    unit: "$",
    sourceUrl: "https://collegescorecard.ed.gov/data/api/",
    examples: ["college tuition vs wages since 1980"],
    aliases: ["college tuition", "tuition", "college cost"],
    patterns: [/\bcollege tuition\b/i, /\btuition\b/i, /\bcollege cost\b/i],
    limitations: [
      "Planned source. Requires College Scorecard API integration and careful aggregation choices."
    ]
  },
  {
    id: "polygon.equities.us",
    label: "US stock prices",
    category: "markets",
    provider: "polygon",
    providerLabel: "Polygon",
    status: "planned",
    cadence: "daily or delayed intraday",
    unit: "$",
    sourceUrl: "https://polygon.io/",
    examples: ["Apple vs Microsoft stock price over the last year"],
    aliases: ["stocks", "stock price", "equities"],
    patterns: [/\bstocks?\b/i, /\bequities\b/i],
    limitations: [
      "Planned source. Market data licensing needs review before production use."
    ]
  }
];

export function supportedCatalogEntries() {
  return DATA_CATALOG.filter((entry) => entry.status === "supported");
}

export function plannedCatalogEntries() {
  return DATA_CATALOG.filter((entry) => entry.status === "planned");
}

export function resolveSupportedCatalogEntry(query: string) {
  const supported = supportedCatalogEntries();
  const exactMatch = supported.find((entry) =>
    entry.examples.some((example) => normalize(example) === normalize(query))
  );
  if (exactMatch) return exactMatch;

  return supported.find((entry) => entry.patterns.some((pattern) => pattern.test(query))) ?? null;
}

export function resolveCatalogEntry(query: string) {
  const exactMatch = DATA_CATALOG.find((entry) =>
    entry.examples.some((example) => normalize(example) === normalize(query))
  );
  if (exactMatch) return exactMatch;

  return DATA_CATALOG.find((entry) => entry.patterns.some((pattern) => pattern.test(query))) ?? null;
}

export function plannedCatalogEntryForQuery(query: string) {
  const entry = resolveCatalogEntry(query);
  return entry?.status === "planned" ? entry : null;
}

export function catalogEntryForAdapter(adapter: DataAdapterId, adapterKey: string) {
  return supportedCatalogEntries().find(
    (entry) => entry.adapter === adapter && entry.adapterKey === adapterKey
  );
}

export function supportedPrompts(limit?: number) {
  const prompts = supportedCatalogEntries().flatMap((entry) => entry.examples);
  const unique = Array.from(new Set(prompts));
  return typeof limit === "number" ? unique.slice(0, limit) : unique;
}

export function searchCatalog(query: string, limit = 8) {
  const terms = normalize(query)
    .split(" ")
    .filter((term) => term.length > 2);
  if (!terms.length) return DATA_CATALOG.slice(0, limit);

  return DATA_CATALOG.map((entry) => ({
    entry,
    score: catalogScore(entry, terms)
  }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((match) => match.entry)
    .slice(0, limit);
}

function catalogScore(entry: DataCatalogEntry, terms: string[]) {
  const haystack = normalize(
    [
      entry.label,
      entry.providerLabel,
      entry.status,
      entry.category,
      entry.unit,
      entry.transform,
      ...entry.examples,
      ...entry.aliases,
      ...(entry.seriesIds ?? [])
    ]
      .filter(Boolean)
      .join(" ")
  );

  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
