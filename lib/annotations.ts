import type { ChartPointSelection, ChartSpec } from "@/types/chart";
import { compactNumber } from "./chart-utils";

export function chartStorageKey(spec: ChartSpec) {
  return `chartquery-annotations:${spec.generatedFrom ?? spec.title}:${spec.subtitle}`;
}

export function explainPoint(spec: ChartSpec, selection: ChartPointSelection) {
  const xValue = String(selection.xValue);
  const lowerTitle = spec.title.toLowerCase();
  const generatedFrom = spec.generatedFrom?.toLowerCase() ?? "";
  const values = summarizeValues(spec, selection);
  const movement = summarizeMovement(spec, selection);

  if (lowerTitle.includes("inflation") && (xValue === "2021" || xValue === "2022")) {
    return {
      title: "Inflation shock period",
      body:
        "This point sits in the pandemic-era inflation surge, when supply constraints, stimulus-driven demand, energy prices, and reopening pressure all showed up in consumer prices."
    };
  }

  if (lowerTitle.includes("remote work") && xValue === "2020") {
    return {
      title: "A sudden work reset",
      body:
        "This is the step-change year. Remote work stopped looking like a slow adoption curve and became a mass behavior almost overnight."
    };
  }

  if (lowerTitle.includes("rent") && (xValue === "2020" || xValue === "2024")) {
    return {
      title: "The affordability gap is visible here",
      body:
        "This point matters because rent and wages are no longer moving together. The distance between the lines is the affordability story."
    };
  }

  if (lowerTitle.includes("bitcoin") || lowerTitle.includes("ethereum") || generatedFrom.includes("crypto")) {
    return {
      title: "Volatility is the signal",
      body: movement
        ? `${movement} In crypto charts, the important read is often the size and direction of the move, not a single price level.`
        : "Crypto prices can swing quickly, so this point is best read as part of the surrounding shape instead of as a standalone number."
    };
  }

  if (spec.dataSource === "live_treasury") {
    return {
      title: "Official Treasury record",
      body:
        "This point is a Treasury-published daily record. Small day-to-day changes can reflect federal borrowing, redemptions, and reporting cadence rather than a single news event."
    };
  }

  if (lowerTitle.includes("marriage")) {
    return {
      title: "A generational comparison point",
      body:
        "Marriage-rate points are most useful across decades. The larger pattern is delayed or less frequent marriage, not one isolated year."
    };
  }

  if (lowerTitle.includes("population")) {
    return {
      title: "Scale matters more than a single year",
      body:
        "Population charts are slow-moving, so this point works best as a waypoint for reading the curve's long-run slope."
    };
  }

  if (lowerTitle.includes("temperature") || lowerTitle.includes("climate")) {
    return {
      title: "Read this against the baseline",
      body:
        "An anomaly point matters because it shows distance from the old baseline. Repeated points above zero are the long-run climate signal."
    };
  }

  return {
    title: `Point at ${xValue}`,
    body: movement
      ? `${values} ${movement}`
      : `${values} Use this as an anchor for comparing nearby points and the chart's overall direction.`
  };
}

function summarizeValues(spec: ChartSpec, selection: ChartPointSelection) {
  const parts = spec.yKeys.map((key, index) => {
    const label = spec.seriesLabels?.[index] ?? key;
    const value = Number(selection.row[key]);
    return `${label}: ${formatValue(value, spec.unit)}`;
  });

  return `${selection.xValue} shows ${parts.join(", ")}.`;
}

function summarizeMovement(spec: ChartSpec, selection: ChartPointSelection) {
  const selectedIndex = spec.data.findIndex((row) => row[spec.xKey] === selection.xValue);
  if (selectedIndex <= 0) return "";

  const previous = spec.data[selectedIndex - 1];
  const parts = spec.yKeys
    .map((key, index) => {
      const currentValue = Number(selection.row[key]);
      const previousValue = Number(previous[key]);
      if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return null;

      const delta = currentValue - previousValue;
      if (Math.abs(delta) < 0.001) return null;

      const label = spec.seriesLabels?.[index] ?? key;
      const direction = delta > 0 ? "up" : "down";
      return `${label} moved ${direction} ${formatValue(Math.abs(delta), spec.unit)} from the prior point`;
    })
    .filter(Boolean);

  return parts.length ? `${parts.join("; ")}.` : "";
}

function formatValue(value: number, unit: string) {
  if (unit === "$") return `$${compactNumber(value)}`;
  if (unit === "trillion USD") return `$${compactNumber(value)}T`;
  if (!unit || unit === "index") return compactNumber(value);
  return `${compactNumber(value)} ${unit}`;
}
