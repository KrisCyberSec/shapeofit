import { planChartQuery } from "../lib/chart-planner";
import { getClarification } from "../lib/clarify";
import {
  bestPlannedCatalogMatch,
  bestSupportedCatalogMatch,
  rankCatalogMatches
} from "../lib/query-intelligence";

type SearchCheck = {
  name: string;
  query: string;
  assert: () => void;
};

const checks: SearchCheck[] = [
  {
    name: "broad immigration clarifies instead of guessing",
    query: "how many immigrants have come to the United States in the past 20 years",
    assert() {
      const clarification = getClarification(this.query);
      assert(Boolean(clarification), "expected clarification");
      assertIncludes(
        clarification?.options.map((option) => option.label) ?? [],
        "Green cards / LPR admissions",
        "expected LPR option"
      );
      assertIncludes(
        clarification?.options.map((option) => option.label) ?? [],
        "Foreign-born population",
        "expected foreign-born option"
      );
      assertIncludes(
        clarification?.options.map((option) => option.label) ?? [],
        "Border encounters",
        "expected border encounters option"
      );
    }
  },
  {
    name: "specific green-card phrasing maps to DHS",
    query: "green cards issued in the US since 2010",
    assert() {
      expectSupported(this.query, "dhs.lpr.admissions.us");
      expectPlanSource(this.query, "dhs.lpr.admissions.us");
      assert(!getClarification(this.query), "specific green-card query should not clarify");
    }
  },
  {
    name: "specific LPR phrasing maps to DHS",
    query: "lawful permanent residents admitted since 2004",
    assert() {
      expectSupported(this.query, "dhs.lpr.admissions.us");
      expectPlanSource(this.query, "dhs.lpr.admissions.us");
    }
  },
  {
    name: "foreign-born maps to planned Census source, not DHS",
    query: "foreign-born population in the United States since 2000",
    assert() {
      expectPlanned(this.query, "census.foreignborn.us");
      expectUnsupportedPlan(this.query);
      assert(!bestSupportedCatalogMatch(this.query), "foreign-born should not map to live DHS");
    }
  },
  {
    name: "border encounters maps to planned CBP source",
    query: "US border encounters since 2020",
    assert() {
      expectPlanned(this.query, "cbp.encounters.us");
      expectUnsupportedPlan(this.query);
    }
  },
  {
    name: "immigrant visas maps to planned State source",
    query: "US immigrant visa issuances since 2000",
    assert() {
      expectPlanned(this.query, "state.immigrantvisas.us");
      expectUnsupportedPlan(this.query);
    }
  },
  {
    name: "coffee shops stay missing",
    query: "coffee shop growth in the United States since 1990",
    assert() {
      assert(!bestSupportedCatalogMatch(this.query), "coffee shop query should not map supported");
      assert(!bestPlannedCatalogMatch(this.query), "coffee shop query should not map planned");
      expectUnsupportedPlan(this.query, 0);
    }
  },
  {
    name: "Midnight Network maps to live CoinGecko crypto",
    query: "midnight network chart",
    assert() {
      expectSupported(this.query, "coingecko.crypto.usd");
      expectPlanSource(this.query, "coingecko.crypto.usd");
    }
  },
  {
    name: "NIGHT token maps to live CoinGecko crypto",
    query: "NIGHT token price over the last 30 days",
    assert() {
      expectSupported(this.query, "coingecko.crypto.usd");
      expectPlanSource(this.query, "coingecko.crypto.usd");
    }
  },
  {
    name: "NIGHT shorthand maps to live CoinGecko crypto",
    query: "NIGHT price chart",
    assert() {
      expectSupported(this.query, "coingecko.crypto.usd");
      expectPlanSource(this.query, "coingecko.crypto.usd");
    }
  },
  {
    name: "US life expectancy maps to US-only World Bank source",
    query: "life expectancy in united states since 1950",
    assert() {
      expectSupported(this.query, "worldbank.lifeexpectancy.us");
      expectPlanSource(this.query, "worldbank.lifeexpectancy.us");
    }
  },
  {
    name: "US vs Japan life expectancy maps to comparison source",
    query: "life expectancy in the US vs Japan since 1960",
    assert() {
      expectSupported(this.query, "worldbank.lifeexpectancy.us-japan");
      expectPlanSource(this.query, "worldbank.lifeexpectancy.us-japan");
    }
  },
  {
    name: "wages vs inflation remains a comparison",
    query: "wages since 2020 vs US inflation rate since 2020",
    assert() {
      const plan = planChartQuery(this.query);
      assert(plan.kind === "comparison", `expected comparison plan, got ${plan.kind}`);
      if (plan.kind !== "comparison") return;
      assertIncludes(plan.comparisonQueries, "wages since 2020", "expected wages side");
      assertIncludes(plan.comparisonQueries, "US inflation rate since 2020", "expected inflation side");
    }
  }
];

for (const check of checks) {
  try {
    check.assert();
    console.log(`PASS ${check.name}`);
  } catch (error) {
    console.error(`FAIL ${check.name}`);
    console.error(`Query: ${check.query}`);
    console.error(error instanceof Error ? error.message : error);
    console.error("Top matches:", rankCatalogMatches(check.query, { status: "all", limit: 5 }));
    process.exitCode = 1;
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`Search QA passed for ${checks.length} checks.`);

function expectSupported(query: string, sourceId: string) {
  const match = bestSupportedCatalogMatch(query);
  assert(match?.entry.id === sourceId, `expected supported ${sourceId}, got ${match?.entry.id}`);
}

function expectPlanned(query: string, sourceId: string) {
  const match = bestPlannedCatalogMatch(query);
  assert(match?.entry.id === sourceId, `expected planned ${sourceId}, got ${match?.entry.id}`);
}

function expectPlanSource(query: string, sourceId: string) {
  const plan = planChartQuery(query);
  assert(plan.kind === "source", `expected source plan, got ${plan.kind}`);
  if (plan.kind !== "source") return;
  assert(plan.entry.id === sourceId, `expected plan source ${sourceId}, got ${plan.entry.id}`);
}

function expectUnsupportedPlan(query: string, confidence?: number) {
  const plan = planChartQuery(query);
  assert(plan.kind === "unsupported", `expected unsupported plan, got ${plan.kind}`);
  if (typeof confidence === "number") {
    assert(plan.confidence === confidence, `expected confidence ${confidence}, got ${plan.confidence}`);
  }
}

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function assertIncludes<T>(values: T[], expected: T, message: string) {
  assert(values.includes(expected), `${message}. Got ${JSON.stringify(values)}`);
}
