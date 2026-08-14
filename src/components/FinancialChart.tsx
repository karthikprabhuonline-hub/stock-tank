"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { formatCompactCurrency } from "@/lib/format";
import type { FinancialPoint } from "@/types/stock";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface FinancialChartProps {
  quarterly: FinancialPoint[];
  yearly: FinancialPoint[];
}

type MetricKey = "revenue" | "profit";
type PeriodKey = "quarterly" | "yearly";

export function FinancialChart({ quarterly, yearly }: FinancialChartProps) {
  const [metric, setMetric] = useState<MetricKey>("revenue");
  const [period, setPeriod] = useState<PeriodKey>("quarterly");
  const points = period === "quarterly" ? quarterly : yearly;
  const title = metric === "revenue" ? "Revenue" : "Net Profit";

  const data = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: title,
        data: points.map((point) => point[metric] ?? 0),
        backgroundColor: metric === "revenue" ? "#4f46e5" : "#059669",
        borderRadius: 6,
        maxBarThickness: 44,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#18181b",
        padding: 12,
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            `${title}: ${formatCompactCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#71717a", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f4f4f5" },
        ticks: {
          color: "#71717a",
          font: { size: 11 },
          callback: (value: string | number) => formatCompactCurrency(Number(value)),
        },
      },
    },
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["quarterly", "yearly"] as PeriodKey[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                period === item
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-950 dark:text-indigo-300"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["revenue", "profit"] as MetricKey[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMetric(item)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                metric === item
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-950 dark:text-indigo-300"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              }`}
            >
              {item === "profit" ? "Profit" : "Revenue"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-72">
        {points.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            Financial data unavailable for this stock.
          </div>
        )}
      </div>
    </div>
  );
}
