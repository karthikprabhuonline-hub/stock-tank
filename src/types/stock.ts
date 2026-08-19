export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface StockMetric {
  key: string;
  label: string;
  value: string;
  tooltip: string;
}

export interface HoldingInfo {
  promoterHolding: string | null;
  publicHolding: string | null;
}

export interface FinancialPoint {
  label: string;
  date: string;
  revenue: number | null;
  profit: number | null;
  eps: number | null;
}

export interface Financials {
  quarterly: FinancialPoint[];
  yearly: FinancialPoint[];
}

export type TrendDirection = "Increasing" | "Flat" | "Declining" | "Unavailable";

export interface TrendInsight {
  label: string;
  direction: TrendDirection;
  description: string;
}

export interface StockObservation {
  type: "positive" | "warning" | "neutral";
  title: string;
  description: string;
}

export interface StockDetail {
  symbol: string;
  name: string;
  price: number | null;
  currency: string;
  change: number | null;
  changePercent: number | null;
  marketCap: string | null;
  sector: string | null;
  industry: string | null;
  summary: string | null;
  metrics: StockMetric[];
  financials: Financials;
  trends: TrendInsight[];
  verdicts: StockObservation[];
  observations: StockObservation[];
  redFlags: StockObservation[];
  discoverInsight: string;
  holdings: HoldingInfo;
}

export interface ChartPoint {
  date: string;
  close: number;
}

export type ChartPeriod = "1Y" | "3Y" | "5Y";

export interface ChartData {
  symbol: string;
  period: ChartPeriod;
  points: ChartPoint[];
}
