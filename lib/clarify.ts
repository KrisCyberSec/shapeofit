import type { ClarificationResponse } from "@/types/chart";

const AMBIGUOUS_QUERIES: Array<{
  pattern: RegExp;
  response: ClarificationResponse | ((query: string) => ClarificationResponse | null);
}> = [
  {
    pattern: /\b(?:immigrants?|immigration|migration)\b/i,
    response: immigrationClarification
  },
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
  const match = AMBIGUOUS_QUERIES.find((item) => item.pattern.test(trimmed));
  if (!match) return null;
  return typeof match.response === "function" ? match.response(trimmed) : match.response;
}

function immigrationClarification(query: string): ClarificationResponse | null {
  const lower = query.toLowerCase();
  const isSpecific =
    /\b(?:lawful permanent residents?|lpr|green cards?|legal immigration|permanent residents?)\b/i.test(lower) ||
    /\b(?:border encounters?|border crossings?|border apprehensions?|cbp)\b/i.test(lower) ||
    /\b(?:foreign[-\s]?born|immigrant population)\b/i.test(lower) ||
    /\b(?:immigrant visas?|visa issuances?|visas? issued)\b/i.test(lower);

  if (isSpecific) return null;

  return {
    needsClarification: true,
    question: "Which immigration measure should this chart use?",
    options: [
      {
        label: "Green cards / LPR admissions",
        refinedQuery: "lawful permanent residents admitted since 2004"
      },
      {
        label: "Foreign-born population",
        refinedQuery: "foreign-born population in the United States since 2000"
      },
      {
        label: "Border encounters",
        refinedQuery: "US border encounters since 2020"
      },
      {
        label: "Immigrant visas",
        refinedQuery: "US immigrant visa issuances since 2000"
      }
    ]
  };
}
