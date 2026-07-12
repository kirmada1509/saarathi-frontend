"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { InferredPreference } from "@/core/types";

const chartConfig = {
  weight: { label: "Weight", color: "var(--accent)" },
} satisfies ChartConfig;

export function PreferenceRadar({
  preference,
  className,
}: {
  preference: InferredPreference;
  className?: string;
}) {
  const data = [
    { dimension: "Direct", weight: Math.round(preference.direct_weight * 100) },
    { dimension: "Cost", weight: Math.round(preference.cost_weight * 100) },
    { dimension: "Convenience", weight: Math.round(preference.convenience_weight * 100) },
  ];

  return (
    <ChartContainer config={chartConfig} className={cn("h-[200px] w-full", className)}>
      <RadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
        <PolarGrid stroke="var(--border-default)" />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="weight"
          fill="var(--accent)"
          fillOpacity={0.35}
          stroke="var(--accent)"
          strokeWidth={2}
        />
      </RadarChart>
    </ChartContainer>
  );
}
