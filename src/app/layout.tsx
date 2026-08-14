import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Stock Tank | Simple Stock Insights for Long-Term Investors",
    template: "%s | Stock Tank",
  },
  description:
    "A clean, beginner-friendly stock analysis platform for Indian equities. Search stocks, view key ratios, and analyze long-term trends.",
  keywords: ["stock analysis", "Indian stocks", "NSE", "BSE", "investing", "FinFuse"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
