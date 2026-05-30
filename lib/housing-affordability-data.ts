import type { ChartSpec } from "@/types/chart";
import { normalizeSpec } from "./chart-utils";
import { catalogEntryForAdapter } from "./data-catalog";
import { fetchFredRows, type FredRow } from "./macro-data";

const colors = ["#c0392b", "#2980b9", "#16a085"];

const HOME_PRICE_SERIES = "CSUSHPISA";
const MORTGAGE_RATE_SERIES = "MORTGAGE30US";
const WAGE_SERIES = "AHETPI";

type YearWindow = {
  startYear: number;
  endYear?: number;
};

export async function housingAffordabilitySpecForQuery(query: string): Promise<ChartSpec> {
  return getHousingAffordabilitySpec(yearWindowFromQuery(query));
}

export async function getHousingAffordabilitySpec(
  window: YearWindow = { startYear: 2000 }
): Promise<ChartSpec> {
  const catalogEntry = catalogEntryForAdapter("housing_affordability", "housing_payment_pressure");
  const [homePriceRows, mortgageRows, wageRows] = await Promise.all([
    fetchFredRows(HOME_PRICE_SERIES),
    fetchFredRows(MORTGAGE_RATE_SERIES),
    fetchFredRows(WAGE_SERIES)
  ]);

  const homeByYear = annualLastByYear(homePriceRows);
  const mortgageByYear = annualAverageByYear(mortgageRows);
  const wageByYear = annualLastByYear(wageRows);
  const years = Array.from(homeByYear.keys())
    .filter((year) => mortgageByYear.has(year) && wageByYear.has(year))
    .map(Number)
    .filter((year) => year >= window.startYear && (!window.endYear || year <= window.endYear))
    .sort((left, right) => left - right);

  if (!years.length) throw new Error("FRED returned no usable housing affordability rows");

  const firstYear = String(years[0]);
  const firstHome = homeByYear.get(firstYear) ?? 1;
  const firstWage = wageByYear.get(firstYear) ?? 1;
  const firstPayment = mortgagePaymentIndex(firstHome, mortgageByYear.get(firstYear) ?? 0);
  const rows = years.map((year) => {
    const key = String(year);
    const home = homeByYear.get(key) ?? 0;
    const mortgageRate = mortgageByYear.get(key) ?? 0;
    const wage = wageByYear.get(key) ?? 0;
    const payment = mortgagePaymentIndex(home, mortgageRate);

    return {
      year: key,
      payment_pressure: indexValue(payment / wage, firstPayment / firstWage),
      home_prices: indexValue(home, firstHome),
      hourly_wages: indexValue(wage, firstWage)
    };
  });
  const data = sampleRows(rows, 22);
  const latest = data.at(-1) ?? data[0];

  return normalizeSpec({
    title: "Housing Payment Pressure",
    subtitle: `Estimated 30-year mortgage payment pressure, home prices, and hourly wages indexed to ${firstYear} = 100.`,
    chartType: "line",
    data,
    xKey: "year",
    yKeys: ["payment_pressure", "home_prices", "hourly_wages"],
    colors,
    unit: "index",
    source: "Live FRED graph data using Case-Shiller home prices, 30-year mortgage rates, and average hourly earnings.",
    sourceUrl: "https://fred.stlouisfed.org/series/CSUSHPISA",
    sourceUpdatedAt: String(latest.year),
    sourceCadence: catalogEntry?.cadence,
    sourceTransform: catalogEntry?.transform,
    seriesIds: catalogEntry?.seriesIds,
    assumptions: [
      "Payment pressure estimates a 30-year fixed-rate payment using the national home price index and mortgage rate.",
      "Hourly wages use average hourly earnings of production and nonsupervisory employees.",
      "The chart excludes taxes, insurance, down payments, household income mix, and local market differences.",
      "All series are indexed to the first shared year so the shapes can be compared."
    ],
    insight: `Payment pressure is indexed at ${latest.payment_pressure} in ${latest.year}, compared with home prices at ${latest.home_prices} and hourly wages at ${latest.hourly_wages}.`,
    dataSource: "live_fred",
    seriesLabels: ["Payment pressure", "Home prices", "Hourly wages"],
    followUpPrompts: [
      "rent vs wages since 2000",
      "home prices vs mortgage rates since 2000",
      "cost of living since 1971 inflation adjusted"
    ]
  });
}

function annualLastByYear(rows: FredRow[]) {
  return rows.reduce((byYear, row) => {
    byYear.set(row.date.slice(0, 4), row.value);
    return byYear;
  }, new Map<string, number>());
}

function annualAverageByYear(rows: FredRow[]) {
  const buckets = rows.reduce((byYear, row) => {
    const year = row.date.slice(0, 4);
    const bucket = byYear.get(year) ?? [];
    bucket.push(row.value);
    byYear.set(year, bucket);
    return byYear;
  }, new Map<string, number[]>());

  return new Map(
    Array.from(buckets.entries()).map(([year, values]) => [
      year,
      values.reduce((total, value) => total + value, 0) / values.length
    ])
  );
}

function mortgagePaymentIndex(homePriceIndex: number, annualRatePercent: number) {
  const monthlyRate = annualRatePercent / 100 / 12;
  if (!monthlyRate) return homePriceIndex / 360;
  const factor = monthlyRate / (1 - (1 + monthlyRate) ** -360);
  return homePriceIndex * factor;
}

function indexValue(value: number, start: number) {
  if (!Number.isFinite(value) || !Number.isFinite(start) || start === 0) return 0;
  return Number(((value / start) * 100).toFixed(1));
}

function sampleRows<T>(rows: T[], maxRows: number) {
  if (rows.length <= maxRows) return rows;
  const stride = Math.ceil(rows.length / maxRows);
  const sampled = rows.filter((_, index) => index % stride === 0);
  const last = rows.at(-1);
  if (last && sampled.at(-1) !== last) sampled.push(last);
  return sampled.slice(-maxRows);
}

function yearWindowFromQuery(query: string): YearWindow {
  const range = query.match(/(?:since|from)?\s*(20\d{2}|19\d{2})(?:\s*(?:to|-)\s*(20\d{2}|19\d{2}))?/i);
  if (range) {
    return {
      startYear: Number(range[1]),
      endYear: range[2] ? Number(range[2]) : undefined
    };
  }
  return { startYear: 2000 };
}
