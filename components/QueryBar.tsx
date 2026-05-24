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

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (query.length < 3) return [];
    return suggestions
      .filter((item) => item.prompt.toLowerCase().includes(query))
      .slice(0, 6);
  }, [suggestions, value]);

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
          placeholder={placeholder}
        />
        <button
          className="flex min-w-32 items-center justify-center gap-2 bg-ink px-4 font-mono text-xs uppercase text-paper transition hover:bg-accent disabled:cursor-wait disabled:bg-ink3"
          type="submit"
          disabled={loading}
        >
          {loading ? "Working" : submitLabel}
          <ArrowRight size={15} />
        </button>
      </div>

      {matches.length > 0 ? (
        <div className="absolute z-20 mt-1 w-full border border-rule bg-paper">
          {matches.map((item) => (
            <button
              key={item.prompt}
              type="button"
              className="flex w-full items-center justify-between gap-4 border-b border-rule2 px-4 py-3 text-left last:border-b-0 hover:bg-rule2"
              onClick={() => {
                onSubmit(item.prompt);
                setValue("");
              }}
            >
              <span className="text-sm text-ink">{item.prompt}</span>
              <span className="font-mono text-[10px] uppercase text-accent">{item.category}</span>
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
