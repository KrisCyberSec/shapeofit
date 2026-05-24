"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, GitCompareArrows, Lightbulb, Sparkles } from "lucide-react";
import type {
  ChartAnnotation,
  ChartPointSelection,
  ChartSpec,
  ChartType,
  ClarificationResponse,
  DailyStory
} from "@/types/chart";
import { chartStorageKey } from "@/lib/annotations";
import { AnnotationPanel } from "@/components/AnnotationPanel";
import { ChartHeader } from "@/components/ChartHeader";
import { ChartRenderer } from "@/components/ChartRenderer";
import { MultiSeriesLegend } from "@/components/MultiSeriesLegend";
import { QueryBar, type PromptSuggestion } from "@/components/QueryBar";
import { SourceDetailsDrawer } from "@/components/SourceDetailsDrawer";
import { StatCards } from "@/components/StatCards";

const PROMPTS: PromptSuggestion[] = [
  { category: "Money", prompt: "rent vs wages since 2000" },
  { category: "Money", prompt: "US national debt live last 30 days" },
  { category: "Money", prompt: "US inflation rate since 2020" },
  { category: "Money", prompt: "mortgage rates since 2020" },
  { category: "Money", prompt: "unemployment rate since 2020" },
  { category: "Money", prompt: "fed funds rate since 2015" },
  { category: "Money", prompt: "gas prices since 2020" },
  { category: "Money", prompt: "wages since 2020" },
  { category: "Money", prompt: "mortgage rates versus home prices since 2000" },
  { category: "Relationships", prompt: "marriage rates in the United States since 1970" },
  { category: "Relationships", prompt: "average age at first marriage since 1970" },
  { category: "Relationships", prompt: "birth rates in the United States since 1970" },
  { category: "Population", prompt: "world population growth 1960 to 2024" },
  { category: "Population", prompt: "largest countries by population today" },
  { category: "Population", prompt: "urban population share since 1960" },
  { category: "Sports", prompt: "Lakers vs Celtics championships" },
  { category: "Sports", prompt: "NBA teams with the most championships" },
  { category: "Sports", prompt: "Warriors championships by decade" },
  { category: "Crypto", prompt: "Bitcoin vs Ethereum live over the last 30 days" },
  { category: "Crypto", prompt: "Bitcoin price over the last year" },
  { category: "Crypto", prompt: "Solana price over the last 30 days" },
  { category: "Crypto", prompt: "Bitcoin vs Ethereum price 2020 to 2024" },
  { category: "Health", prompt: "life expectancy in the US vs Japan since 1960" },
  { category: "Health", prompt: "infant mortality US vs Japan since 1960" },
  { category: "Health", prompt: "US life expectancy by gender since 1960" },
  { category: "Climate", prompt: "global temperature anomaly since 1980" },
  { category: "Climate", prompt: "carbon dioxide concentration since 1980" },
  { category: "Climate", prompt: "renewable energy share since 2000" },
  { category: "Work", prompt: "remote work adoption before and after 2020" },
  { category: "Work", prompt: "office vacancy rates since 2015" },
  { category: "Work", prompt: "commute time trends since 2000" },
  { category: "Culture", prompt: "streaming subscriptions vs cable TV since 2010" },
  { category: "Culture", prompt: "music streaming revenue since 2010" },
  { category: "Culture", prompt: "movie theater attendance since 2000" },
  { category: "Technology", prompt: "smartphone adoption in the United States" },
  { category: "Technology", prompt: "internet access in the United States since 2000" },
  { category: "Technology", prompt: "social media adoption since 2005" },
  { category: "Food", prompt: "coffee prices over the last decade" },
  { category: "Food", prompt: "US food price inflation since 2020" },
  { category: "Food", prompt: "gas prices over the last decade" }
];

const CATEGORIES = [
  "Money",
  "Relationships",
  "Population",
  "Sports",
  "Crypto",
  "Health",
  "Climate",
  "Work",
  "Culture",
  "Technology",
  "Food"
];

const COMPARISON_PRESETS = [
  {
    label: "Wages vs inflation",
    baseQuery: "wages since 2020",
    compareQuery: "US inflation rate since 2020"
  },
  {
    label: "Rates vs home prices",
    baseQuery: "mortgage rates since 2020",
    compareQuery: "home prices since 2020"
  },
  {
    label: "Jobs vs Fed",
    baseQuery: "unemployment rate since 2020",
    compareQuery: "fed funds rate since 2020"
  },
  {
    label: "Bitcoin vs Ethereum",
    baseQuery: "Bitcoin price over the last year",
    compareQuery: "Ethereum price over the last year"
  }
];

type ApiChartResponse =
  | { spec: ChartSpec; cached: boolean; mocked: boolean; latencyMs: number }
  | ClarificationResponse;
type ApiErrorResponse = { message?: string };

export default function Home() {
  const [daily, setDaily] = useState<DailyStory | null>(null);
  const [spec, setSpec] = useState<ChartSpec | null>(null);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarification, setClarification] = useState<ClarificationResponse | null>(null);
  const [history, setHistory] = useState<ChartSpec[]>([]);
  const [compareValue, setCompareValue] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "ready">("idle");
  const [exportStatus, setExportStatus] = useState<"idle" | "saved" | "failed">("idle");
  const [manualShareUrl, setManualShareUrl] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ChartPointSelection | null>(null);
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
  const chartSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const initialUrl = new URL(window.location.href);
    const initialQuery = initialUrl.searchParams.get("q")?.trim() ?? "";
    const saved = window.localStorage.getItem("chartquery-history");
    if (saved) {
      try {
        const parsed = dedupeHistory(JSON.parse(saved) as ChartSpec[]);
        queueMicrotask(() => setHistory(parsed));
      } catch {
        window.localStorage.removeItem("chartquery-history");
      }
    }

    fetch("/api/daily")
      .then((response) => response.json() as Promise<DailyStory>)
      .then((story) => {
        setDaily(story);
        if (!initialQuery) {
          const storySpec = { ...story.spec, generatedFrom: story.query };
          setSpec(storySpec);
          setChartType(storySpec.chartType);
          setCurrentQuery(story.query);
        }
      })
      .catch(() => setError("The daily story could not be loaded."));

    if (initialQuery) {
      fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: initialQuery })
      })
        .then((response) => response.json() as Promise<ApiChartResponse | ApiErrorResponse>)
        .then((payload) => {
          if ("needsClarification" in payload) {
            setClarification(payload);
            return;
          }

          if (!("spec" in payload)) {
            throw new Error("The chart response was missing chart data.");
          }

          const nextSpec = { ...payload.spec, generatedFrom: initialQuery };
          setSpec(nextSpec);
          setChartType(nextSpec.chartType);
          setCurrentQuery(initialQuery);
        })
        .catch((caught) => {
          setError(caught instanceof Error ? caught.message : "The shared chart could not be loaded.");
        });
    }
  }, []);

  useEffect(() => {
    if (!spec) {
      queueMicrotask(() => {
        setSelectedPoint(null);
        setAnnotations([]);
      });
      return;
    }

    const saved = window.localStorage.getItem(chartStorageKey(spec));
    let parsed: ChartAnnotation[] = [];
    if (saved) {
      try {
        parsed = JSON.parse(saved) as ChartAnnotation[];
      } catch {
        window.localStorage.removeItem(chartStorageKey(spec));
      }
    }

    queueMicrotask(() => {
      setSelectedPoint(null);
      setAnnotations(mergeAnnotations(readSharedAnnotations(), parsed));
    });
  }, [spec]);

  const categoryPrompts = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        prompts: PROMPTS.filter((item) => item.category === category).slice(0, 3)
      })),
    []
  );

  async function runQuery(
    query: string,
    compareWith?: ChartSpec,
    options: { syncUrl?: boolean } = {}
  ) {
    const cleanQuery = query.trim();
    setLoading(true);
    setError(null);
    setClarification(null);
    setCopyStatus("idle");
    setExportStatus("idle");
    setManualShareUrl("");

    try {
      const response = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cleanQuery, compareWith })
      });
      const payload = (await response.json()) as ApiChartResponse | ApiErrorResponse;

      if (!response.ok) {
        throw new Error("message" in payload ? payload.message : "Something went wrong.");
      }

      if ("needsClarification" in payload) {
        setClarification(payload);
        return;
      }

      if (!("spec" in payload)) {
        throw new Error("The chart response was missing chart data.");
      }

      const nextSpec = { ...payload.spec, generatedFrom: cleanQuery };
      setSpec(nextSpec);
      setChartType(nextSpec.chartType);
      setSelectedPoint(null);
      if (!compareWith) {
        setCurrentQuery(cleanQuery);
        if (options.syncUrl !== false) syncChartUrl(cleanQuery);
      }
      setHistory((current) => {
        const next = dedupeHistory([nextSpec, ...current]).slice(0, 6);
        window.localStorage.setItem("chartquery-history", JSON.stringify(next));
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleCompare() {
    const query = compareValue.trim();
    if (!query || !spec) return;
    setCompareValue("");
    void runQuery(query, spec);
  }

  async function handleCopyLink() {
    const query = currentQuery || spec?.generatedFrom;
    if (!query) return;
    const shareUrl = chartUrlForQuery(query, annotations);

    try {
      await copyTextToClipboard(shareUrl);
      setCopyStatus("copied");
      setManualShareUrl("");
      window.setTimeout(() => setCopyStatus("idle"), 1600);
    } catch {
      setCopyStatus("ready");
      setManualShareUrl(shareUrl);
    }
  }

  async function handleDownloadImage() {
    if (!spec || !chartSectionRef.current) return;

    try {
      await downloadChartPng(chartSectionRef.current, spec);
      setExportStatus("saved");
      window.setTimeout(() => setExportStatus("idle"), 1600);
    } catch {
      setExportStatus("failed");
    }
  }

  function addAnnotation(note: string) {
    if (!spec || !selectedPoint) return;

    const nextAnnotation: ChartAnnotation = {
      xValue: selectedPoint.xValue,
      note,
      createdAt: new Date().toISOString()
    };
    setAnnotations((current) => {
      const next = [nextAnnotation, ...current].slice(0, 12);
      window.localStorage.setItem(chartStorageKey(spec), JSON.stringify(next));
      return next;
    });
  }

  async function runComparisonPreset(baseQuery: string, compareQuery: string) {
    setLoading(true);
    setError(null);
    setClarification(null);
    setManualShareUrl("");

    try {
      const baseResponse = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: baseQuery })
      });
      const basePayload = (await baseResponse.json()) as ApiChartResponse | ApiErrorResponse;
      if (!baseResponse.ok || !("spec" in basePayload)) {
        throw new Error("Could not load the first comparison chart.");
      }

      const compareResponse = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: compareQuery, compareWith: basePayload.spec })
      });
      const comparePayload = (await compareResponse.json()) as ApiChartResponse | ApiErrorResponse;
      if (!compareResponse.ok || !("spec" in comparePayload)) {
        throw new Error("Could not layer the comparison chart.");
      }

      const generatedFrom = `${baseQuery} vs ${compareQuery}`;
      const nextSpec = { ...comparePayload.spec, generatedFrom };
      setSpec(nextSpec);
      setChartType(nextSpec.chartType);
      setCurrentQuery(generatedFrom);
      setSelectedPoint(null);
      syncChartUrl(generatedFrom);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="px-4 pb-10 pt-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1080px]">
          <header className="double-rule flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                ChartQuery
              </p>
              <h1 className="mt-2 font-display text-5xl leading-none text-ink md:text-7xl">
                See what the data means.
              </h1>
            </div>
            <p className="max-w-sm text-base leading-7 text-ink2">
              A visual learning tool for everyday curiosity: ask a question, compare things,
              and let the shape of the data make it click.
            </p>
          </header>
        </div>
      </section>

      <section className="px-4 pb-10 md:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1080px] gap-6 lg:grid-cols-[1fr_300px]">
          <div className="animate-fade-up border border-rule bg-paper p-4 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                  Today&apos;s Visual Story
                </p>
                <p className="mt-1 text-sm text-ink3">
                  {daily ? `${daily.category} - ${daily.date}` : "Loading today's story"}
                </p>
              </div>
              <button
                className="inline-flex h-9 items-center gap-2 border border-rule px-3 font-mono text-xs uppercase text-ink2 hover:border-ink hover:text-ink"
                type="button"
                onClick={() => daily && runQuery(daily.query)}
              >
                Explore it <ArrowUpRight size={14} />
              </button>
            </div>

            {daily ? (
              <div className="mb-5 max-w-2xl">
                <h2 className="font-display text-3xl leading-none text-ink md:text-4xl">
                  {daily.headline}
                </h2>
                <p className="mt-3 text-xl leading-8 text-ink2">{daily.context}</p>
                <div className="mt-4 flex items-start gap-3 border-l-2 border-accent pl-4">
                  <Lightbulb size={18} className="mt-1 shrink-0 text-accent" />
                  <p className="text-sm leading-6 text-ink2">{daily.whyItMatters}</p>
                </div>
              </div>
            ) : null}

            <QueryBar suggestions={PROMPTS} loading={loading} onSubmit={runQuery} />
          </div>

          <aside className="animate-fade-up border-y border-rule py-4 lg:border-y-0 lg:border-l lg:pl-5">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
              Try a Category
            </p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="shrink-0 border border-rule bg-paper px-3 py-2 text-sm text-ink2 hover:border-ink hover:bg-ink hover:text-paper"
                  onClick={() => {
                    const prompt = PROMPTS.find((item) => item.category === category)?.prompt;
                    if (prompt) void runQuery(prompt);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {history.length > 0 ? (
              <div className="mt-7">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
                  Recent
                </p>
                <div className="mt-3 space-y-2">
                  {history.map((item, index) => (
                    <button
                      key={`${item.title}-${index}`}
                      className="w-full border-l-2 border-rule bg-paper px-3 py-2 text-left text-sm text-ink2 hover:border-accent hover:text-ink"
                      onClick={() => {
                        setSpec(item);
                        setChartType(item.chartType);
                        setSelectedPoint(null);
                        if (item.generatedFrom) {
                          setCurrentQuery(item.generatedFrom);
                          syncChartUrl(item.generatedFrom);
                        }
                      }}
                      type="button"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1080px]">
          {clarification ? (
            <div className="mb-6 border border-ink bg-paper p-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                Clarify Your Query
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

          {error ? (
            <div className="mb-6 border border-accent bg-paper p-4 text-accent">{error}</div>
          ) : null}

          {spec ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <section ref={chartSectionRef} className="border border-rule bg-paper p-4 md:p-6">
                <ChartHeader
                  spec={spec}
                  chartType={chartType}
                  copyStatus={copyStatus}
                  exportStatus={exportStatus}
                  onCopyLink={handleCopyLink}
                  onDownloadImage={handleDownloadImage}
                  onOpenSource={() => setSourceOpen(true)}
                  onChartTypeChange={setChartType}
                />
                {manualShareUrl ? (
                  <div className="mt-4 border border-rule bg-rule2 p-3">
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
                      Chart Link
                    </p>
                    <input
                      className="mt-2 w-full border border-rule bg-paper px-3 py-2 font-mono text-xs text-ink outline-none"
                      readOnly
                      value={manualShareUrl}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </div>
                ) : null}
                <div className="mt-5">
                  <MultiSeriesLegend spec={spec} />
                </div>
                <div className="mt-5">
                  <ChartRenderer
                    spec={spec}
                    chartType={chartType}
                    selectedXValue={selectedPoint?.xValue}
                    onPointSelect={setSelectedPoint}
                  />
                </div>
                <div className="mt-6 border-t border-rule pt-5">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                    What to Notice
                  </p>
                  <p className="mt-2 text-xl leading-8 text-ink">{spec.insight}</p>
                  {spec.whyItMatters ? (
                    <div className="mt-5 border-l-2 border-accent pl-4">
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
                        Why This Matters
                      </p>
                      <p className="mt-2 text-base leading-7 text-ink2">{spec.whyItMatters}</p>
                    </div>
                  ) : null}
                  {spec.followUpPrompts?.length ? (
                    <div className="mt-5">
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
                        Next Questions
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {spec.followUpPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            className="border border-rule px-3 py-2 text-left text-sm text-ink2 hover:border-ink hover:bg-ink hover:text-paper"
                            onClick={() => runQuery(prompt)}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm leading-6 text-ink3">Source: {spec.source}</p>
                </div>
              </section>

              <aside className="space-y-5">
                <div className="border border-rule bg-paper p-4">
                  <div className="flex items-center gap-2">
                    <GitCompareArrows size={16} className="text-accent" />
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
                      Compare With
                    </p>
                  </div>
                  <div className="mt-3 flex border border-rule">
                    <input
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base outline-none placeholder:text-ink3"
                      value={compareValue}
                      onChange={(event) => setCompareValue(event.target.value)}
                      placeholder="Ethereum, Japan, wages..."
                    />
                    <button
                      className="bg-ink px-3 font-mono text-xs uppercase text-paper hover:bg-accent"
                      type="button"
                      onClick={handleCompare}
                      disabled={loading}
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink3">
                    Layer another idea onto the current chart to make the difference easier to see.
                  </p>
                </div>

                <div className="border border-rule bg-paper p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
                    Comparison Presets
                  </p>
                  <div className="mt-3 grid gap-2">
                    {COMPARISON_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        className="border border-rule px-3 py-2 text-left text-sm text-ink2 hover:border-ink hover:bg-ink hover:text-paper"
                        type="button"
                        disabled={loading}
                        onClick={() => runComparisonPreset(preset.baseQuery, preset.compareQuery)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <StatCards spec={spec} />
                <AnnotationPanel
                  spec={spec}
                  selection={selectedPoint}
                  annotations={annotations}
                  onAddNote={addAnnotation}
                />
              </aside>
            </div>
          ) : (
            <div className="border border-rule bg-paper p-10 text-center text-ink3">
              <Sparkles className="mx-auto text-accent" />
              <p className="mt-3">Loading the first chart...</p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-rule bg-paper px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1080px]">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
            Browse by Curiosity
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {categoryPrompts.map((group) => (
              <div key={group.category} className="border border-rule p-4">
                <h3 className="font-display text-2xl text-ink">{group.category}</h3>
                <div className="mt-3 space-y-2">
                  {group.prompts.map((item) => (
                    <button
                      key={item.prompt}
                      className="block w-full text-left text-sm leading-6 text-ink2 hover:text-accent"
                      type="button"
                      onClick={() => runQuery(item.prompt)}
                    >
                      {item.prompt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {sourceOpen && spec ? (
        <SourceDetailsDrawer spec={spec} onClose={() => setSourceOpen(false)} />
      ) : null}
    </main>
  );
}

function dedupeHistory(items: ChartSpec[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.title}-${item.subtitle}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function chartUrlForQuery(query: string, annotations: ChartAnnotation[] = []) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", query);
  if (annotations.length) {
    url.searchParams.set("notes", encodeAnnotations(annotations));
  } else {
    url.searchParams.delete("notes");
  }
  return url.toString();
}

function syncChartUrl(query: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", query);
  window.history.pushState(null, "", `${url.pathname}${url.search}`);
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some embedded browsers expose the API but do not permit writes.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

function readSharedAnnotations() {
  const encoded = new URL(window.location.href).searchParams.get("notes");
  if (!encoded) return [];

  try {
    return JSON.parse(decodeURIComponent(escape(window.atob(encoded)))) as ChartAnnotation[];
  } catch {
    return [];
  }
}

function encodeAnnotations(annotations: ChartAnnotation[]) {
  const shareable = annotations.slice(0, 6);
  return window.btoa(unescape(encodeURIComponent(JSON.stringify(shareable))));
}

function mergeAnnotations(...groups: ChartAnnotation[][]) {
  const seen = new Set<string>();
  return groups
    .flat()
    .filter((annotation) => {
      const key = `${annotation.xValue}-${annotation.note}-${annotation.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

async function downloadChartPng(container: HTMLElement, spec: ChartSpec) {
  const svg = container.querySelector(".recharts-wrapper svg");
  if (!(svg instanceof SVGSVGElement)) throw new Error("Chart SVG was not found");

  const serializer = new XMLSerializer();
  const svgText = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const imageUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 760;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context was unavailable");

    context.fillStyle = "#faf8f4";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#c0392b";
    context.font = "18px monospace";
    context.fillText("CHARTQUERY", 64, 62);
    context.fillStyle = "#1a1814";
    context.font = "44px Georgia, serif";
    wrapText(context, spec.title, 64, 126, 880, 50);
    context.fillStyle = "#4a4640";
    context.font = "22px Arial, sans-serif";
    wrapText(context, spec.subtitle, 64, 184, 940, 30);
    context.drawImage(image, 64, 245, 1040, 320);
    context.fillStyle = "#1a1814";
    context.font = "26px Arial, sans-serif";
    wrapText(context, spec.insight, 64, 630, 980, 34);
    context.fillStyle = "#8a8580";
    context.font = "16px Arial, sans-serif";
    wrapText(context, `Source: ${spec.source}`, 64, 718, 980, 22);

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${slugify(spec.title)}.png`;
    link.click();
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  words.forEach((word) => {
    const testLine = `${line}${word} `;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line.trim(), x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = testLine;
    }
  });
  context.fillText(line.trim(), x, y);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}
