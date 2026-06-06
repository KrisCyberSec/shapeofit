import type { ChartSpec, ChartType, DataSource } from "@/types/chart";

const CHART_TYPES = new Set<ChartType>(["line", "bar", "area", "scatter"]);
const DATA_SOURCES = new Set<DataSource>([
  "live_treasury",
  "live_fred",
  "live_worldbank",
  "live_dhs",
  "live_coingecko",
  "csv_upload",
  "training",
  "approximate"
]);

const DEFAULT_COLORS = ["#c0392b", "#2980b9", "#16a085", "#8e44ad", "#d4ac0d"];

export function isChartSpec(value: unknown): value is ChartSpec {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChartSpec>;

  return (
    typeof candidate.title === "string" &&
    typeof candidate.subtitle === "string" &&
    typeof candidate.chartType === "string" &&
    CHART_TYPES.has(candidate.chartType) &&
    Array.isArray(candidate.data) &&
    candidate.data.length > 0 &&
    typeof candidate.xKey === "string" &&
    Array.isArray(candidate.yKeys) &&
    candidate.yKeys.length > 0 &&
    candidate.yKeys.length <= 5 &&
    typeof candidate.unit === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.insight === "string" &&
    typeof candidate.dataSource === "string" &&
    DATA_SOURCES.has(candidate.dataSource)
  );
}

export function normalizeSpec(spec: ChartSpec): ChartSpec {
  const yKeys = spec.yKeys.slice(0, 5);

  return {
    ...spec,
    chartType: spec.chartType,
    data: spec.data.filter((row) => row && typeof row === "object"),
    yKeys,
    colors: yKeys.map((_, index) => spec.colors[index] ?? DEFAULT_COLORS[index]),
    assumptions: spec.assumptions?.slice(0, 4),
    seriesLabels: yKeys.map((key, index) => spec.seriesLabels?.[index] ?? labelize(key)),
    followUpPrompts: spec.followUpPrompts?.slice(0, 4)
  };
}

export function labelize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function compactNumber(value: number) {
  const absolute = Math.abs(value);
  if (absolute > 0 && absolute < 1) {
    return new Intl.NumberFormat("en", {
      maximumFractionDigits: absolute < 0.01 ? 6 : absolute < 0.1 ? 4 : 3
    }).format(value);
  }

  return new Intl.NumberFormat("en", {
    notation: absolute >= 10000 ? "compact" : "standard",
    maximumFractionDigits: absolute >= 100 ? 0 : 1
  }).format(value);
}

export function calculateStats(spec: ChartSpec) {
  return spec.yKeys.map((key, index) => {
    const values = spec.data
      .map((row) => Number(row[key]))
      .filter((value) => Number.isFinite(value));
    const latest = values.at(-1) ?? 0;
    const peak = values.length ? Math.max(...values) : 0;
    const average = values.length
      ? values.reduce((total, value) => total + value, 0) / values.length
      : 0;

    return {
      key,
      label: spec.seriesLabels?.[index] ?? labelize(key),
      color: spec.colors[index],
      latest,
      peak,
      average
    };
  });
}

export function mergeComparison(base: ChartSpec, addition: ChartSpec): ChartSpec {
  const baseKey = base.yKeys[0];
  const additionKey = addition.yKeys[0];
  const nextKey = uniqueKey(additionKey, base.yKeys);
  const length = Math.min(base.data.length, addition.data.length);
  const baseRows = base.data.slice(-length);
  const additionRows = addition.data.slice(-length);
  const baseStart = Number(baseRows[0]?.[baseKey]) || 1;
  const additionStart = Number(additionRows[0]?.[additionKey]) || 1;
  const data = base.data.slice(-length).map((row, index) => ({
    ...row,
    [baseKey]: indexValue(Number(row[baseKey]), baseStart),
    [nextKey]: indexValue(Number(additionRows[index]?.[additionKey]), additionStart)
  }));

  return normalizeSpec({
    ...base,
    title: `${base.seriesLabels?.[0] ?? base.title} vs ${addition.seriesLabels?.[0] ?? addition.title}`,
    subtitle: "A side-by-side comparison indexed to 100 at the first shared point.",
    chartType: base.chartType === "bar" ? "line" : base.chartType,
    data,
    yKeys: [baseKey, nextKey].slice(0, 3),
    colors: [base.colors[0] ?? "#c0392b", addition.colors[0] ?? "#2980b9"],
    seriesLabels: [
      base.seriesLabels?.[0] ?? base.title,
      addition.seriesLabels?.[0] ?? addition.title
    ],
    unit: "index",
    source: mergeText(base.source, addition.source) ?? base.source,
    sourceUrl: base.sourceUrl,
    sourceUpdatedAt: latestDateString(base.sourceUpdatedAt, addition.sourceUpdatedAt),
    sourceCadence: mergeText(base.sourceCadence, addition.sourceCadence),
    sourceTransform: mergeText(base.sourceTransform, addition.sourceTransform),
    seriesIds: Array.from(new Set([...(base.seriesIds ?? []), ...(addition.seriesIds ?? [])])),
    insight: `${addition.seriesLabels?.[0] ?? addition.title} is now layered with ${base.seriesLabels?.[0] ?? base.title}; both lines start at 100 so the shapes can be compared directly.`,
    dataSource:
      base.dataSource.startsWith("live") || addition.dataSource.startsWith("live")
        ? base.dataSource.startsWith("live")
          ? base.dataSource
          : addition.dataSource
        : "approximate"
  });
}

function indexValue(value: number, start: number) {
  if (!Number.isFinite(value) || !Number.isFinite(start) || start === 0) return 0;
  return Number(((value / start) * 100).toFixed(1));
}

function mergeText(left?: string, right?: string) {
  if (!left) return right;
  if (!right || left === right) return left;
  return `${left} + ${right}`;
}

function latestDateString(left?: string, right?: string) {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}

function uniqueKey(key: string, existing: string[]) {
  if (!existing.includes(key)) return key;
  let index = 2;
  while (existing.includes(`${key}_${index}`)) index += 1;
  return `${key}_${index}`;
}
