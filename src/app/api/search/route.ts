import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/cache";
import { searchStocks } from "@/lib/yahoo";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached<{ results: Awaited<ReturnType<typeof searchStocks>> }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const results = await searchStocks(query);
    const payload = { results };
    setCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Unable to search stocks right now. Please try again." },
      { status: 502 }
    );
  }
}
