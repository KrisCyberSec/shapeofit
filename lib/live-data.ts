import type { ChartSpec } from "@/types/chart";
import { macroSpecForQuery } from "./macro-data";
import { normalizeSpec } from "./chart-utils";

const colors = ["#c0392b", "#2980b9", "#16a085"];

const COINS = [
  { id: "bitcoin", key: "bitcoin", label: "Bitcoin", aliases: ["bitcoin", "btc"] },
  { id: "ethereum", key: "ethereum", label: "Ethereum", aliases: ["ethereum", "eth"] },
  { id: "solana", key: "solana", label: "Solana", aliases: ["solana", "sol"] },
  { id: "dogecoin", key: "dogecoin", label: "Dogecoin", aliases: ["dogecoin", "doge"] }
];

type Coin = (typeof COINS)[number];

type CoinGeckoMarketChart = {
  prices?: Array<[number, number]>;
};

type TreasuryDebtResponse = {
  data?: Array<{
    record_date: string;
    tot_pub_debt_out_amt: string;
  }>;
};

export async function liveSpecForQuery(query: string): Promise<ChartSpec | null> {
  const lower = query.toLowerCase();

  if (isTreasuryDebtQuery(lower)) {
    return getTreasuryDebtSpec();
  }

  const macroSpec = await macroSpecForQuery(query);
  if (macroSpec) return macroSpec;

  if (isCryptoQuery(lower)) {
    const coins = coinsForQuery(lower);
    const days = daysForQuery(lower);
    return getCryptoPriceSpec(coins, days);
  }

  return null;
}

export async function getCryptoPriceSpec(coins: Coin[] = [COINS[0]], days = 30): Promise<ChartSpec> {
  const safeDays = Math.min(Math.max(Math.round(days), 1), 365);
  const series = await Promise.all(coins.slice(0, 3).map((coin) => getCoinPrices(coin, safeDays)));
  const data = buildCryptoRows(series);
  const multiSeries = series.length > 1;
  const labels = series.map((item) => item.coin.label);

  return normalizeSpec({
    title: multiSeries ? `${labels.join(" vs ")} Live Price Trend` : `${labels[0]} Live Price Trend`,
    subtitle: multiSeries
      ? `CoinGecko daily prices indexed to the first point in the last ${safeDays} days.`
      : `CoinGecko daily USD price over the last ${safeDays} days.`,
    chartType: "line",
    data,
    xKey: "date",
    yKeys: series.map((item) => item.coin.key),
    colors,
    unit: multiSeries ? "index" : "$",
    source: "Live CoinGecko market chart API, refreshed by the app route.",
    sourceUrl: "https://docs.coingecko.com/reference/coins-id-market-chart",
    sourceUpdatedAt: new Date().toISOString().slice(0, 10),
    assumptions: [
      multiSeries
        ? "Multiple coins are indexed to the first shared point so movement can be compared."
        : "Prices are shown in USD using CoinGecko's market chart endpoint.",
      "The app samples long windows to keep the chart readable.",
      "Crypto prices can move quickly between refreshes."
    ],
    insight: cryptoInsight(series, multiSeries),
    whyItMatters:
      "Live crypto charts prove the app can move beyond canned examples while still labeling the source and uncertainty clearly.",
    dataSource: "live_coingecko",
    seriesLabels: labels,
    followUpPrompts: [
      "Bitcoin price over the last year",
      "Ethereum price over the last 30 days",
      "Solana price over the last 30 days"
    ]
  });
}

export async function getTreasuryDebtSpec(limit = 30): Promise<ChartSpec> {
  const pageSize = Math.min(Math.max(Math.round(limit), 5), 90);
  const endpoint = new URL(
    "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny"
  );
  endpoint.searchParams.set("fields", "record_date,tot_pub_debt_out_amt");
  endpoint.searchParams.set("sort", "-record_date");
  endpoint.searchParams.set("page[size]", String(pageSize));

  const response = await fetch(endpoint, { next: { revalidate: 60 * 60 } });
  if (!response.ok) throw new Error("Treasury Fiscal Data request failed");

  const payload = (await response.json()) as TreasuryDebtResponse;
  const rows = payload.data
    ?.map((row) => ({
      date: row.record_date.slice(5),
      debt: Number(row.tot_pub_debt_out_amt) / 1_000_000_000_000
    }))
    .filter((row) => Number.isFinite(row.debt))
    .reverse();

  if (!rows?.length) throw new Error("Treasury Fiscal Data returned no rows");

  const latest = rows.at(-1);
  const first = rows[0];
  const change = latest && first ? latest.debt - first.debt : 0;

  return normalizeSpec({
    title: "US Public Debt, Live From Treasury",
    subtitle: `Total public debt outstanding, shown in trillions of dollars across the latest ${rows.length} Treasury records.`,
    chartType: "line",
    data: rows,
    xKey: "date",
    yKeys: ["debt"],
    colors: [colors[2]],
    unit: "trillion USD",
    source: "Live U.S. Treasury Fiscal Data API: Debt to the Penny.",
    sourceUrl: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/",
    sourceUpdatedAt: latestDate(rows),
    assumptions: [
      "Values are converted from dollars to trillions of dollars.",
      "The latest rows are sorted by Treasury record date.",
      "Weekends and federal holidays may not have a new record."
    ],
    insight: `Across this window, the reported total public debt changed by about ${formatTrillions(change)}.`,
    whyItMatters:
      "A live Treasury route gives the money category a verifiable source, which helps users distinguish official data from rough educational estimates.",
    dataSource: "live_treasury",
    seriesLabels: ["Public debt"],
    followUpPrompts: [
      "Bitcoin price over the last 30 days",
      "rent vs wages since 2000",
      "US inflation rate 2015 to 2024"
    ]
  });
}

function isCryptoQuery(lower: string) {
  return (
    lower.includes("crypto") ||
    COINS.some((coin) => coin.aliases.some((alias) => lower.includes(alias)))
  );
}

function isTreasuryDebtQuery(lower: string) {
  return (
    lower.includes("national debt") ||
    lower.includes("public debt") ||
    lower.includes("treasury debt") ||
    lower.includes("debt to the penny")
  );
}

function coinsForQuery(lower: string) {
  const matches = COINS.filter((coin) =>
    coin.aliases.some((alias) => new RegExp(`\\b${alias}\\b`, "i").test(lower))
  );

  if (matches.length) return matches;
  return [COINS[0], COINS[1]];
}

function daysForQuery(lower: string) {
  const explicitDays = lower.match(/(\d+)\s*days?/);
  if (explicitDays) return Number(explicitDays[1]);
  if (lower.includes("year") || lower.includes("12 month")) return 365;
  if (lower.includes("week") || lower.includes("7 day")) return 7;
  return 30;
}

async function getCoinPrices(coin: Coin, days: number) {
  const endpoint = new URL(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart`);
  endpoint.searchParams.set("vs_currency", "usd");
  endpoint.searchParams.set("days", String(days));
  endpoint.searchParams.set("interval", "daily");

  const response = await fetch(endpoint, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`CoinGecko request failed for ${coin.id}`);

  const payload = (await response.json()) as CoinGeckoMarketChart;
  const prices =
    dedupeByDate(
      payload.prices
        ?.map(([timestamp, price]) => ({ date: toIsoDay(timestamp), price }))
        .filter((item) => Number.isFinite(item.price)) ?? []
    );

  if (!prices.length) throw new Error(`CoinGecko returned no prices for ${coin.id}`);

  return { coin, prices: sampleRows(prices, 16) };
}

function buildCryptoRows(
  series: Array<{ coin: Coin; prices: Array<{ date: string; price: number }> }>
) {
  const shortestLength = Math.min(...series.map((item) => item.prices.length));
  const aligned = series.map((item) => ({
    ...item,
    prices: item.prices.slice(-shortestLength),
    start: item.prices.slice(-shortestLength)[0]?.price ?? 1
  }));
  const indexed = aligned.length > 1;

  return aligned[0].prices.map((row, index) => {
    const next: Record<string, string | number> = { date: row.date.slice(5) };
    aligned.forEach((item) => {
      const price = item.prices[index]?.price ?? 0;
      next[item.coin.key] = indexed ? Number(((price / item.start) * 100).toFixed(1)) : price;
    });
    return next;
  });
}

function sampleRows<T>(rows: T[], maxRows: number) {
  if (rows.length <= maxRows) return rows;
  const stride = Math.ceil(rows.length / maxRows);
  const sampled = rows.filter((_, index) => index % stride === 0);
  const last = rows.at(-1);
  if (last && sampled.at(-1) !== last) sampled.push(last);
  return sampled.slice(-maxRows);
}

function dedupeByDate(rows: Array<{ date: string; price: number }>) {
  return Array.from(
    rows
      .reduce((byDate, row) => {
        byDate.set(row.date, row);
        return byDate;
      }, new Map<string, { date: string; price: number }>())
      .values()
  );
}

function cryptoInsight(
  series: Array<{ coin: Coin; prices: Array<{ date: string; price: number }> }>,
  indexed: boolean
) {
  const changes = series.map((item) => {
    const first = item.prices[0]?.price ?? 0;
    const last = item.prices.at(-1)?.price ?? 0;
    const percent = first ? ((last - first) / first) * 100 : 0;
    return `${item.coin.label} ${percent >= 0 ? "rose" : "fell"} ${Math.abs(percent).toFixed(1)}%`;
  });

  return indexed
    ? `${changes.join("; ")} over the shared live window, indexed so the shapes are comparable.`
    : `${changes[0]} over this live CoinGecko window.`;
}

function formatTrillions(value: number) {
  const formatted = Math.abs(value).toLocaleString("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
  return `${value >= 0 ? "+" : "-"}$${formatted} trillion`;
}

function latestDate(rows: Array<{ date: string; debt: number }>) {
  const currentYear = new Date().getFullYear();
  const date = rows.at(-1)?.date;
  return date ? `${currentYear}-${date}` : undefined;
}

function toIsoDay(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}
