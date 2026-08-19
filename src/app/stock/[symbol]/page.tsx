import Link from "next/link";
import { notFound } from "next/navigation";
import { FinancialChart } from "@/components/FinancialChart";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { PriceChart } from "@/components/PriceChart";
import { SearchBar } from "@/components/SearchBar";
import {
  formatChange,
  formatChangePercent,
  formatCompactCurrency,
  formatPrice,
} from "@/lib/format";
import { decodeSymbol, getStockDetail } from "@/lib/yahoo";
import type { StockDetail, StockObservation, TrendDirection } from "@/types/stock";

interface StockPageProps {
  params: Promise<{ symbol: string }>;
}

async function fetchStock(symbol: string): Promise<StockDetail | null> {
  try {
    return await getStockDetail(symbol);
  } catch {
    return null;
  }
}

function truncateSummary(text: string, maxLength = 320): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function toneClasses(type: StockObservation["type"]): string {
  if (type === "positive") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (type === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

function trendClasses(direction: TrendDirection): string {
  if (direction === "Increasing") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (direction === "Declining") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

export async function generateMetadata({ params }: StockPageProps) {
  const { symbol: rawSymbol } = await params;
  const stock = await fetchStock(decodeSymbol(rawSymbol));

  if (!stock) {
    return { title: "Stock Not Found | Stock Tank" };
  }

  return {
    title: `${stock.name} (${stock.symbol}) | Stock Tank`,
    description: stock.summary
      ? truncateSummary(stock.summary, 160)
      : `View key ratios and price trends for ${stock.name}.`,
  };
}

export default async function StockPage({ params }: StockPageProps) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeSymbol(rawSymbol);
  const stock = await fetchStock(symbol);

  if (!stock) {
    notFound();
  }

  const isPositive = (stock.change ?? 0) >= 0;
  const latestQuarter = stock.financials.quarterly.at(-1);
  const latestYear = stock.financials.yearly.at(-1);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8">
          <SearchBar />
        </div>

        <nav className="sticky top-[73px] z-40 mb-8 flex gap-2 overflow-x-auto border-b border-zinc-200 bg-zinc-50/95 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
          {[
            ["Overview", "#overview"],
            ["Financials", "#financials"],
            ["Trends", "#trends"],
            ["Insights", "#insights"],
            ["Discover", "/discover"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-indigo-300"
            >
              {label}
            </a>
          ))}
        </nav>

        <section id="overview" className="mb-10 scroll-mt-36">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {stock.symbol}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
                {stock.name}
              </h1>
              {(stock.sector || stock.industry) && (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {[stock.sector, stock.industry].filter(Boolean).join(" - ")}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {formatPrice(stock.price)}
              </p>
              {stock.change != null && stock.changePercent != null && (
                <p
                  className={`mt-1 text-sm font-medium ${
                    isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatChange(stock.change)} ({formatChangePercent(stock.changePercent)})
                </p>
              )}
              {stock.marketCap && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Mkt Cap: {stock.marketCap}
                </p>
              )}
            </div>
          </div>

          <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Company Information
            </h2>
            {stock.summary ? (
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {truncateSummary(stock.summary)}
              </p>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Business summary unavailable for this stock.
              </p>
            )}
            {(stock.sector || stock.industry) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {stock.sector && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {stock.sector}
                  </span>
                )}
                {stock.industry && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {stock.industry}
                  </span>
                )}
              </div>
            )}
          </div>

          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Key Ratios
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stock.metrics.map((metric) => (
              <MetricCard
                key={metric.key}
                label={metric.label}
                value={metric.value}
                tooltip={metric.tooltip}
              />
            ))}
          </div>
        </section>

        <section id="financials" className="mb-10 scroll-mt-36 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Financials
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Revenue and net profit from the latest available reports.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-right text-sm">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Latest Quarter Sales</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCompactCurrency(latestQuarter?.revenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Latest Quarter Profit</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCompactCurrency(latestQuarter?.profit)}
                </p>
              </div>
            </div>
          </div>
          <FinancialChart quarterly={stock.financials.quarterly} yearly={stock.financials.yearly} />
          {latestYear && (
            <div className="mt-5 grid gap-3 border-t border-zinc-200 pt-5 text-sm sm:grid-cols-3 dark:border-zinc-800">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Latest Year</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{latestYear.label}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Yearly Sales</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCompactCurrency(latestYear.revenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Yearly Profit</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCompactCurrency(latestYear.profit)}
                </p>
              </div>
            </div>
          )}
        </section>

        <section id="trends" className="mb-10 scroll-mt-36">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Trends
          </h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {stock.trends.map((trend) => (
              <div
                key={trend.label}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{trend.label}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${trendClasses(trend.direction)}`}>
                    {trend.direction}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {trend.description}
                </p>
              </div>
            ))}
          </div>
          <PriceChart symbol={stock.symbol} />
        </section>

        <section id="insights" className="scroll-mt-36 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Insights
          </h2>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {stock.verdicts.map((verdict) => (
              <div key={verdict.title} className={`rounded-lg border p-4 ${toneClasses(verdict.type)}`}>
                <p className="text-sm font-semibold">{verdict.title}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">{verdict.description}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Auto Observations
              </h3>
              <div className="space-y-3">
                {stock.observations.map((observation) => (
                  <div key={observation.title} className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {observation.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {observation.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Red Flags
              </h3>
              {stock.redFlags.length > 0 ? (
                <div className="space-y-3">
                  {stock.redFlags.map((flag) => (
                    <div key={flag.title} className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      <p className="text-sm font-semibold">{flag.title}</p>
                      <p className="mt-1 text-sm opacity-90">{flag.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    No major red flags found
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Based on profit and debt checks available in the current data.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to search
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
