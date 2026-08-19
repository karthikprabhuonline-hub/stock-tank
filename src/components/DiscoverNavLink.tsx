"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DiscoverNavLink() {
  const pathname = usePathname();
  const active = pathname === "/discover";

  return (
    <Link
      href="/discover"
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-indigo-300"
      }`}
    >
      Discover
    </Link>
  );
}
