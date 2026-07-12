"use client";

import React from "react";
import { Stack, Text, Card, Clickable } from "@/components/ui/primitives";
import { Plane, ArrowRight, Calendar, Clock } from "lucide-react";
import type { MultiCityLeg, RecommendResponse } from "@/core/types";

function fmt(price: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function fmtDur(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function fmtTime(utc: string) {
  return new Date(utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(utc: string) {
  return new Date(utc).toLocaleDateString([], { month: "short", day: "numeric" });
}

interface JourneyTimelineProps {
  response: RecommendResponse | null | undefined;
  activeResponse: RecommendResponse | null | undefined;
  selectedLegIndex: number;
  onSelectLeg: (index: number) => void;
  legLoading: boolean;
}

export function JourneyTimeline({ response, selectedLegIndex, onSelectLeg, legLoading }: JourneyTimelineProps) {
  if (!response?.itinerary) return null;

  const itinerary = response.itinerary;
  const totalPrice = itinerary.totalPrice;
  const totalDur = itinerary.totalDurationMinutes;

  // Extract unique sequential list of airports and compile place names mapping
  const placeNames: Record<string, string> = {};
  const airports = itinerary.legs.reduce((acc: string[], leg) => {
    if (acc.length === 0) {
      acc.push(leg.from);
    }
    acc.push(leg.to);
    placeNames[leg.from] = leg.flight.origin_city;
    placeNames[leg.to] = leg.flight.destination_city;
    return acc;
  }, []);

  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack gap={5}>
        {/* High-level sequence & info bar */}
        <Stack direction="row" align="center" justify="between" gap={4} className="flex-wrap pb-4 border-b border-border-default">
          <Stack gap={1}>
            <Text as="h2" variant="heading" size="base" className="text-text-secondary uppercase tracking-wider font-bold">
              Multi-City Route Sequence
            </Text>
            {/* Horizontal Airport sequence */}
            <Stack direction="row" align="center" gap={3} className="flex-wrap pt-1.5">
              {airports.map((code, index) => (
                <React.Fragment key={index}>
                  <Stack align="center" gap={0}>
                    <Stack direction="row" align="center" gap={2}>
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      <Text variant="mono" size="lg" weight="bold" className="text-text-primary">
                        {code}
                      </Text>
                    </Stack>
                    {placeNames[code] && (
                      <Text variant="subtext" size="xs" className="text-text-secondary text-[10px] pl-3.5 mt-0.5">
                        ({placeNames[code]})
                      </Text>
                    )}
                  </Stack>
                  {index < airports.length - 1 && (
                    <span className="text-text-secondary font-bold opacity-55 self-center pb-4">→</span>
                  )}
                </React.Fragment>
              ))}
            </Stack>
          </Stack>

          {/* Pricing & Duration Summary */}
          <Stack direction="row" gap={4} className="text-xs shrink-0">
            <Stack gap={0} align="end">
              <Text variant="subtext" size="xs" className="uppercase tracking-wider">Total Itinerary Fare</Text>
              <Text variant="mono" size="base" weight="bold" className="text-accent">
                {fmt(totalPrice)}
              </Text>
            </Stack>
            <Stack gap={0} align="end">
              <Text variant="subtext" size="xs" className="uppercase tracking-wider">Total flight time</Text>
              <Text variant="mono" size="base" weight="bold">
                {fmtDur(totalDur)}
              </Text>
            </Stack>
          </Stack>
        </Stack>

        {legLoading && (
          <Stack direction="row" align="center" gap={2} className="text-xs text-accent font-mono">
            <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
            <Text variant="mono" size="xs">Loading leg details…</Text>
          </Stack>
        )}

        {/* Horizontal scrollable row of leg cards */}
        <Stack direction="row" gap={3} className="overflow-x-auto pb-2 flex-nowrap w-full scrollbar-thin">
          {itinerary.legs.map((leg: MultiCityLeg, index: number) => {
            const isActive = index === selectedLegIndex;
            const flight = leg.flight;
            return (
              <Clickable
                key={flight.flight_id}
                onClick={() => onSelectLeg(index)}
                className={`flex-1 text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none relative ${
                  isActive
                    ? "bg-accent/8 border-accent shadow-sm"
                    : "bg-bg-surface-raised/20 border-border-default hover:border-accent/40"
                }`}
              >
                <Stack gap={3}>
                  {/* Leg Badge + Price */}
                  <Stack direction="row" justify="between" align="center" gap={0}>
                    <Text variant="mono" size="xs" className="text-accent font-bold uppercase tracking-wider">
                      LEG {index + 1}
                    </Text>
                    <Text variant="mono" size="sm" weight="bold" className="text-accent">
                      {fmt(flight.price, flight.currency)}
                    </Text>
                  </Stack>

                  {/* Route sequence with city details */}
                  <Stack direction="row" align="center" justify="between" gap={2} className="font-mono text-sm font-bold">
                    <Stack direction="col" align="start" gap={0} className="items-center justify-center">
                      <Text variant="mono" size="sm">{leg.from}</Text>
                      {placeNames[leg.from] && (
                        <Text variant="subtext" size="xs" className="text-text-secondary text-[10px] pl-3.5 mt-0.5">
                          ({placeNames[leg.from]})
                        </Text>
                      )}
                    </Stack>
                    <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-60 shrink-0" />
                    <Stack direction="col" align="start" gap={0} className="items-center justify-center">
                      <Text variant="mono" size="sm">{leg.to}</Text>
                      {placeNames[leg.to] && (
                        <Text variant="subtext" size="xs" className="text-text-secondary text-[10px] pl-3.5 mt-0.5">
                          ({placeNames[leg.to]})
                        </Text>
                      )}
                    </Stack>
                  </Stack>

                  {/* Airline & flight info */}
                  <Stack direction="row" align="center" justify="center" gap={2}>
                    <Plane className="w-3.5 h-3.5 text-text-secondary" />
                    <Text variant="body" size="xs" className="text-text-primary truncate">
                      {flight.airline_name}
                    </Text>
                    <Text variant="mono" size="xs" className="text-text-secondary">
                      · {flight.airline_code} {flight.flight_numbers}
                    </Text>
                  </Stack>

                  {/* Date, departure and duration */}
                  <Stack gap={2} direction="row" justify="between" className="border-t border-border-default/60 pt-2 text-xs text-text-secondary">
                    <Stack direction="row" align="center" gap={0}>
                      <Calendar className="w-3 h-3 text-text-secondary mr-1" />
                      <Text variant="mono" size="xs">
                        {fmtDate(flight.departure_utc)} · {fmtTime(flight.departure_utc)}
                      </Text>
                    </Stack>
                    <Stack direction="row" align="center" gap={0}>
                      <Clock className="w-3 h-3 text-text-secondary mr-1" />
                      <Text variant="mono" size="xs">{fmtDur(flight.duration_minutes)} ({flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`})</Text>
                    </Stack>
                  </Stack>
                </Stack>
              </Clickable>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}
