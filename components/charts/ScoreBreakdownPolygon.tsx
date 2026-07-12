"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const SHORT_LABELS: Record<string, string> = {
  price: "Price",
  direct: "Directness",
  time: "Duration",
  cabin: "Cabin",
  airline: "Airline",
  baggage: "Baggage",
  dayBonus: "Preferred Day",
};

const chartConfig = {
  score: { label: "Contribution", color: "var(--accent)" },
} satisfies ChartConfig;

export function ScoreBreakdownPolygon({
  breakdown,
  className,
}: {
  breakdown: Record<string, number>;
  className?: string;
}) {
  // Construct data using shorter labels for the polygon axis
  const data = Object.entries(breakdown)
    .filter(([key]) => key in SHORT_LABELS)
    .map(([key, value]) => ({
      dimension: SHORT_LABELS[key],
      score: Math.round(value * 1000) / 1000,
    }));

  return (
    <ChartContainer config={chartConfig} className={cn("h-[240px] w-full max-w-[360px] mx-auto", className)}>
      <RadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 500 }}
        />
        <PolarGrid stroke="var(--border-default)" />
        <Radar
          name="Contribution"
          dataKey="score"
          fill="var(--accent)"
          fillOpacity={0.25}
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <PolarRadiusAxis
          domain={[0, 1]}
          ticks={[0.25, 0.5, 0.75, 1.0] as unknown as Parameters<typeof PolarRadiusAxis>[0]["ticks"]}
          angle={45}
          tick={false}
          axisLine={false}
        />
      </RadarChart>
    </ChartContainer>
  );
}
