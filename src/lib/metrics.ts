import type { StockMetric } from "@/types/stock";
import { formatPercent, formatRatio } from "./format";

export const METRIC_DEFINITIONS = {
  peRatio: {
    label: "PE Ratio",
    tooltip:
      "Price divided by earnings per share. A higher PE may mean investors expect strong growth — or that the stock is expensive relative to profits.",
  },
  eps: {
    label: "EPS",
    tooltip:
      "Earnings Per Share — how much profit the company made for each share. Higher EPS generally means stronger profitability.",
  },
  roe: {
    label: "ROE",
    tooltip:
      "Return on Equity — how efficiently the company uses shareholder money to generate profits. Above 15% is often considered good.",
  },
  bookValue: {
    label: "Book Value",
    tooltip:
      "Net asset value per share (assets minus liabilities). Compare with the stock price to see if the market values the company above or below its books.",
  },
  debtToEquity: {
    label: "Debt to Equity",
    tooltip:
      "Total debt compared to shareholder equity. Lower values mean less reliance on borrowed money; very high values can signal financial risk.",
  },
} as const;

export function buildMetrics(data: {
  peRatio?: number | null;
  eps?: number | null;
  roe?: number | null;
  bookValue?: number | null;
  debtToEquity?: number | null;
}): StockMetric[] {
  const normalizedRoe =
    data.roe == null || Number.isNaN(data.roe)
      ? data.roe
      : Math.abs(data.roe) > 1
        ? data.roe / 100
        : data.roe;

  return [
    {
      key: "peRatio",
      label: METRIC_DEFINITIONS.peRatio.label,
      value: formatRatio(data.peRatio),
      tooltip: METRIC_DEFINITIONS.peRatio.tooltip,
    },
    {
      key: "eps",
      label: METRIC_DEFINITIONS.eps.label,
      value: formatRatio(data.eps),
      tooltip: METRIC_DEFINITIONS.eps.tooltip,
    },
    {
      key: "roe",
      label: METRIC_DEFINITIONS.roe.label,
      value: formatPercent(normalizedRoe),
      tooltip: METRIC_DEFINITIONS.roe.tooltip,
    },
    {
      key: "bookValue",
      label: METRIC_DEFINITIONS.bookValue.label,
      value: formatRatio(data.bookValue),
      tooltip: METRIC_DEFINITIONS.bookValue.tooltip,
    },
    {
      key: "debtToEquity",
      label: METRIC_DEFINITIONS.debtToEquity.label,
      value: formatRatio(data.debtToEquity),
      tooltip: METRIC_DEFINITIONS.debtToEquity.tooltip,
    },
  ];
}
