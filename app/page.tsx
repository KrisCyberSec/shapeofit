"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, GitCompareArrows, Lightbulb, Sparkles } from "lucide-react";
import type { ChartSpec, ChartType, ClarificationResponse, DailyStory } from "@/types/chart";
import { ChartHeader } from "@/components/ChartHeader";
import { ChartRenderer } from "@/components/ChartRenderer";
import { MultiSeriesLegend } from "@/components/MultiSeriesLegend";
import { QueryBar, type PromptSuggestion } from "@/components/QueryBar";
import { SourceDetailsDrawer } from "@/components/SourceDetailsDrawer";
import { StatCards } from "@/components/StatCards";

const PROMPTS: PromptSuggestion[] = [
  { category: "Money", prompt: "rent vs wages since 2000" },
  { category: "Money", prompt: "US national debt live last 30 days" },
  { category: "Money", prompt: "US inflation rate 2015 to 2024" },
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
  { category: "Food", prompt: "US food price inflation 2010 to 2024" },
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
  const [manualShareUrl, setManualShareUrl] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);

  useEffect(() => {
    const initialQuery = new URL(window.location.href).searchParams.get("q")?.trim() ?? "";
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
    const shareUrl = chartUrlForQuery(query);

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
              <section className="border border-rule bg-paper p-4 md:p-6">
                <ChartHeader
                  spec={spec}
                  chartType={chartType}
                  copyStatus={copyStatus}
                  onCopyLink={handleCopyLink}
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
                  <ChartRenderer spec={spec} chartType={chartType} />
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

                <StatCards spec={spec} />
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

function chartUrlForQuery(query: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", query);
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
