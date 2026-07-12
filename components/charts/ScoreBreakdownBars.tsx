"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// Real keys emitted by ranking.ts's breakdown object — each is already the
// *weighted contribution* to the final score, not a raw 0-1 sub-score.
const LABELS: Record<string, string> = {
  price: "Fare price contribution",
  direct: "Direct route contribution",
  time: "Duration contribution",
  cabin: "Cabin match contribution",
  airline: "Airline loyalty contribution",
  baggage: "Baggage contribution",
  dayBonus: "Preferred-day bonus",
};

const chartConfig = { score: { label: "Contribution", color: "var(--accent)" } } satisfies ChartConfig;

export function ScoreBreakdownBars({
  breakdown,
  className,
}: {
  breakdown: Record<string, number>;
  className?: string;
}) {
  const data = Object.entries(breakdown)
    .filter(([key]) => key in LABELS)
    .map(([key, value]) => ({ dimension: LABELS[key], score: Math.round(value * 1000) / 1000 }));

  return (
    <ChartContainer config={chartConfig} className={cn("h-[160px] w-full", className)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--border-default)" />
        <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
        <YAxis
          dataKey="dimension"
          type="category"
          width={130}
          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="score" fill="var(--accent)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
