export default function StockLoading() {
  return (
    <main className="mx-auto max-w-5xl flex-1 animate-pulse px-4 py-8 sm:px-6">
      <div className="mb-8 h-10 rounded-lg bg-zinc-200" />
      <div className="mb-8 space-y-3">
        <div className="h-4 w-24 rounded bg-zinc-200" />
        <div className="h-10 w-80 max-w-full rounded bg-zinc-200" />
        <div className="h-4 w-48 rounded bg-zinc-200" />
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-200" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-zinc-200" />
    </main>
  );
}
