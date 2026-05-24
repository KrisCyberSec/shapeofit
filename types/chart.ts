export type ChartType = "line" | "bar" | "area" | "scatter";

export type DataSource =
  | "live_treasury"
  | "live_fred"
  | "live_worldbank"
  | "live_coingecko"
  | "csv_upload"
  | "training"
  | "approximate";

export interface ChartAnnotation {
  xValue: string | number;
  note: string;
  createdAt: string;
}

export interface ChartPointSelection {
  xValue: string | number;
  row: Record<string, string | number>;
}

export interface ChartSpec {
  title: string;
  subtitle: string;
  generatedFrom?: string;
  chartType: ChartType;
  data: Record<string, string | number>[];
  xKey: string;
  yKeys: string[];
  colors: string[];
  unit: string;
  source: string;
  sourceUrl?: string;
  sourceUpdatedAt?: string;
  assumptions?: string[];
  insight: string;
  whyItMatters?: string;
  dataSource: DataSource;
  annotations?: ChartAnnotation[];
  followUpPrompts?: string[];
  seriesLabels?: string[];
}

export interface ClarificationOption {
  label: string;
  refinedQuery: string;
}

export interface ClarificationResponse {
  needsClarification: true;
  question: string;
  options: ClarificationOption[];
}

export type ChartResponse = ChartSpec | ClarificationResponse;

export interface DailyStory {
  date: string;
  category: string;
  query: string;
  headline: string;
  context: string;
  whyItMatters: string;
  followUpPrompts: string[];
  spec: ChartSpec;
}
