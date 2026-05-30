"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartPointSelection, ChartSpec, ChartType } from "@/types/chart";
import { compactNumber, labelize } from "@/lib/chart-utils";

type TooltipPayload = {
  color?: string;
  name?: string;
  value?: number;
  dataKey?: string;
};

type ChartClickState = {
  activeLabel?: string | number;
  activePayload?: Array<{
    payload?: Record<string, string | number>;
  }>;
};

export function ChartRenderer({
  spec,
  chartType,
  selectedXValue,
  onPointSelect
}: {
  spec: ChartSpec;
  chartType: ChartType;
  selectedXValue?: string | number | null;
  onPointSelect?: (selection: ChartPointSelection) => void;
}) {
  function handleChartClick(state: ChartClickState | null) {
    const row = state?.activePayload?.[0]?.payload;
    const xValue = row?.[spec.xKey] ?? state?.activeLabel;
    if (!row || typeof xValue === "undefined") return;
    onPointSelect?.({ xValue, row });
  }

  const selectedRow =
    typeof selectedXValue === "undefined" || selectedXValue === null
      ? null
      : spec.data.find((row) => row[spec.xKey] === selectedXValue);
  const selectedMarkerX =
    typeof selectedXValue === "undefined" || selectedXValue === null ? undefined : selectedXValue;
  const selectedMarkers = selectedRow
    ? spec.yKeys.map((key, index) => (
        <ReferenceDot
          key={`${key}-${String(selectedXValue)}`}
          x={selectedMarkerX}
          y={Number(selectedRow[key])}
          r={6}
          fill={spec.colors[index]}
          stroke="#faf8f4"
          strokeWidth={2}
          ifOverflow="extendDomain"
        />
      ))
    : null;
  const yDomain = yAxisDomain(spec, chartType);
  const xAxisLabel = axisLabelForXKey(spec.xKey);
  const yAxisLabel = axisLabelForUnit(spec.unit, spec.seriesLabels?.[0] ?? spec.yKeys[0]);
  const xAxisTicks = axisTicks(spec);

  const common = {
    data: spec.data,
    margin: { top: 22, right: 24, bottom: 58, left: 26 },
    onClick: handleChartClick
  };

  const axes = [
    <CartesianGrid key="grid" stroke="#ddd9d0" strokeDasharray="3 5" vertical={false} />,
    <XAxis
      key="x-axis"
      dataKey={spec.xKey}
      height={40}
      ticks={xAxisTicks}
      interval={0}
      minTickGap={8}
      tick={{ fill: "#1a1814", fontSize: 12, fontFamily: "DM Mono, monospace" }}
      tickLine={{ stroke: "#8a8580" }}
      tickMargin={10}
      axisLine={{ stroke: "#8a8580" }}
      label={{
        value: xAxisLabel,
        position: "insideBottom",
        offset: -28,
        fill: "#5f5a54",
        fontFamily: "DM Mono, monospace",
        fontSize: 11
      }}
    />,
    <YAxis
      key="y-axis"
      domain={yDomain}
      tick={{ fill: "#1a1814", fontSize: 12, fontFamily: "DM Mono, monospace" }}
      tickLine={{ stroke: "#8a8580" }}
      tickMargin={8}
      axisLine={{ stroke: "#8a8580" }}
      tickFormatter={(value) => formatAxisTick(Number(value), spec.unit)}
      tickCount={6}
      width={92}
      label={{
        value: yAxisLabel,
        angle: -90,
        position: "insideLeft",
        offset: 6,
        fill: "#5f5a54",
        fontFamily: "DM Mono, monospace",
        fontSize: 11
      }}
    />,
    <Tooltip key="tooltip" content={<ChartTooltip spec={spec} />} />,
    typeof selectedXValue !== "undefined" && selectedXValue !== null ? (
        <ReferenceLine
          key="selected-line"
          x={selectedXValue}
          stroke="#c0392b"
          strokeDasharray="4 3"
          ifOverflow="extendDomain"
        />
      ) : null,
    ...(selectedMarkers ?? [])
  ];

  return (
    <div className="h-[400px] w-full cursor-crosshair select-none md:h-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" ? (
          <BarChart {...common}>
            {axes}
            {spec.yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={spec.colors[index]}
                radius={[2, 2, 0, 0]}
                animationDuration={450}
                isAnimationActive
              />
            ))}
          </BarChart>
        ) : chartType === "area" ? (
          <AreaChart {...common}>
            {axes}
            {spec.yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={spec.colors[index]}
                fill={spec.colors[index]}
                fillOpacity={0.16}
                strokeWidth={2.5}
                animationDuration={450}
                isAnimationActive
              />
            ))}
          </AreaChart>
        ) : chartType === "scatter" ? (
          <ScatterChart {...common}>
            {axes}
            {spec.yKeys.map((key, index) => (
              <Scatter
                key={key}
                dataKey={key}
                fill={spec.colors[index]}
                animationDuration={450}
                isAnimationActive
              />
            ))}
          </ScatterChart>
        ) : (
          <LineChart {...common}>
            {axes}
            {spec.yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={spec.colors[index]}
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 2.4, fill: spec.colors[index], stroke: "#faf8f4", strokeWidth: 1 }}
                activeDot={{ r: 7, fill: spec.colors[index], stroke: "#faf8f4", strokeWidth: 2.5 }}
                animationDuration={450}
                isAnimationActive
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function yAxisDomain(spec: ChartSpec, chartType: ChartType): [number | "auto", number | "auto"] {
  const values = spec.data
    .flatMap((row) => spec.yKeys.map((key) => Number(row[key])))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return ["auto", "auto"];

  if (chartType === "bar") return [0, niceUpperBound(Math.max(...values))];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const padding = range > 0 ? range * 0.14 : Math.max(Math.abs(max) * 0.08, 1);
  const lower = min >= 0 ? Math.max(0, min - padding) : min - padding;

  return [roundAxisBoundary(lower), roundAxisBoundary(max + padding)];
}

function roundAxisBoundary(value: number) {
  if (!Number.isFinite(value) || value === 0) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(value))) - 1);
  return Number((Math.round(value / magnitude) * magnitude).toPrecision(12));
}

function formatAxisTick(value: number, unit: string) {
  const formatted = axisCompactNumber(value);
  if (unit === "$") return `$${formatted}`;
  if (unit === "%") return `${formatted}%`;
  return formatted;
}

function niceUpperBound(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "auto";
  const padded = value * 1.08;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const normalized = padded / magnitude;
  const nice =
    normalized <= 1
      ? 1
      : normalized <= 1.2
        ? 1.2
        : normalized <= 1.5
          ? 1.5
          : normalized <= 2
            ? 2
            : normalized <= 3
              ? 3
              : normalized <= 5
                ? 5
                : 10;

  return Number((nice * magnitude).toPrecision(12));
}

function axisCompactNumber(value: number) {
  const absolute = Math.abs(value);
  const maximumFractionDigits = absolute >= 1_000_000 && absolute < 10_000_000 ? 1 : 0;

  return new Intl.NumberFormat("en", {
    notation: absolute >= 10000 ? "compact" : "standard",
    maximumFractionDigits
  }).format(value);
}

function axisLabelForXKey(xKey: string) {
  if (xKey === "date") return "Date";
  if (xKey === "year") return "Year";
  return labelize(xKey);
}

function axisLabelForUnit(unit: string, fallback: string) {
  if (unit === "$") return "Dollars";
  if (unit === "%") return "Percent";
  if (unit === "people") return "People";
  if (unit === "index") return "Index";
  if (unit === "years") return "Years";
  if (unit === "bn") return "Billions";
  if (unit === "trillion USD") return "Trillion USD";
  return unit ? labelize(unit) : labelize(fallback);
}

function axisTicks(spec: ChartSpec) {
  const values = spec.data
    .map((row) => row[spec.xKey])
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number");
  if (values.length <= 6) return values;

  const targetTickCount = 5;
  const indexes = new Set<number>();
  for (let index = 0; index < targetTickCount; index += 1) {
    indexes.add(Math.round((index * (values.length - 1)) / (targetTickCount - 1)));
  }

  return Array.from(indexes)
    .sort((left, right) => left - right)
    .map((index) => values[index]);
}

function ChartTooltip({
  active,
  label,
  payload,
  spec
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayload[];
  spec: ChartSpec;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-ink bg-paper px-3 py-2 text-ink shadow-[4px_4px_0_var(--rule)]">
      <p className="font-mono text-[11px] uppercase text-accent">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex min-w-40 items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2" style={{ backgroundColor: item.color }} />
              {item.name ?? labelize(String(item.dataKey))}
            </span>
            <span className="font-mono text-xs text-ink">
              {spec.unit === "$" ? "$" : ""}
              {compactNumber(Number(item.value))}
              {spec.unit && spec.unit !== "$" && spec.unit !== "index" ? ` ${spec.unit}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
