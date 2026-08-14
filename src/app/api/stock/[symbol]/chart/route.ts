import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/cache";
import { decodeSymbol, getChartData } from "@/lib/yahoo";
import type { ChartPeriod } from "@/types/stock";

const VALID_PERIODS: ChartPeriod[] = ["1Y", "3Y", "5Y"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeSymbol(rawSymbol);
  const periodParam = request.nextUrl.searchParams.get("period") ?? "1Y";
  const period = VALID_PERIODS.includes(periodParam as ChartPeriod)
    ? (periodParam as ChartPeriod)
    : "1Y";

  const cacheKey = `chart:${symbol}:${period}`;
  const cached = getCached<{ chart: { symbol: string; period: ChartPeriod; points: Awaited<ReturnType<typeof getChartData>> } }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const points = await getChartData(symbol, period);
    const payload = { chart: { symbol, period, points } };
    setCache(cacheKey, payload, 60);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Chart API error:", error);
    return NextResponse.json(
      { error: "Unable to load chart data. Please try again." },
      { status: 502 }
    );
  }
}
