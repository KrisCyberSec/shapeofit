const QUERY_REWRITES: Array<{ pattern: RegExp; query: string }> = [
  {
    pattern: /^(are\s+)?houses?\s+affordable|housing affordability|can people afford homes/i,
    query: "mortgage rates since 2020"
  },
  {
    pattern: /wages?.*(keep up|kept up|keeping up).*(inflation|prices)|inflation.*wages?/i,
    query: "wages since 2020"
  },
  {
    pattern: /(groceries|grocery|food).*(expensive|prices|inflation)|why are groceries/i,
    query: "US food price inflation since 2020"
  },
  {
    pattern: /(fed|federal reserve).*(raise|raised|cut|cuts|rates)|interest rates/i,
    query: "fed funds rate since 2015"
  },
  {
    pattern: /(jobs?|labor market).*(weak|strong|bad|good)|job market/i,
    query: "unemployment rate since 2020"
  },
  {
    pattern: /japan.*aging|aging.*japan|life expectancy.*japan/i,
    query: "life expectancy in the US vs Japan since 1960"
  },
  {
    pattern: /cities.*growing|urbanization|more urban/i,
    query: "urban population share since 1960"
  },
  {
    pattern: /biggest countries|largest countries|most populous/i,
    query: "largest countries by population today"
  }
];

export function routeQueryIntent(query: string) {
  const trimmed = query.trim();
  return QUERY_REWRITES.find((rewrite) => rewrite.pattern.test(trimmed))?.query ?? trimmed;
}

export function splitComparisonQuery(query: string): [string, string] | null {
  const parts = splitAnyComparisonQuery(query);
  if (!parts) return null;

  const [left, right] = parts;
  if (!shouldSplitComparison(left, right)) return null;

  const sharedWindow = timeWindowFromQuery(query.trim());
  return [
    withSharedWindow(left, sharedWindow),
    withSharedWindow(right, sharedWindow)
  ];
}

export function splitAnyComparisonQuery(query: string): [string, string] | null {
  const trimmed = query.trim();
  const match = trimmed.match(/\s+(?:vs\.?|versus|compared to|against)\s+/i);
  if (!match?.index) return null;

  const left = trimmed.slice(0, match.index).trim();
  const right = trimmed.slice(match.index + match[0].length).trim();
  if (!left || !right) return null;

  return [left, right];
}

function shouldSplitComparison(left: string, right: string) {
  const combined = `${left} ${right}`.toLowerCase();

  if (combined.includes("bitcoin") || combined.includes("ethereum") || combined.includes("crypto")) {
    return false;
  }

  if (combined.includes("life expectancy") && /\b(us|u\.s\.|united states|japan)\b/i.test(combined)) {
    return false;
  }

  if (combined.includes("lakers") || combined.includes("celtics") || combined.includes("championship")) {
    return false;
  }

  return hasStandaloneMetric(left) && hasStandaloneMetric(right);
}

function hasStandaloneMetric(value: string) {
  return [
    /\binflation\b/i,
    /\bcpi\b/i,
    /\bwages?\b/i,
    /\bpay\b/i,
    /\bmortgage(?:\s+rates?)?\b/i,
    /\bhome prices?\b/i,
    /\bhouse prices?\b/i,
    /\bunemployment\b/i,
    /\bjobless\b/i,
    /\bfed funds\b/i,
    /\bfederal funds\b/i,
    /\binterest rates?\b/i,
    /\bgas(?:oline)? prices?\b/i,
    /\bfood (?:price )?inflation\b/i,
    /\brents?\b/i
  ].some((pattern) => pattern.test(value));
}

function timeWindowFromQuery(query: string) {
  return query.match(/\b(?:since|from)\s+(?:19|20)\d{2}(?:\s*(?:to|-)\s*(?:19|20)\d{2})?\b/i)?.[0] ?? null;
}

function withSharedWindow(query: string, sharedWindow: string | null) {
  if (!sharedWindow || timeWindowFromQuery(query)) return query;
  return `${query} ${sharedWindow}`;
}
