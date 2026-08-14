"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";
import type { ChartPeriod, ChartPoint } from "@/types/stock";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  symbol: string;
}

const PERIODS: ChartPeriod[] = ["1Y", "3Y", "5Y"];

export function PriceChart({ symbol }: PriceChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>("1Y");
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/stock/${encodeURIComponent(symbol)}/chart?period=${period}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load chart");
        }

        if (!cancelled) {
          setPoints(data.chart.points);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chart");
          setPoints([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadChart();
    return () => {
      cancelled = true;
    };
  }, [symbol, period]);

  const labels = points.map((p) => {
    const date = new Date(p.date);
    return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Close Price",
        data: points.map((p) => p.close),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.08)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#18181b",
        padding: 12,
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => {
            const value = ctx.parsed.y;
            if (value == null) return "";
            return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 6, color: "#a1a1aa", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f4f4f5" },
        ticks: {
          color: "#a1a1aa",
          font: { size: 11 },
          callback: (value: string | number) =>
            `₹${Number(value).toLocaleString("en-IN")}`,
        },
      },
    },
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Price Trend</h2>
        <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-950 dark:text-indigo-300"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-72">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-zinc-900/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" />
          </div>
        )}
        {error && !loading && (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            {error}
          </div>
        )}
        {!error && !loading && points.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            No chart data available
          </div>
        )}
        {!error && points.length > 0 && <Line data={data} options={options} />}
      </div>
    </section>
  );
}
