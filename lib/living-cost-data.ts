import type { ChartSpec } from "@/types/chart";
import { normalizeSpec } from "./chart-utils";
import { catalogEntryForAdapter } from "./data-catalog";
import { fetchFredRows, type FredRow } from "./macro-data";

const colors = ["#c0392b", "#2980b9", "#16a085", "#8e44ad", "#d4ac0d"];

type LivingCostSeries = {
  key: string;
  label: string;
  seriesId: string;
  kind: "price_index" | "wage";
};

type YearWindow = {
  startYear: number;
  endYear?: number;
};

const BASE_CPI = "CPIAUCSL";

const LIVING_COST_SERIES: LivingCostSeries[] = [
  {
    key: "shelter",
    label: "Shelter",
    seriesId: "CUSR0000SAH1",
    kind: "price_index"
  },
  {
    key: "food",
    label: "Food",
    seriesId: "CPIFABSL",
    kind: "price_index"
  },
  {
    key: "energy",
    label: "Energy",
    seriesId: "CPIENGSL",
    kind: "price_index"
  },
  {
    key: "medical",
    label: "Medical care",
    seriesId: "CPIMEDSL",
    kind: "price_index"
  },
  {
    key: "real_wages",
    label: "Real hourly wages",
    seriesId: "AHETPI",
    kind: "wage"
  }
];

export async function livingCostsSpecForQuery(query: string): Promise<ChartSpec> {
  return getLivingCostsRealSpec(yearWindowFromQuery(query));
}

export async function getLivingCostsRealSpec(
  window: YearWindow = { startYear: 1971 }
): Promise<ChartSpec> {
  const catalogEntry = catalogEntryForAdapter("living_costs", "real_living_costs");
  const cpiRows = await fetchFredRows(BASE_CPI);
  const cpiByDate = new Map(cpiRows.map((row) => [row.date, row.value]));
  const seriesRows = await Promise.all(
    LIVING_COST_SERIES.map(async (series) => ({
      series,
      rows: await fetchFredRows(series.seriesId)
    }))
  );

  const byYear = new Map<string, Record<string, string | number>>();
  const starts = new Map<string, number>();

  seriesRows.forEach(({ series, rows }) => {
    annualize(rows).forEach((row) => {
      const year = Number(row.date.slice(0, 4));
      if (year < window.startYear || (window.endYear && year > window.endYear)) return;

      const cpi = closestCpiValue(cpiByDate, row.date);
      if (!cpi) return;

      const realValue = (row.value / cpi) * 100;
      if (!starts.has(series.key)) starts.set(series.key, realValue);
      const start = starts.get(series.key) ?? realValue;
      const indexed = Number(((realValue / start) * 100).toFixed(1));
      const current = byYear.get(String(year)) ?? { year: String(year) };
      current[series.key] = indexed;
      byYear.set(String(year), current);
    });
  });

  const rawData = Array.from(byYear.values())
    .filter((row) => LIVING_COST_SERIES.every((series) => typeof row[series.key] === "number"))
    .sort((a, b) => String(a.year).localeCompare(String(b.year)));
  const data = sampleRows(rawData, 22);

  if (!data.length) throw new Error("FRED returned no usable living cost rows");

  const firstYear = String(data[0].year);
  const latestYear = String(data.at(-1)?.year ?? firstYear);
  const largestMove = largestSeriesMove(data);

  return normalizeSpec({
    title: "Living Costs Since 1971, Inflation Adjusted",
    subtitle: `Major price categories and hourly wages, deflated by all-items CPI and indexed to ${firstYear} = 100.`,
    chartType: "line",
    data,
    xKey: "year",
    yKeys: LIVING_COST_SERIES.map((series) => series.key),
    colors,
    unit: "real index",
    source:
      "Live FRED graph data using BLS CPI categories, all-items CPI, and average hourly earnings.",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    sourceUpdatedAt: latestYear,
    sourceCadence: catalogEntry?.cadence,
    sourceTransform: catalogEntry?.transform,
    seriesIds: catalogEntry?.seriesIds,
    assumptions: [
      "Each series is divided by all-items CPI, then indexed to the first shared year.",
      "Shelter, food, energy, and medical care are CPI category indexes, not dollar bills.",
      "Real hourly wages use average hourly earnings of production and nonsupervisory employees.",
      "This is a curated living-cost pressure chart, not a household budget calculator."
    ],
    insight: `${largestMove.label} changed the most relative to broad inflation across this window.`,
    dataSource: "live_fred",
    seriesLabels: LIVING_COST_SERIES.map((series) => series.label),
    followUpPrompts: [
      "rent vs wages since 2000",
      "home prices since 2000",
      "US food price inflation since 2020",
      "wages since 2020 vs US inflation rate since 2020"
    ]
  });
}

function annualize(rows: FredRow[]) {
  const latestByYear = new Map<string, FredRow>();
  rows.forEach((row) => latestByYear.set(row.date.slice(0, 4), row));
  return Array.from(latestByYear.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function closestCpiValue(cpiByDate: Map<string, number>, date: string) {
  const exact = cpiByDate.get(date);
  if (exact) return exact;
  return cpiByDate.get(`${date.slice(0, 4)}-12-01`);
}

function sampleRows<T>(rows: T[], maxRows: number) {
  if (rows.length <= maxRows) return rows;
  const stride = Math.ceil(rows.length / maxRows);
  const sampled = rows.filter((_, index) => index % stride === 0);
  const last = rows.at(-1);
  if (last && sampled.at(-1) !== last) sampled.push(last);
  return sampled.slice(-maxRows);
}

function largestSeriesMove(data: Record<string, string | number>[]) {
  const first = data[0];
  const latest = data.at(-1) ?? first;
  return LIVING_COST_SERIES.map((series) => ({
    label: series.label,
    move: Math.abs(Number(latest[series.key]) - Number(first[series.key]))
  })).sort((left, right) => right.move - left.move)[0];
}

function yearWindowFromQuery(query: string): YearWindow {
  const range = query.match(/(?:since|from)?\s*(20\d{2}|19\d{2})(?:\s*(?:to|-)\s*(20\d{2}|19\d{2}))?/i);
  if (range) {
    return {
      startYear: Number(range[1]),
      endYear: range[2] ? Number(range[2]) : undefined
    };
  }
  return { startYear: 1971 };
}
