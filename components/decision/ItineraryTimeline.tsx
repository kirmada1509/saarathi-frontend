"use client";

import React from "react";
import { Stack, Text, Card, Clickable } from "@/components/ui/primitives";
import { Compass, ArrowRight } from "lucide-react";
import type { MultiCityItinerary, MultiCityLeg } from "@/core/types";

export function ItineraryTimeline({
  itinerary,
  selectedLegIndex,
  onSelectLeg,
  legLoading,
}: {
  itinerary: MultiCityItinerary;
  selectedLegIndex: number;
  onSelectLeg: (index: number) => void;
  legLoading: boolean;
}) {
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
        <Stack direction="row" align="center" justify="between" className="border-b border-border-default pb-3 flex-wrap gap-3">
          <Stack direction="row" align="center" gap={2}>
            <Compass className="w-5 h-5 text-accent" />
            <Text variant="heading" size="lg" className="text-text-primary font-bold">
              Multi-City Route Sequence
            </Text>
          </Stack>
          <Stack direction="row" gap={3} className="text-xs font-mono">
            <Text variant="mono">
              Total: <span className="text-accent font-bold">{formattedTotalPrice}</span>
            </Text>
            <Text variant="mono" className="text-text-secondary">|</Text>
            <Text variant="mono">
              Flight time: <span className="text-text-primary font-bold">{totalHours}h {totalMins}m</span>
            </Text>
          </Stack>
        </Stack>

        <Stack direction="row" gap={3} className="overflow-x-auto pb-1 flex-nowrap w-full">
          {itinerary.legs.map((leg: MultiCityLeg, index: number) => {
            const isActive = index === selectedLegIndex;
            return (
              <Clickable
                key={leg.flight.flight_id}
                onClick={() => onSelectLeg(index)}
                className={`flex-1 min-w-[200px] text-left p-4 rounded-md border transition-all cursor-pointer focus:outline-none relative ${
                  isActive
                    ? "bg-accent/10 border-accent shadow-sm"
                    : "bg-bg-surface-raised/30 border-border-default hover:border-accent/50"
                }`}
              >
                <Stack gap={2}>
                  <Stack direction="row" justify="between" align="center">
                    <Text variant="mono" size="xs" className="text-accent font-bold uppercase tracking-wider">
                      LEG {index + 1}
                    </Text>
                    <Text variant="mono" size="xs" className="text-text-secondary font-semibold">
                      ${leg.flight.price}
                    </Text>
                  </Stack>

                  <Stack direction="row" align="center" gap={2} className="font-mono text-xs font-bold flex-wrap">
                    <Text variant="mono" size="xs">{leg.from} ({leg.flight.origin_city})</Text>
                    <ArrowRight className="w-3 h-3 text-text-secondary opacity-60 flex-shrink-0" />
                    <Text variant="mono" size="xs">{leg.to} ({leg.flight.destination_city})</Text>
                  </Stack>

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
          <Stack direction="row" align="center" gap={2} className="text-xs text-accent font-mono">
            <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
            <Text variant="mono" size="xs">Loading leg details...</Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
