"use client";

import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { Stack, Text, Badge, Card, Clickable } from "@/components/ui/primitives";
import {
  Plane, ChevronDown, ChevronUp,
  Clock, Banknote, Luggage, ShieldCheck, Armchair
} from "lucide-react";
import type { MultiCityLeg, RecommendResponse, ScoredFlight } from "@/core/types";

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

interface LegDetailCardProps {
  flight: ScoredFlight;
  from: string;
  to: string;
  legIndex: number;
  isActive: boolean;
  onClick: () => void;
}

function LegDetailCard({ flight, from, to, legIndex, isActive, onClick }: LegDetailCardProps) {
  const [expanded, setExpanded] = useState(false);

  const layoverStr =
    flight.stops === 0
      ? "Nonstop"
      : `${flight.stops} stop · via ${flight.layover_airports} · ${flight.layover_minutes}m`;

  return (
    <Stack gap={0} className="relative">
      {/* Vertical connector line (before leg) */}
      {legIndex > 0 && (
        <Stack align="center" className="py-2" gap={0}>
          <span className="w-px h-8 bg-border-default block" />
        </Stack>
      )}

      {/* City node */}
      <Stack direction="row" align="center" gap={4}>
        <Stack align="center" gap={0} className="w-10 shrink-0">
          <span className={`w-3 h-3 rounded-full border-2 ${isActive ? "bg-accent border-accent" : "bg-bg-surface border-border-default"} block`} />
        </Stack>
        <Text variant="mono" size="lg" weight="bold" className={isActive ? "text-accent" : "text-text-primary"}>
          {from}
        </Text>
        <Text variant="subtext" size="xs" className="text-text-secondary">
          {fmtDate(flight.departure_utc)} · {fmtTime(flight.departure_utc)}
        </Text>
      </Stack>

      {/* Flight segment */}
      <Stack direction="row" align="stretch" gap={4}>
        {/* Vertical line in left column */}
        <Stack align="center" className="w-10 shrink-0 py-1" gap={0}>
          <span className="w-px flex-1 bg-border-default block min-h-[60px]" />
        </Stack>

        {/* Flight card */}
        <Stack className="flex-1 py-3" gap={0}>
          <Clickable
            onClick={() => {
              setExpanded(!expanded);
              onClick();
            }}
            className="w-full text-left focus:outline-none"
          >
            <Stack
              className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                isActive
                  ? "border-accent/40 bg-accent/3 shadow-sm"
                  : "border-border-default bg-bg-surface hover:border-accent/30 hover:bg-bg-surface-raised/30"
              }`}
              gap={3}
            >
              {/* Header row */}
              <Stack direction="row" align="center" justify="between" gap={3}>
                <Stack direction="row" align="center" gap={2}>
                  <Plane className="w-4 h-4 text-accent" />
                  <Text variant="heading" size="sm" className="text-text-primary font-semibold">
                    {flight.airline_name}
                  </Text>
                  <Text variant="mono" size="xs" className="text-text-secondary">
                    {flight.airline_code} {flight.flight_numbers}
                  </Text>
                </Stack>
                <Stack direction="row" align="center" gap={2}>
                  <Text variant="mono" size="base" weight="bold" className="text-accent">
                    {fmt(flight.price, flight.currency)}
                  </Text>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  )}
                </Stack>
              </Stack>

              {/* Route mini-display */}
              <Stack direction="row" align="center" justify="between" gap={4}>
                <Stack gap={0} align="start">
                  <Text variant="mono" size="xl" weight="bold">{from}</Text>
                  <Text variant="mono" size="sm" className="text-accent">{fmtTime(flight.departure_utc)}</Text>
                </Stack>
                <Stack align="center" gap={1} className="flex-1 min-w-0 px-3">
                  <Text variant="mono" size="xs" className="text-text-secondary">{fmtDur(flight.duration_minutes)}</Text>
                  <span className="w-full block border-t border-dashed border-border-default" />
                  <Text variant="subtext" size="xs" className="font-mono text-center truncate">{layoverStr}</Text>
                </Stack>
                <Stack gap={0} align="end">
                  <Text variant="mono" size="xl" weight="bold">{to}</Text>
                  <Text variant="mono" size="sm" className="text-accent">{fmtTime(flight.arrival_utc)}</Text>
                </Stack>
              </Stack>
            </Stack>
          </Clickable>

          {/* Expandable details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <Stack
                  className="mt-2 border border-border-default rounded-xl p-4 bg-bg-surface-raised/30"
                  gap={4}
                >
                  <Stack className="grid grid-cols-2 sm:grid-cols-3 gap-4" gap={0}>
                    <Stack gap={1}>
                      <Stack direction="row" align="center" gap={1}>
                        <Armchair className="w-3.5 h-3.5 text-text-secondary" />
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider">Cabin</Text>
                      </Stack>
                      <Text variant="mono" size="sm" weight="bold">{flight.cabin_class}</Text>
                    </Stack>
                    <Stack gap={1}>
                      <Stack direction="row" align="center" gap={1}>
                        <Plane className="w-3.5 h-3.5 text-text-secondary" />
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider">Aircraft</Text>
                      </Stack>
                      <Text variant="mono" size="sm" weight="bold">{flight.aircraft_type}</Text>
                    </Stack>
                    <Stack gap={1}>
                      <Stack direction="row" align="center" gap={1}>
                        <Clock className="w-3.5 h-3.5 text-text-secondary" />
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider">Duration</Text>
                      </Stack>
                      <Text variant="mono" size="sm" weight="bold">{fmtDur(flight.duration_minutes)}</Text>
                    </Stack>
                    <Stack gap={1}>
                      <Stack direction="row" align="center" gap={1}>
                        <Banknote className="w-3.5 h-3.5 text-text-secondary" />
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider">Fare</Text>
                      </Stack>
                      <Text variant="mono" size="sm" weight="bold" className="text-accent">
                        {fmt(flight.price, flight.currency)}
                      </Text>
                    </Stack>
                    <Stack gap={1}>
                      <Stack direction="row" align="center" gap={1}>
                        <Luggage className="w-3.5 h-3.5 text-text-secondary" />
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider">Baggage</Text>
                      </Stack>
                      <Badge variant={flight.baggage_included ? "success" : "default"} className="w-fit">
                        {flight.baggage_included ? "Included" : "Extra cost"}
                      </Badge>
                    </Stack>
                    <Stack gap={1}>
                      <Stack direction="row" align="center" gap={1}>
                        <ShieldCheck className="w-3.5 h-3.5 text-text-secondary" />
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider">Refundable</Text>
                      </Stack>
                      <Badge variant={flight.refundable ? "success" : "default"} className="w-fit">
                        {flight.refundable ? "Yes" : "No"}
                      </Badge>
                    </Stack>
                  </Stack>
                  {flight.stops > 0 && (
                    <Stack className="border-t border-border-default pt-3" gap={1}>
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider font-semibold">Layover</Text>
                      <Text variant="mono" size="xs">
                        {flight.layover_airports} · {flight.layover_minutes}m connection time
                      </Text>
                    </Stack>
                  )}
                  {flight.on_time_performance != null && (
                    <Stack className="border-t border-border-default pt-3" gap={1}>
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider font-semibold">On-time performance</Text>
                      <Text variant="mono" size="sm" weight="bold">
                        {Math.round(flight.on_time_performance * 100)}%
                      </Text>
                    </Stack>
                  )}
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </Stack>
    </Stack>
  );
}

// Single-leg journey view (non-multi-city)
function SingleLegView({ verdict }: { verdict: ScoredFlight }) {
  const [expanded, setExpanded] = useState(false);
  const layoverStr =
    verdict.stops === 0
      ? "Nonstop"
      : `${verdict.stops} stop · via ${verdict.layover_airports} · ${verdict.layover_minutes}m`;

  return (
    <Stack gap={0}>
      {/* Origin node */}
      <Stack direction="row" align="center" gap={4}>
        <Stack align="center" gap={0} className="w-10 shrink-0">
          <span className="w-3 h-3 rounded-full border-2 bg-accent border-accent block" />
        </Stack>
        <Text variant="mono" size="lg" weight="bold" className="text-accent">{verdict.origin}</Text>
        <Text variant="subtext" size="xs" className="text-text-secondary">{verdict.origin_city}</Text>
        <Text variant="subtext" size="xs" className="text-text-secondary ml-auto">
          {fmtDate(verdict.departure_utc)} · {fmtTime(verdict.departure_utc)}
        </Text>
      </Stack>

      {/* Segment */}
      <Stack direction="row" align="stretch" gap={4}>
        <Stack align="center" className="w-10 shrink-0 py-1" gap={0}>
          <span className="w-px flex-1 min-h-[60px] bg-border-default block" />
        </Stack>
        <Stack className="flex-1 py-3" gap={0}>
          <Clickable
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left focus:outline-none"
          >
            <Stack
              className="border border-accent/40 bg-accent/3 rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:bg-accent/5"
              gap={3}
            >
              <Stack direction="row" align="center" justify="between" gap={3}>
                <Stack direction="row" align="center" gap={2}>
                  <Plane className="w-4 h-4 text-accent" />
                  <Text variant="heading" size="sm" className="text-text-primary font-semibold">{verdict.airline_name}</Text>
                  <Text variant="mono" size="xs" className="text-text-secondary">{verdict.airline_code} {verdict.flight_numbers}</Text>
                </Stack>
                <Stack direction="row" align="center" gap={2}>
                  <Text variant="mono" size="base" weight="bold" className="text-accent">
                    {fmt(verdict.price, verdict.currency)}
                  </Text>
                  {expanded ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                </Stack>
              </Stack>
              <Stack direction="row" align="center" justify="between" gap={4}>
                <Stack gap={0} align="start">
                  <Text variant="mono" size="xl" weight="bold">{verdict.origin}</Text>
                  <Text variant="mono" size="sm" className="text-accent">{fmtTime(verdict.departure_utc)}</Text>
                </Stack>
                <Stack align="center" gap={1} className="flex-1 px-3">
                  <Text variant="mono" size="xs" className="text-text-secondary">{fmtDur(verdict.duration_minutes)}</Text>
                  <span className="w-full block border-t border-dashed border-border-default" />
                  <Text variant="subtext" size="xs" className="font-mono text-center">{layoverStr}</Text>
                </Stack>
                <Stack gap={0} align="end">
                  <Text variant="mono" size="xl" weight="bold">{verdict.destination}</Text>
                  <Text variant="mono" size="sm" className="text-accent">{fmtTime(verdict.arrival_utc)}</Text>
                </Stack>
              </Stack>
            </Stack>
          </Clickable>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Stack className="mt-2 border border-border-default rounded-xl p-4 bg-bg-surface-raised/30" gap={4}>
                  <Stack className="grid grid-cols-2 sm:grid-cols-3 gap-4" gap={0}>
                    <Stack gap={1}>
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider">Cabin</Text>
                      <Text variant="mono" size="sm" weight="bold">{verdict.cabin_class}</Text>
                    </Stack>
                    <Stack gap={1}>
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider">Aircraft</Text>
                      <Text variant="mono" size="sm" weight="bold">{verdict.aircraft_type}</Text>
                    </Stack>
                    <Stack gap={1}>
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider">Baggage</Text>
                      <Badge variant={verdict.baggage_included ? "success" : "default"} className="w-fit">
                        {verdict.baggage_included ? "Included" : "Extra"}
                      </Badge>
                    </Stack>
                    <Stack gap={1}>
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider">Refundable</Text>
                      <Badge variant={verdict.refundable ? "success" : "default"} className="w-fit">
                        {verdict.refundable ? "Yes" : "No"}
                      </Badge>
                    </Stack>
                    {verdict.on_time_performance != null && (
                      <Stack gap={1}>
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider">On-time %</Text>
                        <Text variant="mono" size="sm" weight="bold">{Math.round(verdict.on_time_performance * 100)}%</Text>
                      </Stack>
                    )}
                    <Stack gap={1}>
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider">Seats left</Text>
                      <Text variant="mono" size="sm" weight="bold">{verdict.seats_available}</Text>
                    </Stack>
                  </Stack>
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </Stack>

      {/* Destination node */}
      <Stack direction="row" align="center" gap={4}>
        <Stack align="center" gap={0} className="w-10 shrink-0">
          <span className="w-3 h-3 rounded-full border-2 bg-text-secondary border-text-secondary block" />
        </Stack>
        <Text variant="mono" size="lg" weight="bold">{verdict.destination}</Text>
        <Text variant="subtext" size="xs" className="text-text-secondary">{verdict.destination_city}</Text>
        <Text variant="subtext" size="xs" className="text-text-secondary ml-auto">
          {fmtDate(verdict.arrival_utc)} · {fmtTime(verdict.arrival_utc)}
        </Text>
      </Stack>
    </Stack>
  );
}

interface JourneyTimelineProps {
  response: RecommendResponse | null | undefined;
  activeResponse: RecommendResponse | null | undefined;
  selectedLegIndex: number;
  onSelectLeg: (index: number) => void;
  legLoading: boolean;
}

export function JourneyTimeline({ response, activeResponse, selectedLegIndex, onSelectLeg, legLoading }: JourneyTimelineProps) {
  if (!activeResponse?.verdict && !response?.itinerary) return null;

  const mode = response?.mode;
  const itinerary = response?.itinerary;
  const verdict = activeResponse?.verdict;

  const totalPrice = itinerary?.totalPrice;
  const totalDur = itinerary?.totalDurationMinutes;

  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack gap={6}>
        {/* Section header */}
        <Stack direction="row" align="center" justify="between" gap={3} className="flex-wrap">
          <Stack gap={1}>
            <Text as="h2" variant="heading" size="lg" className="text-text-primary font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {mode === "multi-city" ? "Multi-City Journey" : "Flight Itinerary"}
            </Text>
            <Text variant="subtext" size="xs">
              {mode === "multi-city" ? "Click any leg to see detailed analysis" : "Expand flight for full details"}
            </Text>
          </Stack>
          {mode === "multi-city" && itinerary && (
            <Stack direction="row" gap={4} className="text-xs">
              <Stack gap={0} align="end">
                <Text variant="subtext" size="xs" className="uppercase tracking-wider">Total fare</Text>
                <Text variant="mono" size="base" weight="bold" className="text-accent">
                  {fmt(totalPrice ?? 0)}
                </Text>
              </Stack>
              <Stack gap={0} align="end">
                <Text variant="subtext" size="xs" className="uppercase tracking-wider">Flight time</Text>
                <Text variant="mono" size="base" weight="bold">
                  {fmtDur(totalDur ?? 0)}
                </Text>
              </Stack>
            </Stack>
          )}
        </Stack>

        {legLoading && (
          <Stack direction="row" align="center" gap={2} className="text-xs text-accent font-mono">
            <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
            <Text variant="mono" size="xs">Loading leg details…</Text>
          </Stack>
        )}

        {/* Timeline */}
        {mode === "multi-city" && itinerary ? (
          <Stack gap={0}>
            {itinerary.legs.map((leg: MultiCityLeg, index: number) => (
              <LegDetailCard
                key={leg.flight.flight_id}
                flight={leg.flight}
                from={leg.from}
                to={leg.to}
                legIndex={index}
                isActive={index === selectedLegIndex}
                onClick={() => onSelectLeg(index)}
              />
            ))}
            {/* Final destination node */}
            {itinerary.legs.length > 0 && (
              <Stack direction="row" align="center" gap={4}>
                <Stack align="center" gap={0} className="w-10 shrink-0">
                  <span className="w-3 h-3 rounded-full border-2 bg-text-secondary border-text-secondary block" />
                </Stack>
                <Text variant="mono" size="lg" weight="bold">
                  {itinerary.legs[itinerary.legs.length - 1].to}
                </Text>
                <Text variant="subtext" size="xs" className="text-text-secondary ml-auto">
                  {fmtDate(itinerary.legs[itinerary.legs.length - 1].flight.arrival_utc)} ·{" "}
                  {fmtTime(itinerary.legs[itinerary.legs.length - 1].flight.arrival_utc)}
                </Text>
              </Stack>
            )}
          </Stack>
        ) : verdict ? (
          <SingleLegView verdict={verdict} />
        ) : null}
      </Stack>
    </Card>
  );
}
