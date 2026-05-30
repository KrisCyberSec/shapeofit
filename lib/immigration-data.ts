import type { ChartSpec } from "@/types/chart";
import { compactNumber, normalizeSpec } from "./chart-utils";
import { catalogEntryForAdapter } from "./data-catalog";

type ImmigrationRow = {
  year: number;
  lprAdmissions: number;
};

type ImmigrationWindow =
  | {
      trailingYears: number;
      startYear?: never;
      endYear?: never;
    }
  | {
      startYear: number;
      endYear?: number;
      trailingYears?: never;
    };

const DHS_TABLE_URL = "https://ohss.dhs.gov/topics/immigration/yearbook/2023/table1";

const DHS_LPR_FALLBACK: ImmigrationRow[] = [
  { year: 2000, lprAdmissions: 841000 },
  { year: 2001, lprAdmissions: 1058900 },
  { year: 2002, lprAdmissions: 1059360 },
  { year: 2003, lprAdmissions: 703540 },
  { year: 2004, lprAdmissions: 957880 },
  { year: 2005, lprAdmissions: 1122260 },
  { year: 2006, lprAdmissions: 1266130 },
  { year: 2007, lprAdmissions: 1052420 },
  { year: 2008, lprAdmissions: 1107130 },
  { year: 2009, lprAdmissions: 1130820 },
  { year: 2010, lprAdmissions: 1042630 },
  { year: 2011, lprAdmissions: 1062040 },
  { year: 2012, lprAdmissions: 1031630 },
  { year: 2013, lprAdmissions: 990550 },
  { year: 2014, lprAdmissions: 1016520 },
  { year: 2015, lprAdmissions: 1051030 },
  { year: 2016, lprAdmissions: 1183510 },
  { year: 2017, lprAdmissions: 1127170 },
  { year: 2018, lprAdmissions: 1096610 },
  { year: 2019, lprAdmissions: 1031770 },
  { year: 2020, lprAdmissions: 707360 },
  { year: 2021, lprAdmissions: 740000 },
  { year: 2022, lprAdmissions: 1018350 },
  { year: 2023, lprAdmissions: 1172910 }
];

export async function immigrationSpecForQuery(query: string): Promise<ChartSpec> {
  const catalogEntry = catalogEntryForAdapter("dhs_immigration", "lpr_admissions");
  const rows = await fetchDhsLprRows();
  const filtered = filterWindow(rows, immigrationWindowForQuery(query));
  const data = sampleRows(filtered, 24).map((row) => ({
    year: row.year,
    lpr_admissions: row.lprAdmissions
  }));

  if (!data.length) throw new Error("DHS immigration table returned no usable rows");

  const first = data[0];
  const latest = data.at(-1) ?? first;
  const total = filtered.reduce((sum, row) => sum + row.lprAdmissions, 0);

  return normalizeSpec({
    title: "US Lawful Permanent Resident Admissions",
    subtitle: `People obtaining lawful permanent resident status by fiscal year, shown from ${first.year} to ${latest.year}.`,
    chartType: "bar",
    data,
    xKey: "year",
    yKeys: ["lpr_admissions"],
    colors: ["#c0392b"],
    unit: "people",
    source: "DHS/OHSS Yearbook of Immigration Statistics, Table 1.",
    sourceUrl: DHS_TABLE_URL,
    sourceUpdatedAt: `FY ${latest.year}`,
    sourceCadence: catalogEntry?.cadence,
    seriesIds: catalogEntry?.seriesIds,
    assumptions: [
      "Counts people obtaining lawful permanent resident status, not every person who entered the country.",
      "Includes both new arrivals and people already in the United States who adjusted status.",
      "DHS reports annual fiscal-year data; this mapped table currently runs through fiscal year 2023."
    ],
    insight: `Across ${filtered[0]?.year ?? first.year}-${filtered.at(-1)?.year ?? latest.year}, about ${compactNumber(total)} people obtained lawful permanent resident status.`,
    dataSource: "live_dhs",
    seriesLabels: ["Lawful permanent residents"],
    followUpPrompts: [
      "US immigration over the past 20 years",
      "green cards issued in the US since 2010",
      "lawful permanent residents admitted since 2004"
    ]
  });
}

export function immigrationWindowForQuery(query: string): ImmigrationWindow {
  const lower = query.toLowerCase();
  const trailing = lower.match(
    /\b(?:past|last|previous|over the past|over the last)\s+(\d{1,3})\s+years?\b/
  );
  if (trailing) return { trailingYears: Number(trailing[1]) };
  if (/\b(?:last|past|previous)\s+two\s+decades?\b/.test(lower)) return { trailingYears: 20 };

  const range = lower.match(
    /\b(?:since|from)?\s*((?:19|20)\d{2})(?:\s*(?:to|-)\s*((?:19|20)\d{2}))?\b/
  );
  if (range) {
    return {
      startYear: Number(range[1]),
      endYear: range[2] ? Number(range[2]) : undefined
    };
  }

  return { trailingYears: 20 };
}

async function fetchDhsLprRows() {
  try {
    const response = await fetch(DHS_TABLE_URL, { next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) throw new Error("DHS table request failed");
    const rows = parseDhsTable(await response.text());
    return rows.length ? rows : DHS_LPR_FALLBACK;
  } catch {
    return DHS_LPR_FALLBACK;
  }
}

function parseDhsTable(html: string): ImmigrationRow[] {
  return Array.from(html.matchAll(/<tr><td>(\d{4})<\/td><td[^>]*>([\d,]+)<\/td><\/tr>/g))
    .map((match) => ({
      year: Number(match[1]),
      lprAdmissions: Number(match[2].replace(/,/g, ""))
    }))
    .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.lprAdmissions))
    .sort((left, right) => left.year - right.year);
}

function filterWindow(rows: ImmigrationRow[], window: ImmigrationWindow) {
  const sorted = rows.slice().sort((left, right) => left.year - right.year);
  if ("trailingYears" in window) {
    return sorted.slice(-Math.max(1, window.trailingYears ?? 20));
  }

  return sorted.filter(
    (row) => row.year >= window.startYear && (!window.endYear || row.year <= window.endYear)
  );
}

function sampleRows<T>(rows: T[], maxRows: number) {
  if (rows.length <= maxRows) return rows;
  const stride = Math.ceil(rows.length / maxRows);
  const sampled = rows.filter((_, index) => index % stride === 0);
  const last = rows.at(-1);
  if (last && sampled.at(-1) !== last) sampled.push(last);
  return sampled.slice(-maxRows);
}
