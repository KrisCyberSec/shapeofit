import type { ChartSpec } from "@/types/chart";
import { normalizeSpec } from "./chart-utils";

const colors = ["#c0392b", "#2980b9", "#16a085"];

type MacroMetric = {
  key: string;
  seriesId: string;
  label: string;
  title: string;
  subtitle: string;
  unit: string;
  yKey: string;
  transform?: "yoy_percent";
  whyItMatters: string;
  assumptions: string[];
  followUpPrompts: string[];
};

type FredRow = {
  date: string;
  value: number;
};

type MacroWindow = {
  startYear: number;
  endYear?: number;
};

const MACRO_METRICS: MacroMetric[] = [
  {
    key: "inflation",
    seriesId: "CPIAUCSL",
    label: "CPI inflation",
    title: "US Inflation, Live From FRED",
    subtitle: "Consumer Price Index converted into year-over-year percent change.",
    unit: "%",
    yKey: "inflation",
    transform: "yoy_percent",
    whyItMatters:
      "Inflation is the economy's pressure gauge: it changes what paychecks, savings, rents, and groceries feel like in real life.",
    assumptions: [
      "CPI is converted into year-over-year percent change from the index level.",
      "Recent months can be revised by the source.",
      "The app samples long windows to keep the chart readable."
    ],
    followUpPrompts: [
      "mortgage rates since 2020",
      "unemployment rate since 2020",
      "gas prices since 2020"
    ]
  },
  {
    key: "mortgage",
    seriesId: "MORTGAGE30US",
    label: "30-year mortgage rate",
    title: "Mortgage Rates Moved Fast",
    subtitle: "Average 30-year fixed mortgage rate in the United States.",
    unit: "%",
    yKey: "mortgage_rate",
    whyItMatters:
      "Mortgage rates translate directly into monthly payments, so small-looking rate moves can sharply change affordability.",
    assumptions: [
      "Weekly observations are sampled for readability.",
      "This is the national average 30-year fixed mortgage rate.",
      "A rate chart does not include home prices, taxes, or insurance."
    ],
    followUpPrompts: [
      "US inflation rate since 2020",
      "fed funds rate since 2015",
      "rent vs wages since 2000"
    ]
  },
  {
    key: "unemployment",
    seriesId: "UNRATE",
    label: "Unemployment rate",
    title: "US Unemployment Rate",
    subtitle: "Civilian unemployment rate, seasonally adjusted.",
    unit: "%",
    yKey: "unemployment",
    whyItMatters:
      "Unemployment is one of the clearest ways to see labor-market stress, recessions, and recoveries.",
    assumptions: [
      "Monthly observations are seasonally adjusted by the source.",
      "Recent readings can be revised.",
      "The unemployment rate does not show wage quality or underemployment by itself."
    ],
    followUpPrompts: [
      "wages since 2020",
      "fed funds rate since 2015",
      "US inflation rate since 2020"
    ]
  },
  {
    key: "fed_funds",
    seriesId: "FEDFUNDS",
    label: "Fed funds rate",
    title: "The Fed Funds Rate Shows Policy Pressure",
    subtitle: "Effective federal funds rate, monthly average.",
    unit: "%",
    yKey: "fed_funds",
    whyItMatters:
      "The Fed funds rate shapes borrowing costs across the economy, from credit cards to mortgages to business investment.",
    assumptions: [
      "Monthly values are effective federal funds rate averages.",
      "This is a policy-rate proxy, not every consumer borrowing rate.",
      "Rate changes can affect the economy with a lag."
    ],
    followUpPrompts: [
      "mortgage rates since 2020",
      "US inflation rate since 2020",
      "unemployment rate since 2020"
    ]
  },
  {
    key: "gas",
    seriesId: "GASREGW",
    label: "Regular gas price",
    title: "US Gas Prices",
    subtitle: "Average regular gasoline price in dollars per gallon.",
    unit: "$",
    yKey: "gas_price",
    whyItMatters:
      "Gas prices are one of the most visible prices in daily life, so they strongly shape how people feel inflation.",
    assumptions: [
      "Weekly observations are sampled for readability.",
      "National averages can hide large regional differences.",
      "Fuel prices can react quickly to oil markets, refining capacity, taxes, and seasonal demand."
    ],
    followUpPrompts: [
      "US inflation rate since 2020",
      "coffee prices over the last decade",
      "wages since 2020"
    ]
  },
  {
    key: "wages",
    seriesId: "CES0500000003",
    label: "Average hourly earnings",
    title: "US Average Hourly Earnings",
    subtitle: "Average hourly earnings of all employees, total private.",
    unit: "$",
    yKey: "wages",
    whyItMatters:
      "Wage growth is the other half of affordability: prices hurt less when pay rises enough to keep up.",
    assumptions: [
      "Monthly values are average hourly earnings for total private employment.",
      "The chart does not adjust wages for inflation.",
      "Averages can hide large differences across industries and workers."
    ],
    followUpPrompts: [
      "US inflation rate since 2020",
      "rent vs wages since 2000",
      "unemployment rate since 2020"
    ]
  },
  {
    key: "food_inflation",
    seriesId: "CPIFABSL",
    label: "Food inflation",
    title: "US Food Inflation",
    subtitle: "Food and beverages CPI converted into year-over-year percent change.",
    unit: "%",
    yKey: "food_inflation",
    transform: "yoy_percent",
    whyItMatters:
      "Food inflation is felt immediately because groceries are frequent purchases and hard to delay.",
    assumptions: [
      "Food and beverages CPI is converted into year-over-year percent change.",
      "The series is sampled for readability.",
      "Recent months can be revised by the source."
    ],
    followUpPrompts: [
      "US inflation rate since 2020",
      "gas prices since 2020",
      "wages since 2020"
    ]
  },
  {
    key: "home_prices",
    seriesId: "CSUSHPISA",
    label: "Home price index",
    title: "US Home Prices",
    subtitle: "S&P CoreLogic Case-Shiller US National Home Price Index.",
    unit: "index",
    yKey: "home_prices",
    whyItMatters:
      "Home prices shape wealth, rent pressure, down-payment needs, and whether moving feels possible.",
    assumptions: [
      "Index values show price movement, not dollar home prices.",
      "Monthly readings can lag current market conditions.",
      "The chart does not include mortgage rates or local market differences."
    ],
    followUpPrompts: [
      "mortgage rates since 2020",
      "rent vs wages since 2000",
      "US inflation rate since 2020"
    ]
  }
];

export function isMacroQuery(query: string) {
  return Boolean(metricForQuery(query));
}

export async function macroSpecForQuery(query: string): Promise<ChartSpec | null> {
  const metric = metricForQuery(query);
  if (!metric) return null;
  return getMacroSpec(metric.key, windowForQuery(query));
}

export async function getMacroSpec(
  metricKey: string,
  window: MacroWindow = { startYear: 2015 }
): Promise<ChartSpec> {
  const metric = MACRO_METRICS.find((item) => item.key === metricKey);
  if (!metric) throw new Error(`Unsupported macro metric: ${metricKey}`);

  const rawRows = await fetchFredRows(metric.seriesId);
  const transformed = metric.transform === "yoy_percent" ? toYearOverYear(rawRows) : rawRows;
  const filtered = transformed.filter((row) => {
    const year = Number(row.date.slice(0, 4));
    return year >= window.startYear && (!window.endYear || year <= window.endYear);
  });
  const sampled = sampleRows(filtered, 18);

  if (!sampled.length) throw new Error(`FRED returned no usable rows for ${metric.seriesId}`);

  const first = sampled[0];
  const latest = sampled.at(-1) ?? first;
  const change = latest.value - first.value;

  return normalizeSpec({
    title: metric.title,
    subtitle: `${metric.subtitle} Shown from ${window.startYear}${window.endYear ? ` to ${window.endYear}` : " to latest available"}.`,
    chartType: "line",
    data: sampled.map((row) => ({
      date: shortDate(row.date),
      [metric.yKey]: Number(row.value.toFixed(metric.unit === "$" ? 2 : 1))
    })),
    xKey: "date",
    yKeys: [metric.yKey],
    colors: [colors[0]],
    unit: metric.unit,
    source: `Live FRED graph data, series ${metric.seriesId}.`,
    sourceUrl: `https://fred.stlouisfed.org/series/${metric.seriesId}`,
    sourceUpdatedAt: latest.date,
    assumptions: metric.assumptions,
    insight: `${metric.label} ${change >= 0 ? "rose" : "fell"} by about ${formatChange(Math.abs(change), metric.unit)} across this window.`,
    whyItMatters: metric.whyItMatters,
    dataSource: "live_fred",
    seriesLabels: [metric.label],
    followUpPrompts: metric.followUpPrompts
  });
}

function metricForQuery(query: string) {
  const lower = query.toLowerCase();

  if (lower.includes("rent") && (lower.includes("wage") || lower.includes("pay"))) {
    return null;
  }
  if (lower.includes("food") && (lower.includes("inflation") || lower.includes("price"))) {
    return MACRO_METRICS.find((item) => item.key === "food_inflation");
  }
  if (lower.includes("inflation") || lower.includes("cpi")) {
    return MACRO_METRICS.find((item) => item.key === "inflation");
  }
  if (lower.includes("mortgage")) {
    return MACRO_METRICS.find((item) => item.key === "mortgage");
  }
  if (lower.includes("unemployment") || lower.includes("jobless")) {
    return MACRO_METRICS.find((item) => item.key === "unemployment");
  }
  if (lower.includes("fed funds") || lower.includes("federal funds") || lower.includes("interest rate")) {
    return MACRO_METRICS.find((item) => item.key === "fed_funds");
  }
  if (lower.includes("gas") || lower.includes("gasoline")) {
    return MACRO_METRICS.find((item) => item.key === "gas");
  }
  if (lower.includes("wages") || lower.includes("hourly earnings") || lower.includes("pay")) {
    return MACRO_METRICS.find((item) => item.key === "wages");
  }
  if (lower.includes("home price") || lower.includes("house price")) {
    return MACRO_METRICS.find((item) => item.key === "home_prices");
  }

  return null;
}

function windowForQuery(query: string) {
  const lower = query.toLowerCase();
  const range = lower.match(/(?:since|from)?\s*(20\d{2}|19\d{2})(?:\s*(?:to|-)\s*(20\d{2}|19\d{2}))?/);
  if (range) {
    return {
      startYear: Number(range[1]),
      endYear: range[2] ? Number(range[2]) : undefined
    };
  }
  return { startYear: lower.includes("last decade") ? new Date().getFullYear() - 10 : 2015 };
}

async function fetchFredRows(seriesId: string) {
  const endpoint = new URL("https://fred.stlouisfed.org/graph/fredgraph.csv");
  endpoint.searchParams.set("id", seriesId);

  const response = await fetch(endpoint, { next: { revalidate: 60 * 60 * 6 } });
  if (!response.ok) throw new Error(`FRED CSV request failed for ${seriesId}`);

  return parseFredCsv(await response.text(), seriesId);
}

function parseFredCsv(csv: string, seriesId: string): FredRow[] {
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, rawValue] = line.split(",");
      const value = Number(rawValue);
      return { date, value };
    })
    .filter((row) => row.date && Number.isFinite(row.value) && row.date !== seriesId);
}

function toYearOverYear(rows: FredRow[]) {
  const byDate = new Map(rows.map((row) => [row.date, row.value]));

  return rows
    .map((row) => {
      const previousYear = `${Number(row.date.slice(0, 4)) - 1}${row.date.slice(4)}`;
      const previousValue = byDate.get(previousYear);
      if (!previousValue) return null;
      return {
        date: row.date,
        value: ((row.value - previousValue) / previousValue) * 100
      };
    })
    .filter((row): row is FredRow => Boolean(row));
}

function sampleRows<T>(rows: T[], maxRows: number) {
  if (rows.length <= maxRows) return rows;
  const stride = Math.ceil(rows.length / maxRows);
  const sampled = rows.filter((_, index) => index % stride === 0);
  const last = rows.at(-1);
  if (last && sampled.at(-1) !== last) sampled.push(last);
  return sampled.slice(-maxRows);
}

function shortDate(date: string) {
  const [year, month] = date.split("-");
  return `${year}-${month}`;
}

function formatChange(value: number, unit: string) {
  if (unit === "$") return `$${value.toFixed(2)}`;
  if (unit === "%") return `${value.toFixed(1)} percentage points`;
  if (unit === "index") return `${value.toFixed(1)} index points`;
  return `${value.toFixed(1)} ${unit}`;
}
