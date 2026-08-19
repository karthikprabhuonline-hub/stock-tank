"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatPrice } from "@/lib/format";
import type { StockDetail } from "@/types/stock";

interface DiscoverFeedProps {
  symbols: readonly string[];
}

type StockCache = Record<string, StockDetail>;

const WATCHLIST_KEY = "stock-tank-watchlist";
const VIEWED_KEY = "stock-tank-discover-viewed";
const PRELOAD_COUNT = 4;

function shuffleSymbols(symbols: readonly string[]): string[] {
  return [...symbols]
    .map((symbol) => ({ symbol, order: Math.random() }))
    .sort((left, right) => left.order - right.order)
    .map((item) => item.symbol);
}

function readStoredList(key: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredList(key: string, values: string[]) {
  window.localStorage.setItem(key, JSON.stringify(values));
}

function metricValue(stock: StockDetail, key: string): string {
  return stock.metrics.find((metric) => metric.key === key)?.value ?? "—";
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("a, button"));
}

function companySummary(stock: StockDetail): string {
  if (stock.summary) {
    const compact = stock.summary.replace(/\s+/g, " ").trim();
    if (compact.length <= 160) return compact;
    return `${compact.slice(0, 157).trim()}...`;
  }

  if (stock.industry && stock.sector) {
    return `${stock.industry} business in the ${stock.sector} sector.`;
  }

  if (stock.sector) return `Operates in the ${stock.sector} sector.`;
  return "Company description unavailable.";
}

export function DiscoverFeed({ symbols }: DiscoverFeedProps) {
  const [stockOrder, setStockOrder] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(2);
  const [stockCache, setStockCache] = useState<StockCache>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [savedSymbol, setSavedSymbol] = useState<string | null>(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastCardRef = useRef<HTMLElement | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});
  const inFlightRef = useRef<Set<string>>(new Set());
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const viewed = new Set(readStoredList(VIEWED_KEY));
    const available = symbols.filter((symbol) => !viewed.has(symbol));
    const nextOrder = shuffleSymbols(available.length > 0 ? available : symbols);

    if (available.length === 0) {
      viewed.clear();
      writeStoredList(VIEWED_KEY, []);
    }

    viewedRef.current = viewed;
    setWatchlist(readStoredList(WATCHLIST_KEY));
    setStockOrder(nextOrder);
    setVisibleCount(Math.min(2, nextOrder.length));
  }, [symbols]);

  const visibleSymbols = useMemo(
    () => stockOrder.slice(0, visibleCount),
    [stockOrder, visibleCount]
  );

  const markViewed = useCallback((symbol: string) => {
    if (viewedRef.current.has(symbol)) return;
    viewedRef.current.add(symbol);
    writeStoredList(VIEWED_KEY, [...viewedRef.current]);
  }, []);

  const loadStock = useCallback(async (symbol: string) => {
    if (inFlightRef.current.has(symbol)) return;
    inFlightRef.current.add(symbol);

    try {
      const response = await fetch(`/api/stock/${encodeURIComponent(symbol)}`);
      const payload = await response.json();

      if (!response.ok || !payload.stock) return;

      setStockCache((current) => {
        if (current[symbol]) return current;
        return { ...current, [symbol]: payload.stock };
      });
    } finally {
      inFlightRef.current.delete(symbol);
    }
  }, []);

  useEffect(() => {
    const preloadUntil = Math.min(stockOrder.length, visibleCount + PRELOAD_COUNT);
    stockOrder.slice(0, preloadUntil).forEach((symbol) => {
      if (!stockCache[symbol]) {
        void loadStock(symbol);
      }
    });
  }, [loadStock, stockCache, stockOrder, visibleCount]);

  const showNextStock = useCallback(() => {
    setVisibleCount((current) => Math.min(current + 1, stockOrder.length));
  }, [stockOrder.length]);

  useEffect(() => {
    const root = scrollerRef.current;
    const lastCard = lastCardRef.current;
    if (!root || !lastCard || visibleCount >= stockOrder.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(lastCard);
        showNextStock();
      },
      { root, threshold: 0.15 }
    );

    observer.observe(lastCard);
    return () => observer.disconnect();
  }, [showNextStock, stockOrder.length, visibleCount]);

  useEffect(() => {
    visibleSymbols.forEach((symbol) => markViewed(symbol));
  }, [markViewed, visibleSymbols]);

  const saveToWatchlist = useCallback((symbol: string) => {
    setWatchlist((current) => {
      if (current.includes(symbol)) return current;
      const next = [...current, symbol];
      writeStoredList(WATCHLIST_KEY, next);
      return next;
    });
    setSavedSymbol(symbol);
    window.setTimeout(() => setSavedSymbol(null), 1200);
  }, []);

  function handleCardTap(symbol: string, event: React.PointerEvent<HTMLElement>) {
    if (isInteractiveTarget(event.target)) return;

    const now = Date.now();
    const lastTap = lastTapRef.current[symbol] ?? 0;

    if (now - lastTap < 300) {
      saveToWatchlist(symbol);
    }

    lastTapRef.current[symbol] = now;
  }

  const watchedSet = useMemo(() => new Set(watchlist), [watchlist]);
  const reachedEnd = stockOrder.length > 0 && visibleCount >= stockOrder.length;

  return (
    <div className="relative h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] sm:px-4">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-200"
        >
          ← Home
        </Link>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWatchlist((open) => !open)}
            className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-200"
          >
            Watchlist {watchlist.length}
          </button>
          <ThemeToggle />
        </div>
      </div>

      {showWatchlist && (
        <div className="absolute inset-x-0 top-14 z-30 mx-auto w-[min(100%,32rem)] px-3 sm:px-4">
          <div className="rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95">
            {watchlist.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Double tap a card to save a stock here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {watchlist.map((symbol) => (
                  <Link
                    key={symbol}
                    href={`/stock/${encodeURIComponent(symbol)}`}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                  >
                    {symbol.replace(/\.NS$/, "")}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={scrollerRef}
        className="h-dvh snap-y snap-mandatory overflow-y-scroll overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visibleSymbols.map((symbol, index) => {
          const stock = stockCache[symbol];
          const watched = watchedSet.has(symbol);
          const isLast = index === visibleSymbols.length - 1;

          return (
            <section
              key={symbol}
              ref={isLast ? lastCardRef : undefined}
              onPointerUp={(event) => handleCardTap(symbol, event)}
              className="h-dvh w-full snap-start snap-always"
            >
              <article className="mx-auto flex h-full max-w-lg flex-col justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-14 sm:max-w-xl sm:px-6 sm:pt-16">
                {stock ? (
                  <>
                    <div className="min-h-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/stock/${encodeURIComponent(stock.symbol)}`}
                            className="block truncate text-lg font-bold leading-tight tracking-tight text-zinc-900 transition-colors hover:text-indigo-600 sm:text-2xl dark:text-zinc-100 dark:hover:text-indigo-300"
                          >
                            {stock.name}
                          </Link>
                          <p className="mt-0.5 text-xs font-medium text-indigo-600 sm:text-sm dark:text-indigo-400">
                            {stock.symbol.replace(/\.NS$/, "")}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-base font-bold text-zinc-900 sm:text-xl dark:text-zinc-100">
                            {formatPrice(stock.price)}
                          </p>
                          <p className="mt-0.5 text-[10px] text-zinc-500 sm:text-xs dark:text-zinc-400">
                            Current price
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-zinc-600 sm:mt-4 sm:text-sm dark:text-zinc-300">
                        {companySummary(stock)}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        ["PE Ratio", metricValue(stock, "peRatio")],
                        ["ROE", metricValue(stock, "roe")],
                        ["Debt / Equity", metricValue(stock, "debtToEquity")],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-zinc-900 sm:p-4">
                          <p className="text-[10px] font-medium uppercase leading-tight text-zinc-500 sm:text-xs dark:text-zinc-400">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-900 sm:mt-2 sm:text-xl dark:text-zinc-100">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/10 sm:p-5">
                      <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
                        <p className="text-xs font-semibold text-indigo-700 sm:text-sm dark:text-indigo-300">
                          Quick Insight
                        </p>
                        <button
                          type="button"
                          onClick={() => saveToWatchlist(stock.symbol)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors sm:h-9 sm:w-9 ${
                            watched
                              ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
                              : "border-zinc-200 bg-white text-zinc-500 hover:text-rose-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-rose-300"
                          }`}
                          aria-label={watched ? "Stock saved to watchlist" : "Save stock to watchlist"}
                          title={watched ? "Saved to watchlist" : "Save to watchlist"}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={watched ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-base font-semibold leading-snug text-zinc-900 sm:text-xl dark:text-zinc-100">
                        {stock.discoverInsight}
                      </p>
                      {savedSymbol === stock.symbol && (
                        <p className="mt-2 text-xs font-semibold text-rose-600 sm:mt-3 sm:text-sm dark:text-rose-300">
                          Added to watchlist
                        </p>
                      )}
                    </div>

                    <p className="pb-1 text-center text-[10px] text-zinc-400 sm:text-xs">
                      {reachedEnd && isLast ? "You have seen all Discover stocks for now." : "Swipe up for the next stock"}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" />
                      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                        Loading stock...
                      </p>
                    </div>
                  </div>
                )}
              </article>
            </section>
          );
        })}
      </div>
    </div>
  );
}
