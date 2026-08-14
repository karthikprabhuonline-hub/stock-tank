import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { POPULAR_STOCKS } from "@/lib/yahoo";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24">
          <div className="w-full max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              FinFuse presents
            </p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-100">
              Stock Tank
            </h1>
            <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-300">
              Understand any Indian stock in seconds - key ratios, price trends,
              and plain-English summaries for long-term investors.
            </p>
            <a
              href="http://tinyurl.com/finfuse"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-8 inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
            >
              Learn long-term investing with FinFuse
            </a>
            <SearchBar autoFocus size="large" />
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              Tip: Type a name like &ldquo;Reliance&rdquo; or ticker like &ldquo;TCS&rdquo;
            </p>
          </div>

          <div className="mt-16 w-full max-w-2xl">
            <h2 className="mb-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Popular stocks
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_STOCKS.map((stock) => (
                <Link
                  key={stock.symbol}
                  href={`/stock/${encodeURIComponent(stock.symbol)}`}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                >
                  {stock.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
            {[
              {
                title: "Clarity first",
                desc: "Only the metrics that matter - PE, EPS, ROE, and more with beginner-friendly tooltips.",
              },
              {
                title: "Long-term view",
                desc: "1Y, 3Y, and 5Y price charts to spot trends without day-trading noise.",
              },
              {
                title: "Indian equities",
                desc: "Search NSE and BSE stocks by name or ticker. Data proxied securely via our backend.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center sm:text-left">
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
