const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return inrFormatter.format(value);
}

export function formatMarketCap(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  return `₹${compactFormatter.format(value)}`;
}

export function formatCompactCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `₹${compactFormatter.format(value)}`;
}

export function formatRatio(
  value: number | null | undefined,
  suffix = ""
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${numberFormatter.format(value)}${suffix}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${numberFormatter.format(value * 100)}%`;
}

export function formatChange(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${numberFormatter.format(value)}`;
}

export function formatChangePercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${numberFormatter.format(value)}%`;
}
