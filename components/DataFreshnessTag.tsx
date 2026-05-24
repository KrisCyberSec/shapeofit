import type { DataSource } from "@/types/chart";

const BADGE_CONFIG: Record<
  DataSource,
  { label: string; color: string; dot: boolean }
> = {
  live_fred: { label: "LIVE - FRED", color: "#16a085", dot: true },
  live_coingecko: { label: "LIVE - COINGECKO", color: "#16a085", dot: true },
  csv_upload: { label: "UPLOADED DATA", color: "#2980b9", dot: false },
  training: { label: "HISTORICAL EST.", color: "#d4ac0d", dot: false },
  approximate: { label: "APPROXIMATE", color: "#e67e22", dot: false }
};

export function DataFreshnessTag({ source }: { source: DataSource }) {
  const config = BADGE_CONFIG[source];

  return (
    <div
      className="inline-flex h-8 items-center gap-2 border border-rule bg-paper px-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em]"
      style={{ color: config.color }}
      title="Shows whether this chart uses live data, historical estimates, or approximate generated data."
    >
      {config.dot ? (
        <span
          className="h-2 w-2 animate-pulseDot rounded-full"
          style={{ backgroundColor: config.color }}
        />
      ) : null}
      {config.label}
    </div>
  );
}
