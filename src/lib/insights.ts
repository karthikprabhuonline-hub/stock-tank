import type {
  FinancialPoint,
  StockObservation,
  TrendDirection,
  TrendInsight,
} from "@/types/stock";

function numericSeries(points: FinancialPoint[], key: "revenue" | "profit"): number[] {
  return points
    .map((point) => point[key])
    .filter((value): value is number => value != null && !Number.isNaN(value));
}

function directionFor(values: number[]): TrendDirection {
  if (values.length < 2) return "Unavailable";

  const first = values[0];
  const last = values[values.length - 1];
  const change = first === 0 ? 0 : (last - first) / Math.abs(first);

  if (change > 0.08) return "Increasing";
  if (change < -0.08) return "Declining";
  return "Flat";
}

function hasThreeQuarterDecline(values: number[]): boolean {
  if (values.length < 4) return false;
  const recent = values.slice(-4);
  return recent[1] < recent[0] && recent[2] < recent[1] && recent[3] < recent[2];
}

function isVolatile(values: number[]): boolean {
  if (values.length < 4) return false;

  let directionChanges = 0;
  for (let index = 2; index < values.length; index += 1) {
    const previousMove = values[index - 1] - values[index - 2];
    const currentMove = values[index] - values[index - 1];
    if (previousMove !== 0 && currentMove !== 0 && Math.sign(previousMove) !== Math.sign(currentMove)) {
      directionChanges += 1;
    }
  }

  return directionChanges >= 2;
}

function trendDescription(label: string, direction: TrendDirection): string {
  if (direction === "Increasing") return `${label} has improved over the available periods.`;
  if (direction === "Declining") return `${label} has weakened over the available periods.`;
  if (direction === "Flat") return `${label} is broadly stable over the available periods.`;
  return `${label} trend is unavailable from the current data.`;
}

export function buildTrendInsights(points: FinancialPoint[]): TrendInsight[] {
  const revenueDirection = directionFor(numericSeries(points, "revenue"));
  const profitDirection = directionFor(numericSeries(points, "profit"));

  return [
    {
      label: "Revenue Trend",
      direction: revenueDirection,
      description: trendDescription("Revenue", revenueDirection),
    },
    {
      label: "Profit Trend",
      direction: profitDirection,
      description: trendDescription("Profit", profitDirection),
    },
  ];
}

export function buildStockInsights(
  quarterly: FinancialPoint[],
  debtToEquity: number | null
): {
  verdicts: StockObservation[];
  observations: StockObservation[];
  redFlags: StockObservation[];
} {
  const revenue = numericSeries(quarterly, "revenue");
  const profit = numericSeries(quarterly, "profit");
  const revenueDirection = directionFor(revenue);
  const profitDirection = directionFor(profit);
  const latestProfit = profit.at(-1);
  const profitDeclining = hasThreeQuarterDecline(profit);
  const profitVolatile = isVolatile(profit);
  const highDebt = debtToEquity != null && debtToEquity > 1.5;

  const verdicts: StockObservation[] = [
    {
      type: revenueDirection === "Increasing" ? "positive" : revenueDirection === "Declining" ? "warning" : "neutral",
      title: revenueDirection === "Increasing" ? "Growing Business" : revenueDirection === "Declining" ? "Sales Pressure" : "Revenue Stable",
      description: trendDescription("Revenue", revenueDirection),
    },
    {
      type: profitDirection === "Increasing" && !profitVolatile ? "positive" : profitDirection === "Declining" || profitVolatile ? "warning" : "neutral",
      title: profitVolatile ? "Profit Unstable" : profitDirection === "Increasing" ? "Profit Improving" : "Profit Watch",
      description: profitVolatile ? "Profits have moved unevenly in recent quarters." : trendDescription("Profit", profitDirection),
    },
    {
      type: highDebt ? "warning" : debtToEquity == null ? "neutral" : "positive",
      title: highDebt ? "High Debt" : debtToEquity == null ? "Debt Data Unclear" : "Debt Manageable",
      description: highDebt
        ? "Debt to equity is above the simple risk threshold."
        : debtToEquity == null
          ? "Debt to equity was not available from the source."
          : "Debt to equity is below the simple risk threshold.",
    },
  ];

  const observations: StockObservation[] = [
    {
      type: revenueDirection === "Increasing" ? "positive" : revenueDirection === "Declining" ? "warning" : "neutral",
      title:
        revenueDirection === "Increasing"
          ? "Revenue is consistently improving"
          : revenueDirection === "Declining"
            ? "Revenue has declined recently"
            : "Revenue is broadly steady",
      description: "Based on the available quarterly revenue series.",
    },
    {
      type: profitVolatile || profitDirection === "Declining" ? "warning" : profitDirection === "Increasing" ? "positive" : "neutral",
      title: profitVolatile ? "Profits are volatile" : profitDirection === "Increasing" ? "Profit trend is improving" : "Profit needs monitoring",
      description: "Based on the available quarterly net profit series.",
    },
  ];

  const redFlags: StockObservation[] = [];

  if (latestProfit != null && latestProfit < 0) {
    redFlags.push({
      type: "warning",
      title: "Negative profit in latest quarter",
      description: "The latest available quarter shows a loss.",
    });
  }

  if (profitDeclining) {
    redFlags.push({
      type: "warning",
      title: "Profit declining for 3 consecutive quarters",
      description: "Recent profit movement has been consistently negative.",
    });
  }

  if (highDebt) {
    redFlags.push({
      type: "warning",
      title: "High debt",
      description: "Debt to equity is above 1.5.",
    });
  }

  return { verdicts, observations, redFlags };
}

function lastThreeIncreasing(values: number[]): boolean {
  if (values.length < 4) return false;
  const recent = values.slice(-4);
  return recent[1] > recent[0] && recent[2] > recent[1] && recent[3] > recent[2];
}

export function buildDiscoverInsight(
  quarterly: FinancialPoint[],
  debtToEquity: number | null
): string {
  const revenue = numericSeries(quarterly, "revenue");
  const profit = numericSeries(quarterly, "profit");
  const latestProfit = profit.at(-1);
  const highDebt = debtToEquity != null && debtToEquity > 1.5;

  if (latestProfit != null && latestProfit < 0) {
    return "Latest quarter showed a loss";
  }

  if (highDebt) {
    return "High debt levels observed";
  }

  if (isVolatile(profit)) {
    return "Profits are volatile";
  }

  if (lastThreeIncreasing(revenue) || directionFor(revenue) === "Increasing") {
    return "Revenue growing consistently";
  }

  if (directionFor(revenue) === "Declining") {
    return "Revenue has declined recently";
  }

  if (directionFor(profit) === "Declining") {
    return "Profits are under pressure";
  }

  if (directionFor(profit) === "Increasing") {
    return "Profits are improving";
  }

  return "Business looks broadly stable";
}
