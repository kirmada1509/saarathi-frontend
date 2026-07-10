"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Stack, Text, Card, Badge, EmptyState } from "@/components/ui/primitives";
import { HelpCircle, AlertCircle, Sparkles, Plane, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiCityLeg } from "@/core/types";

export function VerdictCard() {
  const { response, legResponse, loading, legLoading } = useStore();

  const activeResponse = response?.mode === "multi-city" ? legResponse : response;

  if (loading || (response?.mode === "multi-city" && (!activeResponse || legLoading))) {
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
        title="No Search Active"
        description="Select a traveler profile or enter a custom query to start the recommendation analysis."
        icon={<Plane className="w-12 h-12 text-text-secondary opacity-40 animate-pulse" />}
      />
    );
  }

  if (!activeResponse) return null;

  const { verdict, confidence, explanation } = activeResponse;
  const mode = response.mode;
  const itinerary = response.itinerary;

  if (!verdict) {
    return (
      <EmptyState
        title="Zero Matching Flights Found"
        description="No flights in the inventory matched this traveler's strict constraints (layover limits, direct flights, cabin tiers, or date windows). Refer to the Decision Boundaries panel below to relax constraints."
        icon={<AlertCircle className="w-12 h-12 text-signal-negative" />}
        className="border-signal-negative/20"
      />
    );
  }

  // Determine badge colors for confidence tiers
  const tierColors: Record<string, "success" | "warning" | "destructive" | "default"> = {
    high: "success",
    medium: "warning",
    low: "destructive",
  };

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: verdict.currency || "USD",
    maximumFractionDigits: 0,
  }).format(verdict.price);

  const durationStr = `${Math.floor(verdict.duration_minutes / 60)}h ${verdict.duration_minutes % 60}m`;
  const layoverStr = verdict.stops === 0 ? "Nonstop" : `${verdict.stops} stop (${verdict.layover_airports}, ${verdict.layover_minutes}m layover)`;

  return (
    <Stack gap={4} className="w-full">
      <Card className="bg-bg-surface border-border-default relative overflow-hidden">
        {/* Amber left accent line */}
        <span className="absolute top-0 left-0 w-1.5 h-full bg-accent" />

        <Stack gap={4} className="pl-2">
          {/* Header Row: Flight ID, Mode, and Confidence Badge */}
          <Stack direction="row" align="center" justify="between" className="flex-wrap gap-2">
            <Stack direction="row" align="center" gap={2}>
              <Badge variant="warning">{mode === "multi-city" ? "Multi-City Itinerary" : "Optimal Pick"}</Badge>
              <Text variant="mono" size="xs" className="text-text-secondary">
                {verdict.airline_code} {verdict.flight_numbers} | {verdict.cabin_class}
              </Text>
            </Stack>

            {/* Confidence Badge with popover description */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-help select-none bg-transparent border-none p-0 flex items-center gap-1.5 focus:outline-none">
                  <Badge variant={tierColors[confidence.tier]}>
                    {confidence.tier.toUpperCase()} CONFIDENCE ({confidence.matchPct}% Match)
                  </Badge>
                  <HelpCircle className="w-3.5 h-3.5 text-text-secondary hover:text-accent transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-bg-surface-raised border border-border-default p-3 max-w-sm rounded-md shadow-lg">
                  <Stack gap={2}>
                    <Text variant="heading" size="sm" className="text-accent">
                      Confidence Score Breakdown
                    </Text>
                    <Text variant="body" size="xs" className="text-text-secondary">
                      Calculated relative to the maximum achievable score ({confidence.matchPct}% agreement).
                    </Text>
                    
                    <Stack gap={1} className="pt-1">
                      <Text variant="body" size="xs" className="font-semibold text-signal-positive flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Strong Signals:
                      </Text>
                      {confidence.strongSignals.length > 0 ? (
                        <Text variant="mono" size="xs" className="pl-4 text-text-primary">
                          {confidence.strongSignals.join(", ")}
                        </Text>
                      ) : (
                        <Text variant="subtext" size="xs" className="pl-4">None</Text>
                      )}

                      <Text variant="body" size="xs" className="font-semibold text-text-secondary flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-text-secondary" /> Weak/Conflicting:
                      </Text>
                      {confidence.weakSignals.length > 0 ? (
                        <Text variant="mono" size="xs" className="pl-4 text-text-primary">
                          {confidence.weakSignals.join(", ")}
                        </Text>
                      ) : (
                        <Text variant="subtext" size="xs" className="pl-4">None</Text>
                      )}
                    </Stack>
                  </Stack>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Stack>

          {/* Body: Two columns layout */}
          <Stack className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Column 1: Flight Card (lg:span-3) */}
            <Stack gap={4} className="lg:col-span-3 bg-bg-surface-raised/40 border border-border-default rounded-md p-4">
              <Stack direction="row" align="center" justify="between">
                <Text variant="heading" size="lg" className="text-text-primary font-bold">
                  {verdict.airline_name}
                </Text>
                <Text variant="mono" size="xl" className="text-accent font-bold">
                  {formattedPrice}
                </Text>
              </Stack>

              {/* Itinerary Timeline */}
              <Stack direction="row" align="center" justify="between" className="bg-bg-surface-raised/60 p-3 rounded border border-border-default/50">
                <Stack align="start">
                  <Text variant="mono" size="lg" weight="bold">{verdict.origin}</Text>
                  <Text variant="subtext" size="xs">{verdict.origin_city}</Text>
                  <Text variant="mono" size="xs" className="text-accent mt-1">
                    {new Date(verdict.departure_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text variant="subtext" size="xs">
                    {new Date(verdict.departure_utc).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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
                    {new Date(verdict.arrival_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text variant="subtext" size="xs" className="text-right">
                    {new Date(verdict.arrival_utc).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </Stack>
              </Stack>

              {/* Additional specs (refundable, baggage, aircraft) */}
              <Stack direction="row" gap={3} className="flex-wrap text-xs text-text-secondary">
                <Badge variant={verdict.refundable ? "success" : "default"}>
                  {verdict.refundable ? "Refundable" : "Non-Refundable"}
                </Badge>
                <Badge variant={verdict.baggage_included ? "success" : "default"}>
                  {verdict.baggage_included ? "Baggage Included" : "Bags Extra"}
                </Badge>
                {verdict.on_time_performance && (
                  <Text variant="mono" size="xs">OTP: {Math.round(verdict.on_time_performance * 100)}%</Text>
                )}
                <Text variant="mono" size="xs">Aircraft: {verdict.aircraft_type}</Text>
              </Stack>

              {/* Multi-city legs summary if relevant */}
              {mode === "multi-city" && itinerary && (
                <Stack gap={1} className="border-t border-border-default pt-3 mt-1">
                  <Text variant="heading" size="xs" className="text-accent font-semibold">
                    Complete Routing Order ({itinerary.legs.length} legs)
                  </Text>
                  <Stack gap={1} className="pl-2 pt-1 font-mono text-xs text-text-secondary">
                    {itinerary.legs.map((l: MultiCityLeg, index: number) => (
                      <Text key={l.flight.flight_id} variant="mono" size="xs" className="flex items-center gap-2">
                        <span className="text-accent">{index + 1}.</span> {l.from} ➔ {l.to} ({l.flight.airline_name} {l.flight.flight_numbers}, {l.flight.cabin_class})
                      </Text>
                    ))}
                  </Stack>
                </Stack>
              )}
            </Stack>

            {/* Column 2: AI Description (lg:span-2) */}
            <Stack gap={3} className="lg:col-span-2">
              <Stack direction="row" align="center" gap={2} className="text-accent">
                <Sparkles className="w-4 h-4 text-accent fill-accent/20" />
                <Text variant="heading" size="base" className="font-semibold text-accent">
                  AI Rationale Justification
                </Text>
              </Stack>
              <Stack className="bg-bg-surface-raised/20 border border-border-default rounded-md p-4 h-full overflow-y-auto max-h-[220px]">
                <Text variant="body" size="sm" className="leading-relaxed text-text-primary/95 whitespace-pre-wrap">
                  {explanation}
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
