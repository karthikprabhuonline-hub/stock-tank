import Link from "next/link";
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
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-indigo-600">
              FinFuse presents
            </p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Stock Tank
            </h1>
            <p className="mb-10 text-lg text-zinc-600">
              Understand any Indian stock in seconds — key ratios, price trends,
              and plain-English summaries for long-term investors.
            </p>
            <SearchBar autoFocus size="large" />
            <p className="mt-3 text-xs text-zinc-400">
              Tip: Type a name like &ldquo;Reliance&rdquo; or ticker like &ldquo;TCS&rdquo;
            </p>
          </div>

          <div className="mt-16 w-full max-w-2xl">
            <h2 className="mb-4 text-center text-sm font-medium text-zinc-500">
              Popular stocks
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_STOCKS.map((stock) => (
                <Link
                  key={stock.symbol}
                  href={`/stock/${encodeURIComponent(stock.symbol)}`}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {stock.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white py-12">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
            {[
              {
                title: "Clarity first",
                desc: "Only the metrics that matter — PE, EPS, ROE, and more with beginner-friendly tooltips.",
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
                <h3 className="mb-2 font-semibold text-zinc-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400">
        Stock Tank by FinFuse · For educational purposes · Not financial advice
      </footer>
    </>
  );
}
