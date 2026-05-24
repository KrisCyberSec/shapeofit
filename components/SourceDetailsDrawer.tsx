import { ExternalLink, X } from "lucide-react";
import type { ChartSpec, DataSource } from "@/types/chart";

const SOURCE_LABELS: Record<DataSource, string> = {
  live_treasury: "Live official data",
  live_fred: "Live macro data",
  live_coingecko: "Live market data",
  csv_upload: "Uploaded data",
  training: "Historical estimate",
  approximate: "Approximate preview"
};

const SOURCE_EXPLANATIONS: Record<DataSource, string> = {
  live_treasury:
    "Fetched from the U.S. Treasury Fiscal Data API when the chart is requested.",
  live_fred: "Fetched from the public FRED graph data endpoint when the chart is requested.",
  live_coingecko: "Fetched from CoinGecko market data when the chart is requested.",
  csv_upload: "Built from a user-provided file.",
  training: "Based on stable historical summaries, not refreshed live.",
  approximate:
    "A clearly labeled educational estimate used when the app cannot verify a live source."
};

export function SourceDetailsDrawer({
  spec,
  onClose
}: {
  spec: ChartSpec;
  onClose: () => void;
}) {
  const assumptions = spec.assumptions?.length
    ? spec.assumptions
    : [SOURCE_EXPLANATIONS[spec.dataSource]];

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ink/30"
        aria-label="Close source details"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-rule bg-paper shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-rule p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Source Details
            </p>
            <h2 className="mt-2 font-display text-3xl leading-none text-ink">
              {SOURCE_LABELS[spec.dataSource]}
            </h2>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center border border-rule text-ink2 hover:border-ink hover:text-ink"
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            <Detail label="Chart" value={spec.title} />
            <Detail label="Freshness" value={spec.sourceUpdatedAt ?? "Not live-refreshed"} />
            <Detail label="Source note" value={spec.source} />
            <Detail label="Generated from" value={spec.generatedFrom ?? "Daily story or saved chart"} />

            {spec.sourceUrl ? (
              <a
                className="inline-flex items-center gap-2 border border-rule px-3 py-2 text-sm text-ink2 hover:border-ink hover:text-ink"
                href={spec.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open source <ExternalLink size={14} />
              </a>
            ) : null}

            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
                Assumptions
              </p>
              <ul className="mt-3 space-y-3">
                {assumptions.map((item) => (
                  <li
                    key={item}
                    className="border-l-2 border-rule pl-3 text-sm leading-6 text-ink2"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">{label}</p>
      <p className="mt-2 text-sm leading-6 text-ink2">{value}</p>
    </div>
  );
}
