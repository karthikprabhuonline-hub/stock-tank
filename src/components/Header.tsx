import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex flex-col">
          <span className="text-lg font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
            Stock Tank
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Investing made Easy
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="http://tinyurl.com/finfuse"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 sm:inline-flex dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
          >
            Learn investing
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
