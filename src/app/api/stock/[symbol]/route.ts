import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/cache";
import { decodeSymbol, getStockDetail } from "@/lib/yahoo";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeSymbol(rawSymbol);
  const cacheKey = `stock:${symbol}`;

  const cached = getCached<{ stock: Awaited<ReturnType<typeof getStockDetail>> }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const stock = await getStockDetail(symbol);
    const payload = { stock };
    setCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Stock API error:", error);
    return NextResponse.json(
      { error: "Stock not found or data unavailable. Check the symbol and try again." },
      { status: 404 }
    );
  }
}
