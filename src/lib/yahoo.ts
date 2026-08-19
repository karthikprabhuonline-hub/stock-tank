import YahooFinance from "yahoo-finance2";
import type { ChartPeriod, ChartPoint, FinancialPoint, StockDetail, StockSearchResult } from "@/types/stock";
import { buildDiscoverInsight, buildStockInsights, buildTrendInsights } from "./insights";
import { buildMetrics } from "./metrics";
import { formatMarketCap } from "./format";

const yahooFinance = new YahooFinance();

const INDIAN_SUFFIXES = [".NS", ".BO"] as const;

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (value && typeof value === "object") {
    const raw = (value as { raw?: unknown }).raw;
    if (typeof raw === "number") {
      return Number.isNaN(raw) ? null : raw;
    }
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const number = toNumber(value);
    if (number != null) return number;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value && typeof value === "object") {
    const raw = (value as { raw?: unknown }).raw;
    return toDate(raw);
  }
  return null;
}

function readField(record: unknown, key: string): unknown {
  if (!record || typeof record !== "object") return null;
  return (record as Record<string, unknown>)[key];
}

function buildFinancialPoint(record: unknown, fallbackIndex: number, yearly: boolean): FinancialPoint | null {
  const endDate = toDate(readField(record, "endDate"));
  const revenue = firstNumber(readField(record, "totalRevenue"), readField(record, "revenue"));
  const profit = firstNumber(readField(record, "netIncome"), readField(record, "netIncomeApplicableToCommonShares"));
  const eps = firstNumber(
    readField(record, "dilutedEPS"),
    readField(record, "dilutedEps"),
    readField(record, "basicEPS"),
    readField(record, "basicEps")
  );

  if (!endDate && revenue == null && profit == null) return null;

  const date = endDate?.toISOString().split("T")[0] ?? `period-${fallbackIndex + 1}`;
  const label = endDate
    ? yearly
      ? String(endDate.getFullYear())
      : `Q${Math.floor(endDate.getMonth() / 3) + 1} ${String(endDate.getFullYear()).slice(-2)}`
    : `Period ${fallbackIndex + 1}`;

  return { label, date, revenue, profit, eps };
}

function buildFinancialSeries(records: unknown, limit: number, yearly = false): FinancialPoint[] {
  if (!Array.isArray(records)) return [];

  return records
    .map((record, index) => buildFinancialPoint(record, index, yearly))
    .filter((point): point is FinancialPoint => point != null)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-limit);
}

export function normalizeSymbol(input: string): string {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return trimmed;
  if (INDIAN_SUFFIXES.some((suffix) => trimmed.endsWith(suffix))) {
    return trimmed;
  }
  return `${trimmed}.NS`;
}

export function decodeSymbol(symbol: string): string {
  return decodeURIComponent(symbol).toUpperCase();
}

function isIndianEquity(symbol: string): boolean {
  return INDIAN_SUFFIXES.some((suffix) => symbol.endsWith(suffix));
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query.trim()) return [];

  const result = await yahooFinance.search(query, {
    quotesCount: 12,
    newsCount: 0,
  });

  return (result.quotes ?? [])
    .filter(
      (quote): quote is typeof quote & { symbol: string; shortname?: string; longname?: string } =>
        "symbol" in quote &&
        typeof quote.symbol === "string" &&
        isIndianEquity(quote.symbol) &&
        quote.quoteType === "EQUITY"
    )
    .map((quote) => ({
      symbol: quote.symbol,
      name: quote.longname ?? quote.shortname ?? quote.symbol,
      exchange: quote.symbol.endsWith(".BO") ? "BSE" : "NSE",
      type: String(quote.quoteType ?? "EQUITY"),
    }));
}

export async function getStockDetail(symbol: string): Promise<StockDetail> {
  const normalized = normalizeSymbol(symbol);

  const [quote, summary] = await Promise.all([
    yahooFinance.quote(normalized),
    yahooFinance
      .quoteSummary(normalized, {
        modules: [
          "summaryProfile",
          "defaultKeyStatistics",
          "financialData",
          "incomeStatementHistory",
          "incomeStatementHistoryQuarterly",
        ],
      })
      .catch(() => null),
  ]);

  const profile = summary?.summaryProfile;
  const stats = summary?.defaultKeyStatistics;
  const financial = summary?.financialData;
  const quarterly = buildFinancialSeries(
    readField(summary?.incomeStatementHistoryQuarterly, "incomeStatementHistory"),
    8
  );
  const yearly = buildFinancialSeries(
    readField(summary?.incomeStatementHistory, "incomeStatementHistory"),
    5,
    true
  );
  const debtToEquity = firstNumber(financial?.debtToEquity, stats?.debtToEquity);
  const stockInsights = buildStockInsights(quarterly, debtToEquity);

  return {
    symbol: normalized,
    name: quote.longName ?? quote.shortName ?? normalized,
    price: quote.regularMarketPrice ?? null,
    currency: quote.currency ?? "INR",
    change: quote.regularMarketChange ?? null,
    changePercent: quote.regularMarketChangePercent ?? null,
    marketCap: formatMarketCap(quote.marketCap ?? stats?.marketCap),
    sector: profile?.sector ?? quote.sector ?? null,
    industry: profile?.industry ?? quote.industry ?? null,
    summary: profile?.longBusinessSummary ?? null,
    metrics: buildMetrics({
      peRatio: firstNumber(quote.trailingPE, stats?.trailingPE, quote.forwardPE),
      eps: firstNumber(
        stats?.trailingEps,
        quote.epsTrailingTwelveMonths,
        quote.epsForward,
        quote.epsCurrentYear
      ),
      roe: firstNumber(financial?.returnOnEquity),
      bookValue: stats?.bookValue,
      debtToEquity,
    }),
    financials: {
      quarterly,
      yearly,
    },
    trends: buildTrendInsights(quarterly),
    verdicts: stockInsights.verdicts,
    observations: stockInsights.observations,
    redFlags: stockInsights.redFlags,
    discoverInsight: buildDiscoverInsight(quarterly, debtToEquity),
    holdings: {
      promoterHolding: null,
      publicHolding: null,
    },
  };
}

function getChartRange(period: ChartPeriod): { period1: Date; interval: "1d" | "1wk" } {
  const period1 = new Date();
  switch (period) {
    case "1Y":
      period1.setFullYear(period1.getFullYear() - 1);
      return { period1, interval: "1d" };
    case "3Y":
      period1.setFullYear(period1.getFullYear() - 3);
      return { period1, interval: "1wk" };
    case "5Y":
      period1.setFullYear(period1.getFullYear() - 5);
      return { period1, interval: "1wk" };
  }
}

export async function getChartData(
  symbol: string,
  period: ChartPeriod
): Promise<ChartPoint[]> {
  const normalized = normalizeSymbol(symbol);
  const { period1, interval } = getChartRange(period);

  const chart = await yahooFinance.chart(normalized, {
    period1,
    period2: new Date(),
    interval,
  });

  return (chart.quotes ?? [])
    .filter(
      (point): point is typeof point & { close: number; date: Date } =>
        point.close != null && point.date != null
    )
    .map((point) => ({
      date: point.date.toISOString().split("T")[0],
      close: point.close,
    }));
}

export const POPULAR_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "ITC.NS", name: "ITC" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
];
