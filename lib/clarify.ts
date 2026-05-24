import type { ClarificationResponse } from "@/types/chart";

const AMBIGUOUS_QUERIES: Array<{
  pattern: RegExp;
  response: ClarificationResponse;
}> = [
  {
    pattern: /^show me inflation$|^inflation$|inflation trends?$/i,
    response: {
      needsClarification: true,
      question: "Which inflation story do you want to see?",
      options: [
        { label: "US consumer prices", refinedQuery: "US CPI inflation rate 2000 to 2024" },
        { label: "Food prices", refinedQuery: "US food price inflation 2010 to 2024" },
        { label: "Global inflation", refinedQuery: "global inflation by region 2000 to 2024" }
      ]
    }
  },
  {
    pattern: /^population$|^show me population$/i,
    response: {
      needsClarification: true,
      question: "Which population view should we chart?",
      options: [
        { label: "World population", refinedQuery: "world population growth 1960 to 2024" },
        { label: "US population", refinedQuery: "United States population growth 1960 to 2024" },
        { label: "Biggest countries", refinedQuery: "largest countries by population today" }
      ]
    }
  },
  {
    pattern: /^bitcoin$|^crypto$|^show me crypto$/i,
    response: {
      needsClarification: true,
      question: "Which crypto comparison should we start with?",
      options: [
        { label: "Bitcoin price", refinedQuery: "Bitcoin price over the last year" },
        { label: "Bitcoin vs Ethereum", refinedQuery: "Bitcoin vs Ethereum price 2020 to 2024" },
        { label: "Crypto market share", refinedQuery: "crypto market share by coin" }
      ]
    }
  }
];

export function getClarification(query: string): ClarificationResponse | null {
  const trimmed = query.trim();
  return AMBIGUOUS_QUERIES.find((item) => item.pattern.test(trimmed))?.response ?? null;
}
