"use client";

import { FormEvent, useState } from "react";
import { MessageSquarePlus, MousePointer2 } from "lucide-react";
import type { ChartAnnotation, ChartPointSelection, ChartSpec } from "@/types/chart";
import { explainPoint } from "@/lib/annotations";

export function AnnotationPanel({
  spec,
  selection,
  annotations,
  onAddNote
}: {
  spec: ChartSpec;
  selection: ChartPointSelection | null;
  annotations: ChartAnnotation[];
  onAddNote: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const explanation = selection ? explainPoint(spec, selection) : null;
  const matchingNotes = selection
    ? annotations.filter((annotation) => String(annotation.xValue) === String(selection.xValue))
    : [];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleanNote = note.trim();
    if (!cleanNote || !selection) return;
    onAddNote(cleanNote);
    setNote("");
  }

  return (
    <div className="border border-rule bg-paper p-4">
      <div className="flex items-center gap-2">
        <MousePointer2 size={16} className="text-accent" />
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
          What Happened Here?
        </p>
      </div>

      {selection && explanation ? (
        <div className="mt-4">
          <p className="font-display text-2xl leading-none text-ink">{String(selection.xValue)}</p>
          <h3 className="mt-3 text-base font-semibold text-ink">{explanation.title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink2">{explanation.body}</p>

          <form className="mt-4" onSubmit={handleSubmit}>
            <label className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
              Add Note
            </label>
            <textarea
              className="mt-2 min-h-24 w-full resize-none border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink3 focus:border-ink"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Your read on this point..."
            />
            <button
              className="mt-2 inline-flex h-9 items-center gap-2 bg-ink px-3 font-mono text-xs uppercase text-paper hover:bg-accent disabled:cursor-not-allowed disabled:bg-ink3"
              type="submit"
              disabled={!note.trim()}
            >
              <MessageSquarePlus size={14} />
              Save Note
            </button>
          </form>

          {matchingNotes.length ? (
            <div className="mt-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink3">
                Saved Notes
              </p>
              <div className="mt-3 space-y-2">
                {matchingNotes.map((annotation) => (
                  <div
                    key={`${annotation.xValue}-${annotation.createdAt}-${annotation.note}`}
                    className="border-l-2 border-accent pl-3"
                  >
                    <p className="text-sm leading-6 text-ink2">{annotation.note}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase text-ink3">
                      {formatDate(annotation.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink3">
          Click a point, bar, or area on the chart to get context and save a note.
        </p>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
