"use client";

interface MetricCardProps {
  label: string;
  value: string;
  tooltip: string;
}

export function MetricCard({ label, value, tooltip }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
        <span
          className="group relative inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-black bg-zinc-100 text-[10px] font-bold text-zinc-700 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
          tabIndex={0}
          aria-label={`About ${label}`}
        >
          i
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {tooltip}
          </span>
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
