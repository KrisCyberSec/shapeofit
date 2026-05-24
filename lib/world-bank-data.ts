import type { ChartSpec } from "@/types/chart";
import { normalizeSpec } from "./chart-utils";

const colors = ["#c0392b", "#2980b9", "#16a085"];

type WorldBankMeta = {
  lastupdated?: string;
};

type WorldBankRow = {
  country: { value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
};

type WorldBankResponse = [WorldBankMeta, WorldBankRow[]];

type YearWindow = {
  startYear: number;
  endYear?: number;
};

const TOP_POPULATION_COUNTRIES = "CHN;IND;USA;IDN;PAK;NGA;BRA;BGD;RUS;MEX";

export function isWorldBankQuery(query: string) {
  return Boolean(worldBankMetricForQuery(query));
}

export async function worldBankSpecForQuery(query: string): Promise<ChartSpec | null> {
  const metric = worldBankMetricForQuery(query);
  if (!metric) return null;

  const window = windowForQuery(query);
  if (metric === "life_expectancy") return lifeExpectancySpec(window);
  if (metric === "urban_population") return urbanPopulationSpec(window);
  if (metric === "largest_population") return largestCountriesSpec();
  return worldPopulationSpec(window);
}

export async function getWorldBankSpec(metric: string, window: YearWindow = { startYear: 1960 }) {
  if (metric === "life_expectancy") return lifeExpectancySpec(window);
  if (metric === "urban_population") return urbanPopulationSpec(window);
  if (metric === "largest_population") return largestCountriesSpec();
  if (metric === "world_population") return worldPopulationSpec(window);
  throw new Error(`Unsupported World Bank metric: ${metric}`);
}

async function worldPopulationSpec(window: YearWindow): Promise<ChartSpec> {
  const { meta, rows } = await fetchIndicator("WLD", "SP.POP.TOTL");
  const data = sampleRows(filterWindow(rows, window), 14).map((row) => ({
    year: row.date,
    population: Number((Number(row.value) / 1_000_000_000).toFixed(2))
  }));
  const first = data[0];
  const latest = data.at(-1) ?? first;

  return normalizeSpec({
    title: "World Population, Live From World Bank",
    subtitle: `Global population in billions, shown from ${window.startYear}${window.endYear ? ` to ${window.endYear}` : " to latest available"}.`,
    chartType: "area",
    data,
    xKey: "year",
    yKeys: ["population"],
    colors: [colors[2]],
    unit: "bn",
    source: "Live World Bank indicator data, series SP.POP.TOTL.",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    sourceUpdatedAt: meta.lastupdated,
    assumptions: [
      "Population is converted from people to billions.",
      "World Bank annual indicators can lag the current calendar year.",
      "The chart samples long windows to keep the shape readable."
    ],
    insight: `World population increased by about ${(latest.population - first.population).toFixed(1)} billion people across this window.`,
    whyItMatters:
      "Population growth sets the backdrop for housing, schools, labor markets, migration, food demand, and climate planning.",
    dataSource: "live_worldbank",
    seriesLabels: ["Population"],
    followUpPrompts: [
      "life expectancy in the US vs Japan since 1960",
      "urban population share since 1960",
      "largest countries by population today"
    ]
  });
}

async function urbanPopulationSpec(window: YearWindow): Promise<ChartSpec> {
  const { meta, rows } = await fetchIndicator("WLD", "SP.URB.TOTL.IN.ZS");
  const data = sampleRows(filterWindow(rows, window), 14).map((row) => ({
    year: row.date,
    urban_share: Number(Number(row.value).toFixed(1))
  }));
  const first = data[0];
  const latest = data.at(-1) ?? first;

  return normalizeSpec({
    title: "The World Became More Urban",
    subtitle: `Share of the world population living in urban areas, shown from ${window.startYear}${window.endYear ? ` to ${window.endYear}` : " to latest available"}.`,
    chartType: "line",
    data,
    xKey: "year",
    yKeys: ["urban_share"],
    colors: [colors[1]],
    unit: "%",
    source: "Live World Bank indicator data, series SP.URB.TOTL.IN.ZS.",
    sourceUrl: "https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS",
    sourceUpdatedAt: meta.lastupdated,
    assumptions: [
      "Urban population share is reported annually by World Bank.",
      "Urban definitions vary by country and are harmonized by the source.",
      "The chart samples long windows to keep the trend readable."
    ],
    insight: `The global urban share rose by about ${(latest.urban_share - first.urban_share).toFixed(1)} percentage points across this window.`,
    whyItMatters:
      "Urbanization changes housing demand, transportation, infrastructure, energy use, and the daily shape of work and family life.",
    dataSource: "live_worldbank",
    seriesLabels: ["Urban population share"],
    followUpPrompts: [
      "world population growth 1960 to 2024",
      "largest countries by population today",
      "life expectancy in the US vs Japan since 1960"
    ]
  });
}

async function lifeExpectancySpec(window: YearWindow): Promise<ChartSpec> {
  const { meta, rows } = await fetchIndicator("USA;JPN", "SP.DYN.LE00.IN");
  const byYear = new Map<string, Record<string, string | number>>();

  filterWindow(rows, window).forEach((row) => {
    const key = row.countryiso3code === "JPN" ? "japan" : "us";
    const current = byYear.get(row.date) ?? { year: row.date };
    current[key] = Number(Number(row.value).toFixed(1));
    byYear.set(row.date, current);
  });

  const data = sampleRows(
    Array.from(byYear.values())
      .filter((row) => typeof row.us === "number" && typeof row.japan === "number")
      .sort((a, b) => String(a.year).localeCompare(String(b.year))),
    14
  );
  const latest = data.at(-1);
  const gap = latest ? Number(latest.japan) - Number(latest.us) : 0;

  return normalizeSpec({
    title: "Life Expectancy: US vs Japan",
    subtitle: `Life expectancy at birth in years, shown from ${window.startYear}${window.endYear ? ` to ${window.endYear}` : " to latest available"}.`,
    chartType: "line",
    data,
    xKey: "year",
    yKeys: ["us", "japan"],
    colors: [colors[0], colors[1]],
    unit: "years",
    source: "Live World Bank indicator data, series SP.DYN.LE00.IN.",
    sourceUrl: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN",
    sourceUpdatedAt: meta.lastupdated,
    assumptions: [
      "Life expectancy is reported annually and can lag current-year conditions.",
      "The chart compares national averages, not subgroups.",
      "The app samples long windows to keep the comparison readable."
    ],
    insight: `In the latest shared year, Japan's life expectancy is about ${gap.toFixed(1)} years higher than the US.`,
    whyItMatters:
      "Life expectancy compresses many conditions into one readable line: health care, income, safety, behavior, and public health shocks.",
    dataSource: "live_worldbank",
    seriesLabels: ["United States", "Japan"],
    followUpPrompts: [
      "world population growth 1960 to 2024",
      "urban population share since 1960",
      "US life expectancy by gender since 1960"
    ]
  });
}

async function largestCountriesSpec(): Promise<ChartSpec> {
  const { meta, rows } = await fetchIndicator(TOP_POPULATION_COUNTRIES, "SP.POP.TOTL");
  const latestByCountry = new Map<string, WorldBankRow>();

  rows
    .filter((row) => row.value !== null)
    .sort((a, b) => Number(b.date) - Number(a.date))
    .forEach((row) => {
      if (!latestByCountry.has(row.countryiso3code)) latestByCountry.set(row.countryiso3code, row);
    });

  const data = Array.from(latestByCountry.values())
    .map((row) => ({
      country: shortCountryName(row.country.value),
      population: Number((Number(row.value) / 1_000_000_000).toFixed(2)),
      year: row.date
    }))
    .sort((a, b) => b.population - a.population)
    .slice(0, 10);

  const latestYear = data[0]?.year ?? "latest available";

  return normalizeSpec({
    title: "Largest Countries by Population",
    subtitle: `Population in billions, using the latest World Bank value for each country (${latestYear}).`,
    chartType: "bar",
    data,
    xKey: "country",
    yKeys: ["population"],
    colors: [colors[2]],
    unit: "bn",
    source: "Live World Bank indicator data, series SP.POP.TOTL.",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    sourceUpdatedAt: meta.lastupdated,
    assumptions: [
      "Uses a curated set of the world's most populous countries, then sorts by latest available population.",
      "Population values are converted from people to billions.",
      "Latest available year can differ slightly by country."
    ],
    insight: "India and China sit at a different scale from every other country on the chart.",
    whyItMatters:
      "Country population scale shapes markets, labor forces, political influence, infrastructure needs, and climate demand.",
    dataSource: "live_worldbank",
    seriesLabels: ["Population"],
    followUpPrompts: [
      "world population growth 1960 to 2024",
      "urban population share since 1960",
      "life expectancy in the US vs Japan since 1960"
    ]
  });
}

function worldBankMetricForQuery(query: string) {
  const lower = query.toLowerCase();

  if (lower.includes("largest") && lower.includes("population")) return "largest_population";
  if (lower.includes("urban") && lower.includes("population")) return "urban_population";
  if (lower.includes("life expectancy") && (lower.includes("japan") || lower.includes("us"))) {
    return "life_expectancy";
  }
  if (lower.includes("world population") || lower.includes("population growth")) {
    return "world_population";
  }

  return null;
}

async function fetchIndicator(countryCodes: string, indicator: string) {
  const endpoint = new URL(
    `https://api.worldbank.org/v2/country/${countryCodes}/indicator/${indicator}`
  );
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("per_page", "2000");

  const response = await fetch(endpoint, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error(`World Bank request failed for ${indicator}`);

  const payload = (await response.json()) as WorldBankResponse;
  const meta = payload[0] ?? {};
  const rows = payload[1] ?? [];

  return {
    meta,
    rows: rows.filter((row) => row.value !== null)
  };
}

function filterWindow(rows: WorldBankRow[], window: YearWindow) {
  return rows
    .filter((row) => {
      const year = Number(row.date);
      return year >= window.startYear && (!window.endYear || year <= window.endYear);
    })
    .sort((a, b) => Number(a.date) - Number(b.date));
}

function windowForQuery(query: string): YearWindow {
  const lower = query.toLowerCase();
  const range = lower.match(/(?:since|from)?\s*(20\d{2}|19\d{2})(?:\s*(?:to|-)\s*(20\d{2}|19\d{2}))?/);
  if (range) {
    return {
      startYear: Number(range[1]),
      endYear: range[2] ? Number(range[2]) : undefined
    };
  }
  return { startYear: 1960 };
}

function sampleRows<T>(rows: T[], maxRows: number) {
  if (rows.length <= maxRows) return rows;
  const stride = Math.ceil(rows.length / maxRows);
  const sampled = rows.filter((_, index) => index % stride === 0);
  const last = rows.at(-1);
  if (last && sampled.at(-1) !== last) sampled.push(last);
  return sampled.slice(-maxRows);
}

function shortCountryName(country: string) {
  return country.replace("United States", "US").replace("Russian Federation", "Russia");
}
