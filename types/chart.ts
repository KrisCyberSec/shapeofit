export type ChartType = "line" | "bar" | "area" | "scatter";

export type DataSource =
  | "live_fred"
  | "live_coingecko"
  | "csv_upload"
  | "training"
  | "approximate";

export interface ChartAnnotation {
  xValue: string | number;
  note: string;
  createdAt: string;
}

export interface ChartSpec {
  title: string;
  subtitle: string;
  chartType: ChartType;
  data: Record<string, string | number>[];
  xKey: string;
  yKeys: string[];
  colors: string[];
  unit: string;
  source: string;
  insight: string;
  dataSource: DataSource;
  annotations?: ChartAnnotation[];
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
  context: string;
  spec: ChartSpec;
}
