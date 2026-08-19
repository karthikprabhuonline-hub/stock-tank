import type { Metadata } from "next";
import { DiscoverFeed } from "@/components/DiscoverFeed";
import { DISCOVER_STOCKS } from "@/lib/discoverStocks";

export const metadata: Metadata = {
  title: "Discover | Stock Tank",
  description: "Browse quick stock snapshots and save interesting companies to your watchlist.",
};

export default function DiscoverPage() {
  return (
    <main className="h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <DiscoverFeed symbols={DISCOVER_STOCKS} />
    </main>
  );
}
