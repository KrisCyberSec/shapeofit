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
  if (lower.includes("temperature") || lower.includes("climate")) return climate();
  if (lower.includes("remote work")) return remoteWork();
  if (lower.includes("streaming") || lower.includes("cable")) return streamingVsCable();
  if (lower.includes("life expectancy")) return lifeExpectancy();
  if (lower.includes("smartphone")) return smartphoneAdoption();
  if (lower.includes("coffee")) return coffeePrices();
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
      headline: "The marriage story is really a timing story",
      context:
        "Marriage has not disappeared, but the timing and frequency changed dramatically across modern adulthood. The chart turns a familiar cultural argument into a measurable generational shift.",
      whyItMatters:
        "It shows how a social norm can change slowly enough to feel invisible year to year, then obvious across decades.",
      followUpPrompts: [
        "birth rates in the United States since 1970",
        "average age at first marriage since 1970",
        "divorce rates in the United States since 1980"
      ],
      spec: marriage()
    },
    {
      category: "Money",
      query: "rent vs wages since 2000",
      headline: "Affordability is a gap, not a single number",
      context:
        "Housing pressure is easier to understand visually when rent and wages sit on the same baseline. The story is not just that rent rose; it is that the distance between the two lines widened.",
      whyItMatters:
        "People feel affordability through the spread between income and costs, so the comparison matters more than either line alone.",
      followUpPrompts: [
        "US national debt live last 30 days",
        "US inflation rate 2015 to 2024",
        "mortgage rates versus home prices since 2000"
      ],
      spec: rentVsWages()
    },
    {
      category: "Population",
      query: "world population growth 1960 to 2024",
      headline: "The world got much larger while growth slowed",
      context:
        "The world added billions of people in one lifetime, but the curve also hints at slowing growth. That tension is easier to see visually than to explain in one statistic.",
      whyItMatters:
        "Population shape affects schools, housing, labor markets, climate planning, and the age mix of entire countries.",
      followUpPrompts: [
        "largest countries by population today",
        "life expectancy in the US vs Japan since 1960",
        "urban population share since 1960"
      ],
      spec: population()
    },
    {
      category: "Crypto",
      query: "Bitcoin vs Ethereum live over the last 30 days",
      headline: "Crypto trust starts with live prices",
      context:
        "Crypto cycles are volatile, but plotting two major assets together makes the rhythm easier to see. In live mode, the app can show a sourced market window instead of an old static example.",
      whyItMatters:
        "A live source badge changes the feeling of the product: users can tell which charts are current and which are educational estimates.",
      followUpPrompts: [
        "Bitcoin price over the last year",
        "Ethereum price over the last 30 days",
        "Solana price over the last 30 days"
      ],
      spec: bitcoinEthereum()
    },
    {
      category: "Climate",
      query: "global temperature anomaly since 1980",
      headline: "Climate change is visible as a baseline shift",
      context:
        "Temperature anomalies can sound abstract until the baseline stays above zero year after year. The line makes the direction and persistence hard to miss.",
      whyItMatters:
        "Seeing anomaly data as a shape helps users separate long-term climate signal from one hot summer or one cold winter.",
      followUpPrompts: [
        "carbon dioxide concentration since 1980",
        "renewable energy share since 2000",
        "US electricity mix since 2000"
      ],
      spec: climate()
    },
    {
      category: "Work",
      query: "remote work adoption before and after 2020",
      headline: "Remote work was a step change",
      context:
        "Some trends creep upward; remote work jumped. The chart shows why 2020 still matters when people talk about offices, commutes, and hiring geography.",
      whyItMatters:
        "A sudden level shift affects city centers, household routines, software demand, and how companies think about talent.",
      followUpPrompts: [
        "commute time trends since 2000",
        "office vacancy rates since 2015",
        "labor force participation since 2000"
      ],
      spec: remoteWork()
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
    whyItMatters:
      "Inflation changes the meaning of every paycheck and price tag, so the timing of spikes matters for household decisions.",
    dataSource: "training",
    followUpPrompts: [
      "rent vs wages since 2000",
      "coffee prices over the last decade",
      "US national debt live last 30 days"
    ],
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
    whyItMatters:
      "Bitcoin is easier to reason about when volatility is treated as the main feature, not a surprising exception.",
    dataSource: "approximate",
    followUpPrompts: [
      "Bitcoin price over the last 30 days",
      "Bitcoin vs Ethereum live over the last 30 days",
      "Ethereum price over the last year"
    ],
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
    whyItMatters:
      "Indexing makes unlike prices comparable, so users can see which asset moved more instead of only which one costs more.",
    dataSource: "approximate",
    followUpPrompts: [
      "Bitcoin vs Ethereum live over the last 30 days",
      "Bitcoin price over the last year",
      "crypto market share by coin"
    ],
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
    whyItMatters:
      "Long-run social changes often reshape family finances, housing demand, and public policy before they become obvious in daily life.",
    dataSource: "training",
    followUpPrompts: [
      "birth rates in the United States since 1970",
      "average age at first marriage since 1970",
      "household size in the United States since 1960"
    ],
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
    whyItMatters:
      "Population changes set the backdrop for schools, housing, migration, employment, and climate demand.",
    dataSource: "training",
    followUpPrompts: [
      "life expectancy in the US vs Japan since 1960",
      "urban population share since 1960",
      "largest countries by population today"
    ],
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
    whyItMatters:
      "Sports debates get clearer when a single leaderboard shows whether a rivalry is reputation, record, or both.",
    dataSource: "training",
    followUpPrompts: [
      "Lakers vs Celtics championships",
      "NBA teams with the most championships",
      "Warriors championships by decade"
    ],
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
    whyItMatters:
      "Affordability is felt as a relationship between income and costs, so the gap is more revealing than either trend alone.",
    dataSource: "approximate",
    followUpPrompts: [
      "US inflation rate 2015 to 2024",
      "US national debt live last 30 days",
      "coffee prices over the last decade"
    ],
    seriesLabels: ["Rent", "Wages"]
  });
}

function climate(): ChartSpec {
  return normalizeSpec({
    title: "Global Temperatures Moved Above the Old Baseline",
    subtitle: "Approximate global temperature anomaly in degrees Celsius versus a 20th-century baseline.",
    chartType: "line",
    data: [
      { year: "1980", anomaly: 0.27 },
      { year: "1990", anomaly: 0.45 },
      { year: "2000", anomaly: 0.61 },
      { year: "2010", anomaly: 0.72 },
      { year: "2015", anomaly: 0.9 },
      { year: "2020", anomaly: 1.02 },
      { year: "2024", anomaly: 1.28 }
    ],
    xKey: "year",
    yKeys: ["anomaly"],
    colors: [colors[0]],
    unit: "C",
    source: "Approximate historical estimate based on public climate summaries.",
    insight: "The important shape is persistence: recent readings stay well above the older baseline.",
    whyItMatters:
      "An anomaly chart makes climate easier to read because it shows departure from normal, not just raw temperature.",
    dataSource: "approximate",
    followUpPrompts: [
      "carbon dioxide concentration since 1980",
      "renewable energy share since 2000",
      "electric vehicle sales since 2015"
    ],
    seriesLabels: ["Temperature anomaly"]
  });
}

function remoteWork(): ChartSpec {
  return normalizeSpec({
    title: "Remote Work Jumped Instead of Drifting Up",
    subtitle: "Approximate share of US paid workdays done from home.",
    chartType: "area",
    data: [
      { year: "2017", remote_work: 5 },
      { year: "2018", remote_work: 5 },
      { year: "2019", remote_work: 6 },
      { year: "2020", remote_work: 42 },
      { year: "2021", remote_work: 35 },
      { year: "2022", remote_work: 29 },
      { year: "2023", remote_work: 27 },
      { year: "2024", remote_work: 25 }
    ],
    xKey: "year",
    yKeys: ["remote_work"],
    colors: [colors[1]],
    unit: "%",
    source: "Approximate estimate based on public work-from-home trend summaries.",
    insight: "Remote work settled below the 2020 peak but far above the pre-2020 norm.",
    whyItMatters:
      "The level shift explains why offices, commutes, hiring pools, and downtown businesses still feel different.",
    dataSource: "approximate",
    followUpPrompts: [
      "office vacancy rates since 2015",
      "commute time trends since 2000",
      "software spending before and after 2020"
    ],
    seriesLabels: ["Remote work"]
  });
}

function streamingVsCable(): ChartSpec {
  return normalizeSpec({
    title: "Streaming Overtook Cable as the Default Screen Habit",
    subtitle: "Approximate US household adoption index, where 2010 equals 100.",
    chartType: "line",
    data: [
      { year: "2010", streaming: 100, cable: 100 },
      { year: "2012", streaming: 150, cable: 98 },
      { year: "2014", streaming: 230, cable: 92 },
      { year: "2016", streaming: 340, cable: 84 },
      { year: "2018", streaming: 480, cable: 73 },
      { year: "2020", streaming: 640, cable: 61 },
      { year: "2024", streaming: 790, cable: 45 }
    ],
    xKey: "year",
    yKeys: ["streaming", "cable"],
    colors: [colors[1], colors[0]],
    unit: "index",
    source: "Approximate index based on public media adoption summaries.",
    insight: "The crossing pattern shows a behavior swap, not just growth in one product category.",
    whyItMatters:
      "Media shifts change advertising, sports rights, household bills, and what kinds of stories get funded.",
    dataSource: "approximate",
    followUpPrompts: [
      "music streaming revenue since 2010",
      "movie theater attendance since 2000",
      "newspaper circulation since 1990"
    ],
    seriesLabels: ["Streaming", "Cable TV"]
  });
}

function lifeExpectancy(): ChartSpec {
  return normalizeSpec({
    title: "Japan's Life Expectancy Lead Became Clear Over Decades",
    subtitle: "Approximate life expectancy at birth in years.",
    chartType: "line",
    data: [
      { year: "1960", us: 69.8, japan: 67.7 },
      { year: "1970", us: 70.8, japan: 72.0 },
      { year: "1980", us: 73.7, japan: 76.1 },
      { year: "1990", us: 75.2, japan: 78.8 },
      { year: "2000", us: 76.8, japan: 81.1 },
      { year: "2010", us: 78.5, japan: 82.9 },
      { year: "2020", us: 77.0, japan: 84.6 }
    ],
    xKey: "year",
    yKeys: ["us", "japan"],
    colors: [colors[0], colors[1]],
    unit: "years",
    source: "Historical estimate based on public life expectancy summaries.",
    insight: "The gap grew because Japan kept gaining years while US progress slowed and then dipped.",
    whyItMatters:
      "Life expectancy compresses many conditions into one readable line: health care, safety, income, behavior, and public health shocks.",
    dataSource: "training",
    followUpPrompts: [
      "infant mortality US vs Japan since 1960",
      "US life expectancy by gender since 1960",
      "world population growth 1960 to 2024"
    ],
    seriesLabels: ["United States", "Japan"]
  });
}

function smartphoneAdoption(): ChartSpec {
  return normalizeSpec({
    title: "Smartphones Became Near-Universal Fast",
    subtitle: "Approximate share of US adults who own a smartphone.",
    chartType: "area",
    data: [
      { year: "2011", smartphone: 35 },
      { year: "2013", smartphone: 56 },
      { year: "2015", smartphone: 68 },
      { year: "2017", smartphone: 77 },
      { year: "2019", smartphone: 81 },
      { year: "2021", smartphone: 85 },
      { year: "2024", smartphone: 91 }
    ],
    xKey: "year",
    yKeys: ["smartphone"],
    colors: [colors[2]],
    unit: "%",
    source: "Approximate estimate based on public technology adoption surveys.",
    insight: "The steep early climb shows how quickly smartphones moved from optional device to default infrastructure.",
    whyItMatters:
      "Once adoption passes most adults, phones stop being a gadget category and become the platform for banks, schools, work, and public services.",
    dataSource: "approximate",
    followUpPrompts: [
      "social media adoption since 2005",
      "internet access in the United States since 2000",
      "streaming subscriptions vs cable TV since 2010"
    ],
    seriesLabels: ["Smartphone ownership"]
  });
}

function coffeePrices(): ChartSpec {
  return normalizeSpec({
    title: "Coffee Prices Remind You Commodities Have Cycles",
    subtitle: "Approximate retail coffee price index, where 2014 equals 100.",
    chartType: "line",
    data: [
      { year: "2014", coffee: 100 },
      { year: "2016", coffee: 96 },
      { year: "2018", coffee: 101 },
      { year: "2020", coffee: 108 },
      { year: "2021", coffee: 119 },
      { year: "2022", coffee: 138 },
      { year: "2024", coffee: 146 }
    ],
    xKey: "year",
    yKeys: ["coffee"],
    colors: [colors[0]],
    unit: "index",
    source: "Approximate index based on public retail and commodity price summaries.",
    insight: "The recent rise is sharper than the quiet middle of the decade.",
    whyItMatters:
      "A familiar everyday item makes inflation concrete because users already know what the product feels like in a budget.",
    dataSource: "approximate",
    followUpPrompts: [
      "US food price inflation 2010 to 2024",
      "US inflation rate 2015 to 2024",
      "gas prices over the last decade"
    ],
    seriesLabels: ["Coffee price index"]
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
    whyItMatters:
      "Even a rough first pass helps users decide whether the question deserves better source data or a sharper comparison.",
    dataSource: "approximate",
    followUpPrompts: [
      "Bitcoin price over the last 30 days",
      "US national debt live last 30 days",
      "rent vs wages since 2000"
    ],
    seriesLabels: ["Value"]
  });
}
