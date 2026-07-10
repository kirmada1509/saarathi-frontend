"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Stack, Text, Card, Clickable } from "@/components/ui/primitives";
import { Compass, ArrowRight } from "lucide-react";
import { MultiCityLeg } from "@/core/types";

export function ItineraryTimeline() {
  const { response, selectedLegIndex, selectLeg, legLoading } = useStore();

  if (!response || response.mode !== "multi-city" || !response.itinerary) {
    return null;
  }

  const { itinerary } = response;

  const formattedTotalPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: itinerary.legs[0]?.flight.currency || "USD",
    maximumFractionDigits: 0,
  }).format(itinerary.totalPrice);

  const totalHours = Math.floor(itinerary.totalDurationMinutes / 60);
  const totalMins = itinerary.totalDurationMinutes % 60;

  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack gap={4}>
        {/* Header Summary */}
        <Stack direction="row" align="center" justify="between" className="border-b border-border-default/40 pb-3 flex-wrap gap-3">
          <Stack direction="row" align="center" gap={2}>
            <Compass className="w-5 h-5 text-accent animate-spin-slow" />
            <Text variant="heading" size="lg" className="text-text-primary font-bold">
              Multi-City Route Sequence
            </Text>
          </Stack>
          <Stack direction="row" gap={3} className="text-xs font-mono">
            <Text variant="mono">Total Tour Price: <span className="text-accent font-bold">{formattedTotalPrice}</span></Text>
            <Text variant="mono" className="text-text-secondary">|</Text>
            <Text variant="mono">Total Flight Time: <span className="text-text-primary font-bold">{totalHours}h {totalMins}m</span></Text>
          </Stack>
        </Stack>

        {/* Horizontal Leg Selector timeline */}
        <Stack direction="row" gap={3} className="overflow-x-auto pb-1 flex-nowrap w-full">
          {itinerary.legs.map((leg: MultiCityLeg, index: number) => {
            const isActive = index === selectedLegIndex;
            return (
              <Clickable
                key={leg.flight.flight_id}
                onClick={() => selectLeg(index)}
                className={`flex-1 min-w-[200px] text-left p-4 rounded-md border transition-all cursor-pointer focus:outline-none relative ${
                  isActive
                    ? "bg-accent/10 border-accent shadow-md scale-[1.01]"
                    : "bg-bg-surface-raised/20 border-border-default hover:border-accent/40"
                }`}
              >
                {/* Active Indicator Pin */}
                {isActive && (
                  <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-accent animate-ping" />
                )}

                <Stack gap={2}>
                  {/* Leg Header label */}
                  <Stack direction="row" justify="between" align="center">
                    <Text variant="mono" size="xs" className="text-accent font-bold uppercase tracking-wider">
                      LEG {index + 1}
                    </Text>
                    <Text variant="mono" size="xs" className="text-text-secondary font-semibold">
                      ${leg.flight.price}
                    </Text>
                  </Stack>

                  {/* Route airports */}
                  <Stack direction="row" align="center" gap={2} className="font-mono text-sm font-bold">
                    <Text variant="mono" size="base">{leg.from}</Text>
                    <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-60" />
                    <Text variant="mono" size="base">{leg.to}</Text>
                  </Stack>

                  {/* Flight code & Duration */}
                  <Stack direction="row" justify="between" align="center" className="text-xs text-text-secondary">
                    <Text variant="mono" size="xs">
                      {leg.flight.airline_code} {leg.flight.flight_numbers}
                    </Text>
                    <Text variant="mono" size="xs">
                      {Math.floor(leg.flight.duration_minutes / 60)}h {leg.flight.duration_minutes % 60}m
                    </Text>
                  </Stack>
                </Stack>
              </Clickable>
            );
          })}
        </Stack>

        {legLoading && (
          <Stack direction="row" align="center" gap={2} className="text-xs text-accent font-mono animate-pulse">
            <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
            <Text variant="mono" size="xs">Loading leg details...</Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
