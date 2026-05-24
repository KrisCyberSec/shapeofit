import type { ChartSpec, ChartType } from "@/types/chart";
import { DataFreshnessTag } from "./DataFreshnessTag";

const CHART_TYPES: ChartType[] = ["line", "bar", "area", "scatter"];

export function ChartHeader({
  spec,
  chartType,
  onChartTypeChange
}: {
  spec: ChartSpec;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-rule pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl leading-none text-ink md:text-5xl">
          {spec.title}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink2">{spec.subtitle}</p>
      </div>

      <div className="flex flex-col items-start gap-3 lg:items-end">
        <DataFreshnessTag source={spec.dataSource} />
        <div className="grid grid-cols-4 border border-rule bg-paper">
          {CHART_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`h-9 min-w-16 px-3 font-mono text-[11px] uppercase ${
                chartType === type ? "bg-ink text-paper" : "text-ink2 hover:bg-rule2"
              }`}
              onClick={() => onChartTypeChange(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
