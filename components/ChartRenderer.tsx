"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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

  const common = {
    data: spec.data,
    margin: { top: 18, right: 12, bottom: 8, left: 0 },
    onClick: handleChartClick
  };

  const axes = (
    <>
      <CartesianGrid stroke="#ddd9d0" strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey={spec.xKey}
        tick={{ fill: "#4a4640", fontSize: 12 }}
        tickLine={false}
        axisLine={{ stroke: "#ddd9d0" }}
      />
      <YAxis
        tick={{ fill: "#4a4640", fontSize: 12 }}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => compactNumber(Number(value))}
        width={54}
      />
      <Tooltip content={<ChartTooltip spec={spec} />} />
      {typeof selectedXValue !== "undefined" && selectedXValue !== null ? (
        <ReferenceLine
          x={selectedXValue}
          stroke="#c0392b"
          strokeDasharray="4 3"
          ifOverflow="extendDomain"
        />
      ) : null}
    </>
  );

  return (
    <div className="h-[280px] w-full cursor-crosshair md:h-[380px]">
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
                fillOpacity={0.18}
                strokeWidth={2}
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
                strokeWidth={2.5}
                dot={{ r: 3, fill: spec.colors[index], strokeWidth: 0 }}
                activeDot={{ r: 5, fill: spec.colors[index], stroke: "#faf8f4", strokeWidth: 2 }}
                isAnimationActive
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
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
    <div className="border border-ink bg-ink px-3 py-2 text-paper">
      <p className="font-mono text-[11px] uppercase text-rule">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex min-w-40 items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2" style={{ backgroundColor: item.color }} />
              {item.name ?? labelize(String(item.dataKey))}
            </span>
            <span className="font-mono text-xs">
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
