"use client";

import { BookOpen, Bookmark, Check, Clipboard, Database, History, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChartPointSelection,
  ChartSpec,
  ChartType,
  ClarificationResponse,
  UnsupportedQueryResponse
} from "@/types/chart";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { ChartRenderer } from "@/components/ChartRenderer";
import { DataFreshnessTag } from "@/components/DataFreshnessTag";
import { MultiSeriesLegend } from "@/components/MultiSeriesLegend";
import { QueryBar, type PromptSuggestion } from "@/components/QueryBar";

const PROMPTS: PromptSuggestion[] = [
  { category: "Money", prompt: "wages since 2020 vs US inflation rate since 2020" },
  { category: "Money", prompt: "US inflation rate since 2020" },
  { category: "Money", prompt: "mortgage rates versus home prices since 2000" },
  { category: "Money", prompt: "rent vs wages since 2000" },
  { category: "Money", prompt: "are houses affordable today" },
  { category: "Money", prompt: "cost of living since 1971 inflation adjusted" },
  { category: "Money", prompt: "US national debt live last 30 days" },
  { category: "Money", prompt: "unemployment rate since 2020" },
  { category: "Money", prompt: "fed funds rate since 2015" },
  { category: "Money", prompt: "gas prices since 2020" },
  { category: "Money", prompt: "US food price inflation since 2020" },
  { category: "Crypto", prompt: "Bitcoin vs Ethereum live over the last 30 days" },
  { category: "Crypto", prompt: "Bitcoin price over the last year" },
  { category: "Crypto", prompt: "Ethereum price over the last 30 days" },
  { category: "Crypto", prompt: "Solana price over the last 30 days" },
  { category: "Population", prompt: "world population growth 1960 to 2024" },
  { category: "Population", prompt: "largest countries by population today" },
  { category: "Population", prompt: "urban population share since 1960" },
  { category: "Health", prompt: "life expectancy in the US vs Japan since 1960" }
];

const STARTER_PROMPTS = [
  { label: "Crypto", prompt: "Bitcoin vs Ethereum live over the last 30 days" },
  { label: "Money", prompt: "wages since 2020 vs US inflation rate since 2020" },
  { label: "World", prompt: "life expectancy in the US vs Japan since 1960" }
];

const CHART_TYPES: ChartType[] = ["line", "bar", "area", "scatter"];

type ApiChartResponse =
  | { spec: ChartSpec; cached: boolean; mocked: boolean; latencyMs: number }
  | ClarificationResponse
  | UnsupportedQueryResponse;
type ApiErrorResponse = { message?: string };
type SavedChart = {
  query: string;
  title: string;
  url: string;
  savedAt: string;
};

export default function Home() {
  const [spec, setSpec] = useState<ChartSpec | null>(null);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarification, setClarification] = useState<ClarificationResponse | null>(null);
  const [unsupported, setUnsupported] = useState<UnsupportedQueryResponse | null>(null);
  const [currentQuery, setCurrentQuery] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<ChartPointSelection | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>(() => readSavedCharts());
  const resultRef = useRef<HTMLElement | null>(null);
  const hasResult = Boolean(spec || clarification || unsupported || error || loading);
  const activeSourceLine = useMemo(() => {
    if (!spec) return "";
    return [
      spec.source,
      spec.sourceCadence ? `Cadence: ${spec.sourceCadence}` : null,
      spec.sourceTransform ? `Transform: ${spec.sourceTransform}` : null,
      spec.sourceUpdatedAt ? `Updated ${spec.sourceUpdatedAt}` : null
    ]
      .filter(Boolean)
      .join(" / ");
  }, [spec]);
  const selectedValues = useMemo(() => {
    if (!spec || !selectedPoint) return [];
    return spec.yKeys.map((key, index) => ({
      key,
      label: spec.seriesLabels?.[index] ?? key,
      color: spec.colors[index],
      value: selectedPoint.row[key]
    }));
  }, [selectedPoint, spec]);

  useEffect(() => {
    const initialQuery = new URL(window.location.href).searchParams.get("q")?.trim();
    if (initialQuery) {
      void runQuery(initialQuery, { syncUrl: false, scroll: false });
    }
    // Initial URL hydration only; later searches are user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runQuery(
    query: string,
    options: { syncUrl?: boolean; scroll?: boolean } = {}
  ) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setError(null);
    setClarification(null);
    setUnsupported(null);
    setSelectedPoint(null);
    setSourceOpen(false);
    setShareCopied(false);
    setSaved(false);
    setCurrentQuery(cleanQuery);

    try {
      const response = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cleanQuery })
      });
      const payload = (await response.json()) as ApiChartResponse | ApiErrorResponse;

      if (!response.ok) {
        throw new Error("message" in payload ? payload.message : "Something went wrong.");
      }

      if ("needsClarification" in payload) {
        setSpec(null);
        setClarification(payload);
        return;
      }

      if ("unsupported" in payload) {
        setSpec(null);
        setUnsupported(payload);
        return;
      }

      if (!("spec" in payload)) {
        throw new Error("The chart response was missing chart data.");
      }

      const nextSpec = { ...payload.spec, generatedFrom: cleanQuery };
      setSpec(nextSpec);
      setChartType(nextSpec.chartType);

      if (options.syncUrl !== false) {
        syncChartUrl(cleanQuery);
      }
      if (options.scroll !== false) {
        scrollToResult();
      }
    } catch (caught) {
      setSpec(null);
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function scrollToResult() {
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function copyChartLink() {
    if (!spec) return;
    const url = chartUrl(currentQuery);
    await navigator.clipboard?.writeText(url);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1600);
  }

  function saveChart() {
    if (!spec) return;
    const item = {
      query: currentQuery,
      title: spec.title,
      url: chartUrl(currentQuery),
      savedAt: new Date().toISOString()
    };
    const existing = readSavedCharts();
    const next = [item, ...existing.filter((savedItem) => savedItem.url !== item.url)].slice(0, 12);
    localStorage.setItem("shapeofit:saved", JSON.stringify(next));
    setSavedCharts(next);
    setSaved(true);
  }

  return (
    <main className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <header className="double-rule py-4 md:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                {BRAND_NAME}
              </p>
              <h1 className="mt-2 max-w-3xl font-display text-5xl leading-none text-ink md:text-7xl">
                {BRAND_TAGLINE}
              </h1>
            </div>
            <p className="max-w-sm text-sm leading-6 text-ink2 md:text-base md:leading-7">
              Type a data question. Get a sourced chart. Explore the shape yourself.
            </p>
          </div>
        </header>

        <section className="py-5 md:py-6">
          <div className="border border-ink bg-paper p-3 md:p-5">
            <QueryBar
              suggestions={PROMPTS}
              loading={loading}
              placeholder="Ask for a chart..."
              submitLabel="Show Chart"
              onSubmit={(query) => runQuery(query)}
            />
            {!hasResult ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((item) => (
                    <button
                      key={item.prompt}
                      type="button"
                      className="group border border-rule px-3 py-2 text-left text-sm text-ink2 hover:border-ink hover:bg-ink hover:text-paper"
                      disabled={loading}
                      onClick={() => runQuery(item.prompt)}
                    >
                      <span className="mr-2 font-mono text-[10px] uppercase text-accent group-hover:text-paper">
                        {item.label}
                      </span>
                      {item.prompt}
                    </button>
                  ))}
                </div>
                {savedCharts.length ? (
                  <div className="border border-rule bg-bg p-3">
                    <p className="flex items-center gap-2 font-mono text-[10px] uppercase text-accent">
                      <History size={13} />
                      Saved
                    </p>
                    <div className="mt-2 space-y-2">
                      {savedCharts.slice(0, 3).map((item) => (
                        <button
                          key={item.url}
                          type="button"
                          className="block w-full text-left text-xs leading-5 text-ink2 hover:text-ink"
                          onClick={() => runQuery(item.query)}
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section ref={resultRef} className="pb-10">
          {loading ? (
            <div className="border border-rule bg-paper p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                Drawing Chart
              </p>
              <div className="mt-4 h-2 overflow-hidden border border-rule bg-bg">
                <div className="h-full w-1/2 animate-[loadingBar_1.1s_ease-in-out_infinite] bg-ink" />
              </div>
              <p className="mt-4 text-sm leading-6 text-ink3">{currentQuery}</p>
            </div>
          ) : null}

          {error ? (
            <div className="border border-accent bg-paper p-4 text-accent">{error}</div>
          ) : null}

          {clarification ? (
            <div className="border border-ink bg-paper p-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                Clarify
              </p>
              <h2 className="mt-3 font-display text-3xl text-ink">{clarification.question}</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {clarification.options.map((option) => (
                  <button
                    key={option.refinedQuery}
                    type="button"
                    className="border border-rule px-4 py-3 text-left text-ink2 hover:border-ink hover:bg-ink hover:text-paper"
                    onClick={() => runQuery(option.refinedQuery)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {unsupported ? (
            <div className="border border-rule bg-paper p-5 md:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                Not Mapped Yet
              </p>
              <h2 className="mt-3 font-display text-4xl leading-none text-ink md:text-5xl">
                No reliable source for that question yet.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink2">
                {unsupported.message}
              </p>
              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {unsupported.supportedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="border border-rule px-3 py-3 text-left text-sm leading-5 text-ink2 hover:border-ink hover:bg-ink hover:text-paper"
                    onClick={() => runQuery(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {spec && !loading ? (
            <article className="animate-fade-up border border-ink bg-paper p-4 md:p-6">
              <div className="flex flex-col gap-4 border-b border-rule pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                    {currentQuery ? `Question: ${currentQuery}` : "Chart"}
                  </p>
                  <h2 className="mt-3 font-display text-4xl leading-none text-ink md:text-6xl">
                    {spec.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-ink2">{spec.subtitle}</p>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <DataFreshnessTag source={spec.dataSource} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      title="Copy chart link"
                      className="flex h-9 items-center gap-2 border border-rule px-3 font-mono text-[11px] uppercase text-ink2 hover:border-ink hover:bg-ink hover:text-paper"
                      onClick={copyChartLink}
                    >
                      {shareCopied ? <Check size={14} /> : <Clipboard size={14} />}
                      {shareCopied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      title="Save chart locally"
                      className="flex h-9 items-center gap-2 border border-rule px-3 font-mono text-[11px] uppercase text-ink2 hover:border-ink hover:bg-ink hover:text-paper"
                      onClick={saveChart}
                    >
                      {saved ? <Check size={14} /> : <Bookmark size={14} />}
                      {saved ? "Saved" : "Save"}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 overflow-hidden border border-rule bg-paper">
                    {CHART_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`h-9 min-w-16 px-3 font-mono text-[11px] uppercase ${
                          chartType === type ? "bg-ink text-paper" : "text-ink2 hover:bg-rule2"
                        }`}
                        onClick={() => setChartType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <MultiSeriesLegend spec={spec} />
              </div>

              <div className="mt-5 border-y border-rule2 bg-bg px-2 py-5 md:px-4">
                <ChartRenderer
                  spec={spec}
                  chartType={chartType}
                  selectedXValue={selectedPoint?.xValue}
                  onPointSelect={setSelectedPoint}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase text-ink3">
                Click the chart to pin a point.
              </p>

              <footer className="mt-5 grid gap-5 text-sm leading-6 text-ink3 lg:grid-cols-[1fr_360px]">
                <div className="min-w-0">
                  <p>{spec.insight}</p>
                  {selectedPoint ? (
                    <div className="mt-3 border border-rule bg-bg p-3">
                      <p className="font-mono text-[11px] uppercase text-accent">
                        Selected: {String(selectedPoint.xValue)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedValues.map((item) => (
                          <span
                            key={item.key}
                            className="inline-flex items-center gap-2 border border-rule bg-paper px-2 py-1 font-mono text-[11px] uppercase text-ink2"
                          >
                            <span className="h-2 w-2" style={{ backgroundColor: item.color }} />
                            {item.label}: {String(item.value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="border border-rule bg-bg p-3 lg:text-right">
                  <p>
                    {activeSourceLine || spec.source}
                    {spec.sourceUrl ? (
                      <>
                        {" / "}
                        <a
                          className="text-ink underline decoration-rule underline-offset-4 hover:text-accent"
                          href={spec.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open source
                        </a>
                      </>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase text-ink hover:text-accent"
                    onClick={() => setSourceOpen((open) => !open)}
                  >
                    <Database size={13} />
                    Source details
                  </button>
                </div>
              </footer>

              {spec.referenceContext ? (
                <div className="mt-5 border border-rule bg-bg p-4 text-sm leading-6 text-ink2">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="flex items-center gap-2 font-mono text-[11px] uppercase text-accent">
                        <BookOpen size={13} />
                        Reference · Grokipedia
                      </p>
                      <p className="mt-2 max-w-3xl">{spec.referenceContext.summary}</p>
                    </div>
                    <div className="shrink-0 font-mono text-[10px] uppercase text-ink3 md:text-right">
                      <p>Context only</p>
                      {spec.referenceContext.url ? (
                        <a
                          className="mt-1 inline-block text-ink underline decoration-rule underline-offset-4 hover:text-accent"
                          href={spec.referenceContext.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open reference
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {sourceOpen ? (
                <div className="mt-5 border border-rule bg-bg p-4 text-sm text-ink2">
                  <div className="grid gap-3 md:grid-cols-4">
                    <SourceFact label="Cadence" value={spec.sourceCadence} />
                    <SourceFact label="Updated" value={spec.sourceUpdatedAt} />
                    <SourceFact label="Transform" value={spec.sourceTransform} />
                    <SourceFact label="Series" value={spec.seriesIds?.join(", ")} />
                  </div>
                  {spec.assumptions?.length ? (
                    <div className="mt-4 border-t border-rule pt-3">
                      <p className="flex items-center gap-2 font-mono text-[11px] uppercase text-accent">
                        <Info size={13} />
                        Source Notes
                      </p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {spec.assumptions.map((assumption) => (
                          <p key={assumption} className="leading-6">
                            {assumption}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          ) : !hasResult ? (
            <div className="border border-rule bg-paper p-8 text-center text-sm text-ink3 md:p-10">
              Start with one of the examples above or type your own mapped question.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function syncChartUrl(query: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", query);
  window.history.pushState(null, "", `${url.pathname}${url.search}`);
}

function chartUrl(query: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", query);
  return url.toString();
}

function readSavedCharts(): SavedChart[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem("shapeofit:saved") ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function SourceFact({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-accent">{label}</p>
      <p className="mt-1 text-ink">{value || "Not specified"}</p>
    </div>
  );
}
