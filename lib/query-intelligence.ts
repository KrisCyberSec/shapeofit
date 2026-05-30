import {
  DATA_CATALOG,
  plannedCatalogEntries,
  supportedCatalogEntries,
  type CatalogStatus,
  type DataCatalogEntry
} from "./data-catalog";

export type QuerySourceMatch = {
  entry: DataCatalogEntry;
  score: number;
  confidence: number;
  reasons: string[];
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "by",
  "can",
  "for",
  "from",
  "get",
  "has",
  "have",
  "how",
  "in",
  "into",
  "is",
  "it",
  "last",
  "many",
  "me",
  "of",
  "on",
  "or",
  "over",
  "past",
  "show",
  "since",
  "the",
  "to",
  "today",
  "vs",
  "what",
  "when",
  "where",
  "with",
  "years"
]);

const SYNONYM_GROUPS = [
  ["us", "u s", "u.s", "usa", "united states", "america", "american"],
  ["immigration", "immigrant", "immigrants", "migrant", "migration"],
  ["lawful permanent resident", "lawful permanent residents", "permanent resident", "lpr"],
  ["green card", "green cards"],
  ["wage", "wages", "pay", "earnings", "hourly earnings"],
  ["inflation", "cpi", "consumer price index", "prices"],
  ["rent", "rents", "rental"],
  ["home", "house", "houses", "housing", "home price", "house price"],
  ["life expectancy", "lifespan", "longevity"],
  ["crypto", "bitcoin", "btc", "ethereum", "eth", "solana", "dogecoin"],
  ["debt", "national debt", "public debt", "treasury debt"]
];

export function rankCatalogMatches(
  query: string,
  options: { status?: CatalogStatus | "all"; limit?: number } = {}
): QuerySourceMatch[] {
  const status = options.status ?? "all";
  const entries =
    status === "supported"
      ? supportedCatalogEntries()
      : status === "planned"
        ? plannedCatalogEntries()
        : DATA_CATALOG;
  const matches = entries
    .map((entry) => scoreCatalogEntry(query, entry))
    .filter((match) => match.score > 0)
    .sort((left, right) => {
      if (right.confidence !== left.confidence) return right.confidence - left.confidence;
      return right.score - left.score;
    });

  return matches.slice(0, options.limit ?? 8);
}

export function bestSupportedCatalogMatch(query: string): QuerySourceMatch | null {
  return confidentMatch(rankCatalogMatches(query, { status: "supported", limit: 1 })[0]);
}

export function bestPlannedCatalogMatch(query: string): QuerySourceMatch | null {
  return confidentMatch(rankCatalogMatches(query, { status: "planned", limit: 1 })[0]);
}

function confidentMatch(match?: QuerySourceMatch) {
  if (!match) return null;
  return match.confidence >= 0.34 ? match : null;
}

function scoreCatalogEntry(query: string, entry: DataCatalogEntry): QuerySourceMatch {
  const normalizedQuery = normalize(query);
  const queryTerms = tokenize(normalizedQuery);
  const querySignals = expandSignals(normalizedQuery, queryTerms);
  const haystack = normalize(catalogText(entry));
  const haystackTerms = new Set(tokenize(haystack));
  const reasons: string[] = [];
  let score = 0;

  if (entry.examples.some((example) => normalize(example) === normalizedQuery)) {
    score += 100;
    reasons.push("exact example match");
  }

  if (entry.patterns.some((pattern) => pattern.test(query))) {
    score += 80;
    reasons.push("intent pattern match");
  }

  const aliasMatches = phraseMatches(normalizedQuery, entry.aliases);
  if (aliasMatches.length) {
    score += Math.min(aliasMatches.length, 3) * 20;
    reasons.push(`alias match: ${aliasMatches.slice(0, 2).join(", ")}`);
  }

  const exampleCoverage = Math.max(
    0,
    ...entry.examples.map((example) => phraseCoverage(queryTerms, tokenize(normalize(example))))
  );
  if (exampleCoverage >= 0.45) {
    score += exampleCoverage * 26;
    reasons.push("similar example wording");
  }

  const matchedSignals = Array.from(querySignals).filter(
    (signal) => haystackTerms.has(signal) || haystack.includes(signal)
  );
  if (matchedSignals.length) {
    score += matchedSignals.length * 5;
    reasons.push(`matched terms: ${matchedSignals.slice(0, 4).join(", ")}`);
  }

  const coverage = queryTerms.length
    ? queryTerms.filter((term) => haystackTerms.has(term) || haystack.includes(term)).length /
      queryTerms.length
    : 0;
  if (coverage >= 0.35) score += coverage * 18;

  if (entry.status === "supported") score += 2;

  return {
    entry,
    score,
    confidence: confidenceFromScore(score),
    reasons: Array.from(new Set(reasons))
  };
}

function catalogText(entry: DataCatalogEntry) {
  return [
    entry.id,
    entry.label,
    entry.providerLabel,
    entry.status,
    entry.category,
    entry.unit,
    entry.transform,
    ...entry.examples,
    ...entry.aliases,
    ...(entry.seriesIds ?? [])
  ]
    .filter(Boolean)
    .join(" ");
}

function phraseMatches(normalizedQuery: string, phrases: string[]) {
  return phrases.filter((phrase) => {
    const normalizedPhrase = normalize(phrase);
    return normalizedPhrase.length > 2 && normalizedQuery.includes(normalizedPhrase);
  });
}

function phraseCoverage(queryTerms: string[], exampleTerms: string[]) {
  if (!queryTerms.length || !exampleTerms.length) return 0;
  const exampleSet = new Set(exampleTerms);
  return queryTerms.filter((term) => exampleSet.has(term)).length / queryTerms.length;
}

function expandSignals(normalizedQuery: string, terms: string[]) {
  const signals = new Set(terms);

  SYNONYM_GROUPS.forEach((group) => {
    if (group.some((phrase) => normalizedQuery.includes(normalize(phrase)))) {
      group.flatMap((phrase) => tokenize(normalize(phrase))).forEach((term) => signals.add(term));
      group.map(normalize).forEach((phrase) => signals.add(phrase));
    }
  });

  return signals;
}

function tokenize(value: string) {
  return value
    .split(" ")
    .map((term) => stem(term))
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term) && !/^\d+$/.test(term));
}

function stem(term: string) {
  if (term.endsWith("ies") && term.length > 4) return `${term.slice(0, -3)}y`;
  if (term.endsWith("ing") && term.length > 5) return term.slice(0, -3);
  if (term.endsWith("ed") && term.length > 4) return term.slice(0, -2);
  if (term.endsWith("s") && term.length > 4) return term.slice(0, -1);
  return term;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\bu\.s\.\b/g, "us")
    .replace(/\s+/g, " ")
    .trim();
}

function confidenceFromScore(score: number) {
  if (score >= 100) return 0.96;
  if (score >= 80) return 0.9;
  if (score >= 60) return 0.78;
  if (score >= 40) return 0.62;
  if (score >= 25) return 0.44;
  return Math.min(0.33, score / 75);
}
