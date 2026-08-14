import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="mb-2 text-sm font-medium text-indigo-600">404</p>
        <h1 className="mb-3 text-2xl font-bold text-zinc-900">Stock not found</h1>
        <p className="mb-8 max-w-md text-sm text-zinc-600">
          We couldn&apos;t find data for that symbol. Try searching with the
          company name or an NSE ticker like TCS or RELIANCE.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Back to search
        </Link>
      </main>
    </>
  );
}
