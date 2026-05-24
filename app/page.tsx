"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, GitCompareArrows, Sparkles } from "lucide-react";
import type { ChartSpec, ChartType, ClarificationResponse, DailyStory } from "@/types/chart";
import { ChartHeader } from "@/components/ChartHeader";
import { ChartRenderer } from "@/components/ChartRenderer";
import { MultiSeriesLegend } from "@/components/MultiSeriesLegend";
import { QueryBar, type PromptSuggestion } from "@/components/QueryBar";
import { StatCards } from "@/components/StatCards";

const PROMPTS: PromptSuggestion[] = [
  { category: "Money", prompt: "rent vs wages since 2000" },
  { category: "Money", prompt: "US inflation rate 2015 to 2024" },
  { category: "Relationships", prompt: "marriage rates in the United States since 1970" },
  { category: "Population", prompt: "world population growth 1960 to 2024" },
  { category: "Sports", prompt: "Lakers vs Celtics championships" },
  { category: "Crypto", prompt: "Bitcoin vs Ethereum price 2020 to 2024" },
  { category: "Health", prompt: "life expectancy in the US vs Japan since 1960" },
  { category: "Climate", prompt: "global temperature anomaly since 1980" },
  { category: "Work", prompt: "remote work adoption before and after 2020" },
  { category: "Culture", prompt: "streaming subscriptions vs cable TV since 2010" },
  { category: "Technology", prompt: "smartphone adoption in the United States" },
  { category: "Food", prompt: "coffee prices over the last decade" }
];

const CATEGORIES = ["Money", "Relationships", "Population", "Sports", "Crypto", "Health", "Climate", "Work", "Culture"];

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
  const [history, setHistory] = useState<ChartSpec[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("chartquery-history");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as ChartSpec[];
    } catch {
      return [];
    }
  });
  const [compareValue, setCompareValue] = useState("");

  useEffect(() => {
    fetch("/api/daily")
      .then((response) => response.json() as Promise<DailyStory>)
      .then((story) => {
        setDaily(story);
        setSpec(story.spec);
        setChartType(story.spec.chartType);
      })
      .catch(() => setError("The daily story could not be loaded."));
  }, []);

  const categoryPrompts = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        prompts: PROMPTS.filter((item) => item.category === category).slice(0, 3)
      })),
    []
  );

  async function runQuery(query: string, compareWith?: ChartSpec) {
    setLoading(true);
    setError(null);
    setClarification(null);

    try {
      const response = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, compareWith })
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

      setSpec(payload.spec);
      setChartType(payload.spec.chartType);
      setHistory((current) => {
        const next = [payload.spec, ...current].slice(0, 6);
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
              <p className="mb-5 max-w-2xl text-xl leading-8 text-ink2">{daily.context}</p>
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
                  {history.map((item) => (
                    <button
                      key={`${item.title}-${item.subtitle}`}
                      className="w-full border-l-2 border-rule bg-paper px-3 py-2 text-left text-sm text-ink2 hover:border-accent hover:text-ink"
                      onClick={() => {
                        setSpec(item);
                        setChartType(item.chartType);
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
                <ChartHeader spec={spec} chartType={chartType} onChartTypeChange={setChartType} />
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
            {categoryPrompts.slice(0, 6).map((group) => (
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
    </main>
  );
}
