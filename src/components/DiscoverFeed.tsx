"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function DiscoverFeed({ symbols }: DiscoverFeedProps) {
  const [stockOrder, setStockOrder] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(1);
  const [stockCache, setStockCache] = useState<StockCache>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [savedSymbol, setSavedSymbol] = useState<string | null>(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
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
    setVisibleCount(1);
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
    const sentinel = sentinelRef.current;
    const root = scrollerRef.current;
    if (!sentinel || !root || stockOrder.length === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(sentinel);
        showNextStock();
      },
      { root, threshold: 0.35 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [showNextStock, stockOrder.length, visibleCount]);

  useEffect(() => {
    visibleSymbols.forEach((symbol) => markViewed(symbol));
  }, [markViewed, visibleSymbols]);

  const canLoadMore = visibleCount < stockOrder.length;

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Discover
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            One stock at a time. Double tap to save.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowWatchlist((open) => !open)}
          className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Watchlist {watchlist.length}
        </button>
      </div>

      {showWatchlist && (
        <div className="mx-auto w-full max-w-2xl px-4 pb-3 sm:px-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            {watchlist.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
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

      <div ref={scrollerRef} className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto">
        {visibleSymbols.map((symbol) => {
          const stock = stockCache[symbol];
          const watched = watchedSet.has(symbol);

          return (
            <section
              key={symbol}
              onPointerUp={(event) => handleCardTap(symbol, event)}
              className="mx-auto flex h-full max-w-2xl snap-start snap-always flex-col px-4 py-3 sm:px-6"
            >
              <article className="flex min-h-0 flex-1 flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {stock ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/stock/${encodeURIComponent(stock.symbol)}`}
                          className="text-2xl font-bold tracking-tight text-zinc-900 transition-colors hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-300"
                        >
                          {stock.name}
                        </Link>
                        <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {stock.symbol.replace(/\.NS$/, "")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                          {formatPrice(stock.price)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Current price
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ["PE Ratio", metricValue(stock, "peRatio")],
                        ["ROE", metricValue(stock, "roe")],
                        ["Debt to Equity", metricValue(stock, "debtToEquity")],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                          <p className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                            {label}
                          </p>
                          <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-indigo-50 p-5 dark:bg-indigo-500/10">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                          Quick Insight
                        </p>
                        <button
                          type="button"
                          onClick={() => saveToWatchlist(stock.symbol)}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
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
                      <p className="text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                        {stock.discoverInsight}
                      </p>
                      {savedSymbol === stock.symbol && (
                        <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-300">
                          Added to watchlist
                        </p>
                      )}
                    </div>
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

        {canLoadMore ? (
          <div ref={sentinelRef} className="flex h-24 snap-end items-center justify-center">
            <button
              type="button"
              onClick={showNextStock}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Next Stock
            </button>
          </div>
        ) : (
          stockOrder.length > 0 && (
            <div className="flex h-24 items-center justify-center px-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You have seen all Discover stocks for now.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
