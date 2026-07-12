"use client";

import React from "react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { Stack, Text, Card, Badge, EmptyState } from "@/components/ui/primitives";
import { AlertCircle, Plane } from "lucide-react";
import type { RecommendResponse, MultiCityLeg } from "@/core/types";

export function VerdictCard({
  response,
  activeResponse,
  isLoading,
}: {
  response: RecommendResponse | null | undefined;
  activeResponse: RecommendResponse | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="w-full h-[240px] flex items-center justify-center bg-bg-surface border-border-default">
        <Stack align="center" gap={3}>
          <span className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <Text variant="subtext">Running decision logic...</Text>
        </Stack>
      </Card>
    );
  }

  if (!response) {
    return (
      <EmptyState
        title="No search active"
        description="Compose a request to start the recommendation analysis."
        icon={<Plane className="w-12 h-12 text-text-secondary opacity-40" />}
      />
    );
  }

  if (!activeResponse) return null;

  const { verdict } = activeResponse;
  const mode = response.mode;
  const itinerary = response.itinerary;

  if (!verdict) {
    return (
      <EmptyState
        title="Zero matching flights found"
        description="No flights in the inventory matched this traveler's strict constraints (layover limits, direct flights, cabin tiers, or date windows). Try relaxing constraints in the Decision Boundaries panel below."
        icon={<AlertCircle className="w-12 h-12 text-signal-negative" />}
        className="border-signal-negative/30"
      />
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: verdict.currency || "USD",
    maximumFractionDigits: 0,
  }).format(verdict.price);

  const durationStr = `${Math.floor(verdict.duration_minutes / 60)}h ${verdict.duration_minutes % 60}m`;
  const layoverStr =
    verdict.stops === 0
      ? "Nonstop"
      : `${verdict.stops} stop (${verdict.layover_airports}, ${verdict.layover_minutes}m layover)`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={verdict.flight_id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Card className="bg-bg-surface border-border-default relative overflow-hidden">
          <span className="absolute top-0 left-0 w-1.5 h-full bg-accent" />

          <Stack gap={4} className="pl-2">
            <Stack direction="row" align="center" gap={2}>
              <Badge variant="warning">{mode === "multi-city" ? "Multi-City Itinerary" : "Optimal Pick"}</Badge>
              <Text variant="mono" size="xs" className="text-text-secondary">
                {verdict.airline_code} {verdict.flight_numbers} | {verdict.cabin_class}
              </Text>
            </Stack>

            <Stack className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <Stack gap={4} className="md:col-span-8 bg-bg-surface-raised/50 border border-border-default rounded-md p-4">
                <Stack direction="row" align="center" justify="between">
                  <Text variant="heading" size="lg" className="text-text-primary font-bold">
                    {verdict.airline_name}
                  </Text>
                  <Text variant="mono" size="xl" className="text-accent font-bold">
                    {formattedPrice}
                  </Text>
                </Stack>

                <Stack direction="row" align="center" justify="between" className="bg-bg-surface p-3 rounded border border-border-default">
                  <Stack align="start">
                    <Text variant="mono" size="lg" weight="bold">{verdict.origin}</Text>
                    <Text variant="subtext" size="xs">{verdict.origin_city}</Text>
                    <Text variant="mono" size="xs" className="text-accent mt-1">
                      {new Date(verdict.departure_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <Text variant="subtext" size="xs">
                      {new Date(verdict.departure_utc).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </Text>
                  </Stack>

                  <Stack align="center" gap={1} className="flex-1 px-4">
                    <Text variant="mono" size="xs" className="text-text-secondary">{durationStr}</Text>
                    <span className="block w-full h-[1px] bg-border-default relative">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                    </span>
                    <Text variant="subtext" size="xs" className="text-center font-mono">{layoverStr}</Text>
                  </Stack>

                  <Stack align="end">
                    <Text variant="mono" size="lg" weight="bold">{verdict.destination}</Text>
                    <Text variant="subtext" size="xs" className="text-right">{verdict.destination_city}</Text>
                    <Text variant="mono" size="xs" className="text-accent mt-1">
                      {new Date(verdict.arrival_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <Text variant="subtext" size="xs" className="text-right">
                      {new Date(verdict.arrival_utc).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </Text>
                  </Stack>
                </Stack>

                <Stack direction="row" gap={2} className="flex-wrap text-xs">
                  <Badge variant={verdict.refundable ? "success" : "default"}>
                    {verdict.refundable ? "Refundable" : "Non-Refundable"}
                  </Badge>
                  <Badge variant={verdict.baggage_included ? "success" : "default"}>
                    {verdict.baggage_included ? "Baggage Included" : "Bags Extra"}
                  </Badge>
                  {verdict.on_time_performance != null && (
                    <Text variant="mono" size="xs" className="self-center text-text-secondary">
                      OTP: {Math.round(verdict.on_time_performance * 100)}%
                    </Text>
                  )}
                  <Text variant="mono" size="xs" className="self-center text-text-secondary">
                    {verdict.aircraft_type}
                  </Text>
                </Stack>
              </Stack>

              <Stack gap={3} className="md:col-span-4 justify-center bg-bg-surface-raised/20 border border-border-default rounded-md p-4">
                <Text variant="heading" size="xs" className="text-text-secondary font-semibold uppercase tracking-wider">
                  Summary
                </Text>
                <div className="text-sm space-y-2 text-text-primary">
                  <div>
                    <span className="font-semibold text-text-secondary">Route:</span> {verdict.origin} → {verdict.destination}
                  </div>
                  <div>
                    <span className="font-semibold text-text-secondary">Duration:</span> {durationStr}
                  </div>
                  <div>
                    <span className="font-semibold text-text-secondary">Price:</span> {formattedPrice} total
                  </div>
                  {mode === "multi-city" && (
                    <div className="text-xs text-text-secondary border-t border-border-default/60 pt-2 mt-2">
                      Hop: {verdict.origin} to {verdict.destination}
                    </div>
                  )}
                </div>
              </Stack>
            </Stack>

            {mode === "multi-city" && itinerary && (
              <Stack gap={1} className="border-t border-border-default pt-3 mt-1">
                <Text variant="heading" size="xs" className="text-accent font-semibold">
                  Complete routing order ({itinerary.legs.length} legs)
                </Text>
                <Stack gap={1} className="pl-2 pt-1 font-mono text-xs text-text-secondary">
                  {itinerary.legs.map((l: MultiCityLeg, index: number) => (
                    <Text key={l.flight.flight_id} variant="mono" size="xs">
                      {index + 1}. {l.from} ({l.flight.origin_city}) → {l.to} ({l.flight.destination_city}) ({l.flight.airline_name} {l.flight.flight_numbers}, {l.flight.cabin_class})
                    </Text>
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
