"use client";

import React from "react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { Stack, Text, Badge, NavLink, Clickable } from "@/components/ui/primitives";
import { Sparkles, Clock, Banknote, Route, TrendingDown, PenLine } from "lucide-react";
import { ConfidenceGauge } from "@/components/charts/ConfidenceGauge";
import type { RecommendResponse, ScoredFlight } from "@/core/types";
import type { UserSummary } from "@/lib/types";

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

interface Props {
  response: RecommendResponse | null | undefined;
  activeResponse: RecommendResponse | null | undefined;
  isLoading: boolean;

  user?: UserSummary;
  onScrollToAlternatives: () => void;
}

export function ExecutiveSummary({ response, activeResponse, isLoading, user, onScrollToAlternatives }: Props) {
  if (isLoading) {
    return (
      <Stack className="rounded-2xl border border-border-default bg-bg-surface overflow-hidden">
        <Stack className="h-[280px] animate-pulse bg-bg-surface-raised/50 items-center justify-center" align="center" justify="center" gap={3}>
          <span className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <Text variant="subtext" size="sm">AI decision engine running…</Text>
        </Stack>
      </Stack>
    );
  }

  if (!activeResponse?.verdict) return null;

  const { verdict, confidence, explanation, alternatives, ranked } = activeResponse;
  const mode = response?.mode;
  const itinerary = response?.itinerary;

  // Savings vs next-best
  const runnerUp: ScoredFlight | undefined = ranked.find((f) => f.flight_id !== verdict.flight_id);
  const savingsVsNext = runnerUp ? runnerUp.price - verdict.price : null;

  const formattedPrice = fmt(verdict.price, verdict.currency);
  const durationStr = fmtDur(verdict.duration_minutes);

  // Cheapest alt
  const cheapestAlt = alternatives.find((a) => a.kind === "cheapest");

  // Short verdict: first 2-3 sentences
  const shortVerdict = explanation
    .split(/\.(\s|$)/)
    .filter(Boolean)
    .slice(0, 3)
    .join(". ")
    .trim();
  const shortVerdictDisplay = shortVerdict.endsWith(".") ? shortVerdict : shortVerdict + ".";

  const editHref = mode === "multi-city" ? "/app/multi-city" : "/app";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={verdict.flight_id + "-hero"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Stack className="rounded-2xl border border-border-default bg-bg-surface shadow-sm overflow-hidden" gap={0}>
          {/* Top accent bar */}
          <Stack className="h-1 bg-accent w-full" />

          <Stack gap={0} className="p-6 sm:p-8">
            {/* Query context */}
            <Stack direction="row" align="center" justify="between" className="mb-6 flex-wrap gap-3">
              <Stack direction="row" align="center" gap={2} className="flex-wrap">
                <Badge variant="warning">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {mode === "multi-city" ? "Multi-City Itinerary" : "AI Recommendation"}
                </Badge>
                {user && (
                  <Text variant="mono" size="xs" className="text-text-secondary">
                    {user.user_id} · {user.home_city} ({user.home_airport})
                  </Text>
                )}
              </Stack>
              <NavLink
                href={editHref}
                active={false}
                className="flex items-center gap-1.5 text-xs shrink-0 border border-border-default rounded-lg px-3 py-1.5 hover:border-accent hover:text-accent transition-all"
              >
                <PenLine className="w-3.5 h-3.5" />
                Edit request
              </NavLink>
            </Stack>

            {/* Main hero grid */}
            <Stack className="grid grid-cols-1 lg:grid-cols-12 gap-8" gap={0}>
              {/* Left: core info */}
              <Stack gap={6} className="lg:col-span-8">
                {/* Airline + route headline */}
                <Stack gap={2}>
                  <Text
                    as="h1"
                    variant="heading"
                    size="3xl"
                    className="text-text-primary leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {verdict.airline_name}
                  </Text>
                  <Stack direction="row" align="center" gap={2} className="flex-wrap">
                    <Text variant="mono" size="sm" className="text-text-secondary">
                      {verdict.airline_code} {verdict.flight_numbers}
                    </Text>
                    <span className="w-1 h-1 rounded-full bg-border-default" />
                    <Text variant="mono" size="sm" className="text-text-secondary">
                      {verdict.cabin_class}
                    </Text>
                    <span className="w-1 h-1 rounded-full bg-border-default" />
                    <Text variant="mono" size="sm" className="text-text-secondary">
                      {verdict.aircraft_type}
                    </Text>
                  </Stack>
                </Stack>

                {/* Route display */}
                <Stack className="bg-bg-surface-raised/40 border border-border-default rounded-xl p-4" gap={0}>
                  <Stack direction="row" align="center" justify="between" gap={4}>
                    {/* Origin */}
                    <Stack gap={1} align="start">
                      <Text variant="mono" size="3xl" weight="bold" className="text-text-primary leading-none">
                        {verdict.origin}
                      </Text>
                      <Text variant="subtext" size="xs" className="text-text-secondary">
                        {verdict.origin_city}
                      </Text>
                      <Text variant="mono" size="lg" className="text-accent font-bold mt-1">
                        {new Date(verdict.departure_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      <Text variant="subtext" size="xs">
                        {new Date(verdict.departure_utc).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </Text>
                    </Stack>

                    {/* Flight path indicator */}
                    <Stack align="center" gap={1} className="flex-1 px-4 min-w-0">
                      <Text variant="mono" size="xs" className="text-text-secondary">{durationStr}</Text>
                      <Stack className="w-full relative" align="center" gap={0}>
                        <span className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-dashed border-border-default" />
                        </span>
                        <Stack direction="row" align="center" gap={2} className="relative bg-transparent">
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          {verdict.stops > 0 && (
                            <Text variant="mono" size="xs" className="text-text-secondary bg-bg-surface-raised px-1.5 py-0.5 rounded border border-border-default">
                              {verdict.stops} stop
                            </Text>
                          )}
                          <span className="w-2 h-2 rounded-full bg-text-secondary" />
                        </Stack>
                      </Stack>
                      <Text variant="subtext" size="xs" className="text-center font-mono">
                        {verdict.stops === 0
                          ? "Nonstop"
                          : `via ${verdict.layover_airports}, ${verdict.layover_minutes}m layover`}
                      </Text>
                    </Stack>

                    {/* Destination */}
                    <Stack gap={1} align="end">
                      <Text variant="mono" size="3xl" weight="bold" className="text-text-primary leading-none">
                        {verdict.destination}
                      </Text>
                      <Text variant="subtext" size="xs" className="text-right text-text-secondary">
                        {verdict.destination_city}
                      </Text>
                      <Text variant="mono" size="lg" className="text-accent font-bold mt-1">
                        {new Date(verdict.arrival_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      <Text variant="subtext" size="xs" className="text-right">
                        {new Date(verdict.arrival_utc).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </Text>
                    </Stack>
                  </Stack>
                </Stack>

                {/* Key metrics row */}
                <Stack direction="row" gap={4} className="flex-wrap">
                  <Stack className="bg-bg-surface-raised/60 border border-border-default rounded-xl p-4 flex-1 min-w-[120px]" gap={1}>
                    <Stack direction="row" align="center" gap={1}>
                      <Banknote className="w-3.5 h-3.5 text-text-secondary" />
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider">Total fare</Text>
                    </Stack>
                    <Text variant="mono" size="xl" weight="bold" className="text-accent">{formattedPrice}</Text>
                  </Stack>
                  <Stack className="bg-bg-surface-raised/60 border border-border-default rounded-xl p-4 flex-1 min-w-[120px]" gap={1}>
                    <Stack direction="row" align="center" gap={1}>
                      <Clock className="w-3.5 h-3.5 text-text-secondary" />
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider">Flight time</Text>
                    </Stack>
                    <Text variant="mono" size="xl" weight="bold" className="text-text-primary">{durationStr}</Text>
                  </Stack>
                  <Stack className="bg-bg-surface-raised/60 border border-border-default rounded-xl p-4 flex-1 min-w-[120px]" gap={1}>
                    <Stack direction="row" align="center" gap={1}>
                      <Route className="w-3.5 h-3.5 text-text-secondary" />
                      <Text variant="subtext" size="xs" className="uppercase tracking-wider">Stops</Text>
                    </Stack>
                    <Text variant="mono" size="xl" weight="bold" className="text-text-primary">
                      {verdict.stops === 0 ? "Nonstop" : `${verdict.stops} stop`}
                    </Text>
                  </Stack>
                  {savingsVsNext !== null && savingsVsNext > 0 && (
                    <Stack className="bg-signal-positive/5 border border-signal-positive/20 rounded-xl p-4 flex-1 min-w-[120px]" gap={1}>
                      <Stack direction="row" align="center" gap={1}>
                        <TrendingDown className="w-3.5 h-3.5 text-signal-positive" />
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider text-signal-positive">vs next-best</Text>
                      </Stack>
                      <Text variant="mono" size="xl" weight="bold" className="text-signal-positive">
                        {fmt(savingsVsNext, verdict.currency)} cheaper
                      </Text>
                    </Stack>
                  )}
                  {cheapestAlt && cheapestAlt.deltaPrice > 0 && savingsVsNext === null && (
                    <Stack className="bg-signal-positive/5 border border-signal-positive/20 rounded-xl p-4 flex-1 min-w-[120px]" gap={1}>
                      <Stack direction="row" align="center" gap={1}>
                        <TrendingDown className="w-3.5 h-3.5 text-signal-positive" />
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider text-signal-positive">savings</Text>
                      </Stack>
                      <Text variant="mono" size="xl" weight="bold" className="text-signal-positive">
                        {cheapestAlt.gain}
                      </Text>
                    </Stack>
                  )}
                </Stack>

                {/* Badges row */}
                <Stack direction="row" gap={2} className="flex-wrap">
                  <Badge variant={verdict.refundable ? "success" : "default"}>
                    {verdict.refundable ? "Refundable" : "Non-Refundable"}
                  </Badge>
                  <Badge variant={verdict.baggage_included ? "success" : "default"}>
                    {verdict.baggage_included ? "Baggage Included" : "Bags Extra"}
                  </Badge>
                  {verdict.on_time_performance != null && (
                    <Badge variant="default">
                      OTP {Math.round(verdict.on_time_performance * 100)}%
                    </Badge>
                  )}
                  <Badge variant="default">{verdict.cabin_class}</Badge>
                </Stack>

                {/* AI Verdict */}
                <Stack className="border-t border-border-default pt-6" gap={3}>
                  <Stack direction="row" align="center" gap={2}>
                    <Sparkles className="w-4 h-4 text-accent" />
                    <Text variant="heading" size="sm" className="text-text-secondary uppercase tracking-wider font-semibold">
                      AI Verdict
                    </Text>
                  </Stack>
                  <Text variant="body" size="base" className="text-text-primary/90 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                    {shortVerdictDisplay}
                  </Text>
                </Stack>

                {/* CTAs */}
                <Stack direction="row" gap={3} className="flex-wrap pt-2">
                  <NavLink
                    href={editHref}
                    active={false}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-default bg-bg-surface hover:border-accent hover:text-accent text-sm font-medium transition-all"
                  >
                    <PenLine className="w-4 h-4" />
                    Edit Request
                  </NavLink>
                  <Clickable
                    onClick={onScrollToAlternatives}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-default bg-bg-surface-raised hover:border-accent hover:text-accent text-sm font-medium transition-all cursor-pointer text-text-primary"
                  >
                    Compare Alternatives
                  </Clickable>
                </Stack>
              </Stack>

              {/* Right: confidence gauge */}
              <Stack gap={4} className="lg:col-span-4" align="center">
                <Stack className="w-full border border-border-default rounded-2xl p-6 bg-bg-surface-raised/30" gap={4} align="center">
                  <Stack gap={1} align="center">
                    <Text variant="heading" size="sm" className="text-text-secondary uppercase tracking-wider font-semibold text-center">
                      Match Confidence
                    </Text>
                    <Text variant="subtext" size="xs" className="text-center text-text-secondary">
                      Preference alignment score
                    </Text>
                  </Stack>
                  <ConfidenceGauge confidence={confidence} />
                  <Stack gap={2} className="w-full border-t border-border-default pt-4">
                    {confidence.strongSignals.length > 0 && (
                      <Stack gap={2}>
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider font-semibold">
                          Strong signals
                        </Text>
                        <Stack direction="row" gap={2} className="flex-wrap">
                          {confidence.strongSignals.map((s) => (
                            <Badge key={s} variant="success">{s}</Badge>
                          ))}
                        </Stack>
                      </Stack>
                    )}
                    {confidence.weakSignals.length > 0 && (
                      <Stack gap={2}>
                        <Text variant="subtext" size="xs" className="uppercase tracking-wider font-semibold">
                          Weak signals
                        </Text>
                        <Stack direction="row" gap={2} className="flex-wrap">
                          {confidence.weakSignals.map((s) => (
                            <Badge key={s} variant="default">{s}</Badge>
                          ))}
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </Stack>

                {/* Multi-city itinerary summary */}
                {mode === "multi-city" && itinerary && (
                  <Stack className="w-full border border-border-default rounded-2xl p-5 bg-bg-surface-raised/30" gap={3}>
                    <Text variant="heading" size="xs" className="text-text-secondary uppercase tracking-wider font-semibold">
                      Full routing ({itinerary.legs.length} legs)
                    </Text>
                    <Stack gap={2}>
                      {itinerary.legs.map((leg, i) => (
                        <Stack key={leg.flight.flight_id} direction="row" align="center" gap={2}>
                          <Text variant="mono" size="xs" className="text-text-secondary w-4">{i + 1}.</Text>
                          <Text variant="mono" size="xs" weight="bold">{leg.from}</Text>
                          <span className="text-text-secondary">→</span>
                          <Text variant="mono" size="xs" weight="bold">{leg.to}</Text>
                          <Text variant="mono" size="xs" className="text-text-secondary ml-auto">
                            {fmt(leg.flight.price, leg.flight.currency)}
                          </Text>
                        </Stack>
                      ))}
                      <Stack className="border-t border-border-default pt-2 mt-1" direction="row" justify="between" align="center" gap={0}>
                        <Text variant="subtext" size="xs" className="font-semibold">Total</Text>
                        <Text variant="mono" size="sm" weight="bold" className="text-accent">
                          {fmt(itinerary.totalPrice)}
                        </Text>
                      </Stack>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
}
