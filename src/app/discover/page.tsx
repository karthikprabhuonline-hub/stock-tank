import type { Metadata } from "next";
import { DiscoverFeed } from "@/components/DiscoverFeed";
import { Header } from "@/components/Header";
import { DISCOVER_STOCKS } from "@/lib/discoverStocks";

export const metadata: Metadata = {
  title: "Discover | Stock Tank",
  description: "Browse quick stock snapshots and save interesting companies to your watchlist.",
};

export default function DiscoverPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        <DiscoverFeed symbols={DISCOVER_STOCKS} />
      </main>
    </div>
  );
}
