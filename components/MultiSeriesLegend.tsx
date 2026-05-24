import type { ChartSpec } from "@/types/chart";
import { labelize } from "@/lib/chart-utils";

export function MultiSeriesLegend({ spec }: { spec: ChartSpec }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {spec.yKeys.map((key, index) => (
        <div key={key} className="flex items-center gap-2 font-mono text-xs uppercase text-ink2">
          <span
            className="h-2.5 w-2.5"
            style={{ backgroundColor: spec.colors[index] }}
          />
          {spec.seriesLabels?.[index] ?? labelize(key)}
        </div>
      ))}
    </div>
  );
}
