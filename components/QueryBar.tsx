"use client";

import { ArrowRight, Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

export type PromptSuggestion = {
  category: string;
  prompt: string;
};

export function QueryBar({
  suggestions,
  loading,
  placeholder = "Ask anything you want to see visually...",
  submitLabel = "Visualize",
  onSubmit
}: {
  suggestions: PromptSuggestion[];
  loading?: boolean;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (query: string) => void;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    const pool =
      query.length < 3
        ? featuredSuggestions(suggestions)
        : suggestions.filter((item) => item.prompt.toLowerCase().includes(query));

    return pool.slice(0, 6);
  }, [suggestions, value]);
  const showSuggestions = focused && matches.length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;
    onSubmit(query);
    setValue("");
  }

  return (
    <form className="relative" onSubmit={handleSubmit}>
      <div className="flex min-h-16 items-stretch border border-ink bg-paper">
        <div className="flex w-12 items-center justify-center border-r border-rule text-ink3">
          <Search size={18} />
        </div>
        <input
          className="min-w-0 flex-1 bg-transparent px-4 text-base text-ink outline-none placeholder:text-ink3 md:text-lg"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          onMouseDown={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
        />
        <button
          className="flex min-w-24 items-center justify-center gap-2 bg-ink px-3 font-mono text-[11px] uppercase text-paper transition hover:bg-accent disabled:cursor-wait disabled:bg-ink3 md:min-w-32 md:px-4 md:text-xs"
          type="submit"
          disabled={loading}
        >
          {loading ? "Working" : submitLabel}
          <ArrowRight size={15} />
        </button>
      </div>

      {showSuggestions ? (
        <div className="absolute z-20 mt-1 w-full border border-ink bg-paper shadow-[6px_6px_0_var(--rule)]">
          <div className="flex items-center justify-between border-b border-rule2 px-4 py-2">
            <span className="font-mono text-[10px] uppercase text-accent">
              {value.trim().length < 3 ? "Source-backed starters" : "Matching sources"}
            </span>
            <span className="font-mono text-[10px] uppercase text-ink3">
              {matches.length} shown
            </span>
          </div>
          {matches.map((item) => (
            <button
              key={item.prompt}
              type="button"
              className="group flex w-full items-center justify-between gap-4 border-b border-rule2 px-4 py-3 text-left last:border-b-0 hover:bg-ink hover:text-paper"
              onClick={() => {
                onSubmit(item.prompt);
                setValue("");
                setFocused(false);
              }}
            >
              <span className="text-sm text-ink group-hover:text-paper">{item.prompt}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase text-accent group-hover:text-paper">
                {item.category}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function featuredSuggestions(suggestions: PromptSuggestion[]) {
  const seen = new Set<string>();
  return suggestions.filter((item) => {
    if (seen.has(item.category)) return false;
    seen.add(item.category);
    return true;
  });
}
