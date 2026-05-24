import type { ChartSpec } from "@/types/chart";
import { calculateStats, compactNumber } from "@/lib/chart-utils";

export function StatCards({ spec }: { spec: ChartSpec }) {
  const stats = calculateStats(spec);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((item) => (
        <div key={item.key} className="border border-rule bg-paper p-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5" style={{ backgroundColor: item.color }} />
            <p className="font-mono text-[11px] uppercase text-ink3">{item.label}</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Latest" unit={spec.unit} value={item.latest} />
            <Metric label="Peak" unit={spec.unit} value={item.peak} />
            <Metric label="Avg" unit={spec.unit} value={item.average} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-ink3">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-none text-ink">
        {unit === "$" ? "$" : ""}
        {compactNumber(value)}
        {unit && unit !== "$" && unit !== "index" ? ` ${unit}` : ""}
      </p>
    </div>
  );
}
