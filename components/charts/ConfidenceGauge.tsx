"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Stack, Text } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/core/types";

const TIER_COLOR: Record<Confidence["tier"], string> = {
  high: "var(--signal-positive)",
  medium: "var(--accent)",
  low: "var(--signal-negative)",
};

export function ConfidenceGauge({
  confidence,
  className,
}: {
  confidence: Confidence;
  className?: string;
}) {
  const color = TIER_COLOR[confidence.tier];
  const data = [{ name: "match", value: confidence.matchPct, fill: color }];
  const config = { match: { label: "Match", color } } satisfies ChartConfig;

  return (
    <Stack className={cn("relative mx-auto aspect-square w-full max-w-40", className)}>
      <ChartContainer config={config} className="aspect-square">
        <RadialBarChart
          data={data}
          startAngle={90}
          endAngle={90 - (360 * confidence.matchPct) / 100}
          innerRadius="72%"
          outerRadius="100%"
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar dataKey="value" background={{ fill: "var(--bg-surface-raised)" }} cornerRadius={8} />
        </RadialBarChart>
      </ChartContainer>
      <Stack align="center" justify="center" gap={0} className="absolute inset-0">
        <Text variant="mono" size="xl" weight="bold">
          {confidence.matchPct}%
        </Text>
        <Text variant="subtext" size="xs" className="uppercase tracking-wide">
          {confidence.tier}
        </Text>
      </Stack>
    </Stack>
  );
}
