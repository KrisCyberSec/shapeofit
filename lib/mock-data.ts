import type { ChartSpec, DailyStory } from "@/types/chart";
import { normalizeSpec } from "./chart-utils";

const colors = ["#c0392b", "#2980b9", "#16a085"];

export function mockChartForQuery(query: string): ChartSpec {
  const lower = query.toLowerCase();

  if (lower.includes("bitcoin") && lower.includes("ethereum")) return bitcoinEthereum();
  if (lower.includes("bitcoin") || lower.includes("crypto")) return bitcoin();
  if (lower.includes("inflation") || lower.includes("cpi")) return inflation();
  if (lower.includes("marriage")) return marriage();
  if (lower.includes("population")) return population();
  if (lower.includes("sports") || lower.includes("lakers") || lower.includes("celtics")) {
    return sports();
  }
  if (lower.includes("rent") || lower.includes("wage")) return rentVsWages();

  return curiosity(query);
}

export function dailyStoryForToday(date = new Date()): DailyStory {
  const stories = [
    {
      category: "Relationships",
      query: "marriage rates in the United States since 1970",
      context:
        "Marriage has not disappeared, but the timing and frequency changed dramatically across modern adulthood.",
      spec: marriage()
    },
    {
      category: "Money",
      query: "rent vs wages since 2000",
      context:
        "Housing pressure is easier to understand visually: rent rose faster than typical wages in many periods.",
      spec: rentVsWages()
    },
    {
      category: "Population",
      query: "world population growth 1960 to 2024",
      context:
        "The world added billions of people in one lifetime, but the growth rate has been slowing.",
      spec: population()
    },
    {
      category: "Crypto",
      query: "Bitcoin vs Ethereum price 2020 to 2024",
      context:
        "Crypto cycles are volatile, but plotting two major assets together makes the rhythm easier to see.",
      spec: bitcoinEthereum()
    }
  ];

  const index = Math.floor(date.getTime() / 86_400_000) % stories.length;
  const story = stories[index];

  return {
    date: date.toISOString().slice(0, 10),
    ...story
  };
}

function inflation(): ChartSpec {
  return normalizeSpec({
    title: "US Inflation Cooled After the 2022 Spike",
    subtitle: "Annual CPI inflation, shown as yearly percent change.",
    chartType: "line",
    data: [
      { year: "2015", inflation: 0.1 },
      { year: "2016", inflation: 1.3 },
      { year: "2017", inflation: 2.1 },
      { year: "2018", inflation: 2.4 },
      { year: "2019", inflation: 1.8 },
      { year: "2020", inflation: 1.2 },
      { year: "2021", inflation: 4.7 },
      { year: "2022", inflation: 8.0 },
      { year: "2023", inflation: 4.1 },
      { year: "2024", inflation: 3.0 }
    ],
    xKey: "year",
    yKeys: ["inflation"],
    colors: [colors[0]],
    unit: "%",
    source: "Historical estimate based on public CPI summaries.",
    insight: "The big story is not steady inflation, but the sudden 2021-2022 jump and partial cooling afterward.",
    dataSource: "training",
    seriesLabels: ["Inflation"]
  });
}

function bitcoin(): ChartSpec {
  return normalizeSpec({
    title: "Bitcoin's Price Cycle Is Visibly Uneven",
    subtitle: "Approximate year-end Bitcoin price in US dollars.",
    chartType: "area",
    data: [
      { year: "2017", bitcoin: 14156 },
      { year: "2018", bitcoin: 3742 },
      { year: "2019", bitcoin: 7193 },
      { year: "2020", bitcoin: 28949 },
      { year: "2021", bitcoin: 46306 },
      { year: "2022", bitcoin: 16547 },
      { year: "2023", bitcoin: 42258 },
      { year: "2024", bitcoin: 93500 }
    ],
    xKey: "year",
    yKeys: ["bitcoin"],
    colors: [colors[0]],
    unit: "$",
    source: "Approximate historical prices. Use live mode for current prices.",
    insight: "The chart makes the boom-bust-boom pattern obvious at a glance.",
    dataSource: "approximate",
    seriesLabels: ["Bitcoin"]
  });
}

function bitcoinEthereum(): ChartSpec {
  return normalizeSpec({
    title: "Bitcoin and Ethereum Move in the Same Broad Cycles",
    subtitle: "Approximate year-end prices indexed to 2020 = 100 for easier comparison.",
    chartType: "line",
    data: [
      { year: "2020", bitcoin: 100, ethereum: 100 },
      { year: "2021", bitcoin: 160, ethereum: 550 },
      { year: "2022", bitcoin: 57, ethereum: 155 },
      { year: "2023", bitcoin: 146, ethereum: 285 },
      { year: "2024", bitcoin: 323, ethereum: 455 }
    ],
    xKey: "year",
    yKeys: ["bitcoin", "ethereum"],
    colors: [colors[0], colors[1]],
    unit: "index",
    source: "Approximate indexed historical prices, not live market data.",
    insight: "Ethereum swung harder in this window, while both assets shared the same risk-cycle shape.",
    dataSource: "approximate",
    seriesLabels: ["Bitcoin", "Ethereum"]
  });
}

function marriage(): ChartSpec {
  return normalizeSpec({
    title: "US Marriage Rates Have Fallen Over Generations",
    subtitle: "Approximate marriages per 1,000 people in the United States.",
    chartType: "line",
    data: [
      { year: "1970", marriage_rate: 10.6 },
      { year: "1980", marriage_rate: 10.6 },
      { year: "1990", marriage_rate: 9.8 },
      { year: "2000", marriage_rate: 8.2 },
      { year: "2010", marriage_rate: 6.8 },
      { year: "2020", marriage_rate: 5.1 },
      { year: "2022", marriage_rate: 6.2 }
    ],
    xKey: "year",
    yKeys: ["marriage_rate"],
    colors: [colors[0]],
    unit: "per 1k",
    source: "Historical estimate based on US vital statistics summaries.",
    insight: "The long-term decline is much larger than the short post-2020 rebound.",
    dataSource: "training",
    seriesLabels: ["Marriage rate"]
  });
}

function population(): ChartSpec {
  return normalizeSpec({
    title: "World Population More Than Doubled Since 1960",
    subtitle: "Global population in billions of people.",
    chartType: "area",
    data: [
      { year: "1960", population: 3.0 },
      { year: "1970", population: 3.7 },
      { year: "1980", population: 4.4 },
      { year: "1990", population: 5.3 },
      { year: "2000", population: 6.1 },
      { year: "2010", population: 6.9 },
      { year: "2020", population: 7.8 },
      { year: "2024", population: 8.1 }
    ],
    xKey: "year",
    yKeys: ["population"],
    colors: [colors[2]],
    unit: "bn",
    source: "Historical estimate based on World Bank and UN-style summaries.",
    insight: "The scale of recent human population growth becomes concrete when shown decade by decade.",
    dataSource: "training",
    seriesLabels: ["Population"]
  });
}

function sports(): ChartSpec {
  return normalizeSpec({
    title: "Lakers and Celtics Are the NBA's Banner Race",
    subtitle: "NBA championships by franchise through recent seasons.",
    chartType: "bar",
    data: [
      { team: "Celtics", titles: 18 },
      { team: "Lakers", titles: 17 },
      { team: "Warriors", titles: 7 },
      { team: "Bulls", titles: 6 },
      { team: "Spurs", titles: 5 }
    ],
    xKey: "team",
    yKeys: ["titles"],
    colors: [colors[0]],
    unit: "titles",
    source: "Historical sports record summary.",
    insight: "The rivalry is not just cultural: it sits at the very top of the championship table.",
    dataSource: "training",
    seriesLabels: ["Championships"]
  });
}

function rentVsWages(): ChartSpec {
  return normalizeSpec({
    title: "Rent Pulled Away From Wages",
    subtitle: "Indexed change since 2000, where 2000 equals 100.",
    chartType: "line",
    data: [
      { year: "2000", rent: 100, wages: 100 },
      { year: "2005", rent: 119, wages: 113 },
      { year: "2010", rent: 138, wages: 125 },
      { year: "2015", rent: 162, wages: 141 },
      { year: "2020", rent: 190, wages: 165 },
      { year: "2024", rent: 232, wages: 190 }
    ],
    xKey: "year",
    yKeys: ["rent", "wages"],
    colors: [colors[0], colors[1]],
    unit: "index",
    source: "Approximate index built from public rent and wage trend summaries.",
    insight: "The widening gap is the point: rent rose faster than wages across the whole period.",
    dataSource: "approximate",
    seriesLabels: ["Rent", "Wages"]
  });
}

function curiosity(query: string): ChartSpec {
  return normalizeSpec({
    title: "A Visual Starting Point",
    subtitle: `A simple visual estimate for: ${query}`,
    chartType: "line",
    data: [
      { year: "2016", value: 42 },
      { year: "2017", value: 45 },
      { year: "2018", value: 49 },
      { year: "2019", value: 53 },
      { year: "2020", value: 51 },
      { year: "2021", value: 58 },
      { year: "2022", value: 63 },
      { year: "2023", value: 67 },
      { year: "2024", value: 72 }
    ],
    xKey: "year",
    yKeys: ["value"],
    colors: [colors[0]],
    unit: "index",
    source: "Mock local estimate. Add ANTHROPIC_API_KEY for AI-generated data.",
    insight: "This local fallback shows the interaction model even before live AI is configured.",
    dataSource: "approximate",
    seriesLabels: ["Value"]
  });
}
