import type { ChartPointSelection, ChartSpec } from "@/types/chart";
import { compactNumber } from "./chart-utils";

export function chartStorageKey(spec: ChartSpec) {
  return `shapeofit-annotations:${spec.generatedFrom ?? spec.title}:${spec.subtitle}`;
}

export function legacyChartStorageKey(spec: ChartSpec) {
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

  if (spec.dataSource === "live_fred" && lowerTitle.includes("inflation")) {
    return {
      title: "Inflation pressure point",
      body: movement
        ? `${movement} Inflation points are best read against the prior year because this chart uses year-over-year CPI change.`
        : "This point is year-over-year CPI inflation, so it measures how much prices changed from the same month a year earlier."
    };
  }

  if (spec.dataSource === "live_fred" && lowerTitle.includes("mortgage")) {
    return {
      title: "Borrowing cost checkpoint",
      body: movement
        ? `${movement} Mortgage-rate moves matter because they change monthly payments even when the home price stays the same.`
        : "This point shows the national 30-year fixed mortgage-rate average, a practical proxy for homebuyer borrowing costs."
    };
  }

  if (spec.dataSource === "live_fred" && lowerTitle.includes("unemployment")) {
    return {
      title: "Labor-market stress point",
      body: movement
        ? `${movement} Unemployment points help reveal whether labor-market pressure is building or easing.`
        : "This point shows the seasonally adjusted unemployment rate, one of the simplest gauges of labor-market stress."
    };
  }

  if (spec.dataSource === "live_fred" && lowerTitle.includes("fed funds")) {
    return {
      title: "Policy-rate checkpoint",
      body: movement
        ? `${movement} This matters because Fed policy changes often ripple into mortgages, credit cards, savings rates, and business borrowing.`
        : "This point shows the effective federal funds rate, a core signal for monetary-policy pressure."
    };
  }

  if (spec.dataSource === "live_fred" && lowerTitle.includes("gas")) {
    return {
      title: "Visible price pressure",
      body: movement
        ? `${movement} Gas prices are especially noticeable because many people see them posted publicly every week.`
        : "This point shows the national regular gasoline price average, which can move quickly with oil markets and seasonal demand."
    };
  }

  if (spec.dataSource === "live_fred" && lowerTitle.includes("earnings")) {
    return {
      title: "Paycheck checkpoint",
      body: movement
        ? `${movement} Wage points matter most when compared with inflation and living costs.`
        : "This point shows average hourly earnings, a useful but broad read on paycheck growth."
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

  if (spec.dataSource === "live_worldbank" && lowerTitle.includes("life expectancy")) {
    return {
      title: "Health and society compressed into one line",
      body: movement
        ? `${movement} Life expectancy points reflect many forces at once: health systems, income, safety, behavior, and public-health shocks.`
        : "This point shows national life expectancy at birth, which is best read as a broad social-health signal rather than a single-cause measure."
    };
  }

  if (spec.dataSource === "live_worldbank" && lowerTitle.includes("urban")) {
    return {
      title: "Urbanization checkpoint",
      body: movement
        ? `${movement} Urbanization changes infrastructure, housing, transit, energy use, and where economic opportunity concentrates.`
        : "This point shows the share of people living in urban areas, a slow-moving but powerful structural trend."
    };
  }

  if (spec.dataSource === "live_worldbank" && lowerTitle.includes("population")) {
    return {
      title: "Population scale checkpoint",
      body: movement
        ? `${movement} Population changes slowly, so the important read is the slope across many points rather than one year.`
        : "This point anchors the population scale, which shapes labor markets, schools, housing, food demand, and climate planning."
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
