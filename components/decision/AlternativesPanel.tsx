"use client";

import React from "react";
import { Stack, Text, Badge } from "@/components/ui/primitives";
import {
  DollarSign, Clock, BadgeCheck, HelpCircle, Calendar, GitCompare,
  ShieldAlert, TrendingUp, TrendingDown
} from "lucide-react";
import type { Alternative, ScoredFlight } from "@/core/types";

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

const KIND_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  description: string;
  isChampion?: boolean;
}> = {
  cheapest: {
    label: "Cheapest",
    icon: <DollarSign className="w-4 h-4" />,
    description: "Lowest fare available",
  },
  fastest: {
    label: "Fastest",
    icon: <Clock className="w-4 h-4" />,
    description: "Shortest total flight time",
  },
  flexible: {
    label: "Refundable",
    icon: <BadgeCheck className="w-4 h-4" />,
    description: "Fully refundable ticket",
  },
  comfort: {
    label: "Premium",
    icon: <HelpCircle className="w-4 h-4" />,
    description: "Higher cabin comfort",
  },
  date_shift: {
    label: "Date Shift",
    icon: <Calendar className="w-4 h-4" />,
    description: "Alternate departure date",
  },
};

interface AlternativeCardProps {
  alt: Alternative;
  isRecommended: boolean;
}

function AlternativeCard({ alt, isRecommended }: AlternativeCardProps) {
  const meta = KIND_META[alt.kind] || { label: alt.kind, icon: <GitCompare className="w-4 h-4" />, description: "" };

  return (
    <Stack
      className={`relative rounded-2xl border p-5 transition-all duration-200 ${
        isRecommended
          ? "border-accent/40 bg-accent/3 shadow-sm"
          : "border-border-default bg-bg-surface hover:border-border-default/80 hover:bg-bg-surface-raised/20"
      }`}
      gap={4}
    >
      {/* Champion tag */}
      {isRecommended && (
        <span className="absolute -top-3 left-4 bg-accent text-text-on-accent text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase select-none shadow-sm">
          ✦ Recommended
        </span>
      )}

      {/* Header */}
      <Stack gap={2}>
        <Stack direction="row" align="center" gap={2}>
          <span className={`${isRecommended ? "text-accent" : "text-text-secondary"}`}>
            {meta.icon}
          </span>
          <Text variant="heading" size="sm" className={`font-bold ${isRecommended ? "text-accent" : "text-text-primary"}`}>
            {meta.label}
          </Text>
        </Stack>
        <Text variant="subtext" size="xs">{meta.description}</Text>
      </Stack>

      {/* Flight info */}
      {alt.flight ? (
        <Stack gap={3}>
          <Stack gap={1}>
            <Text variant="mono" size="base" weight="bold" className="text-text-primary">
              {alt.flight.airline_name}
            </Text>
            <Text variant="mono" size="xs" className="text-text-secondary">
              {alt.flight.airline_code} {alt.flight.flight_numbers} · {alt.flight.cabin_class}
            </Text>
          </Stack>

          <Stack direction="row" justify="between" align="center" gap={0}>
            <Stack gap={0}>
              <Text variant="mono" size="xl" weight="bold" className={isRecommended ? "text-accent" : "text-text-primary"}>
                {fmt(alt.flight.price, alt.flight.currency)}
              </Text>
            </Stack>
            <Stack gap={0} align="end">
              <Text variant="mono" size="sm" className="text-text-secondary">
                {fmtDur(alt.flight.duration_minutes)}
              </Text>
              <Text variant="subtext" size="xs">
                {alt.flight.stops === 0 ? "Nonstop" : `${alt.flight.stops} stop`}
              </Text>
            </Stack>
          </Stack>

          <Text variant="mono" size="xs" className="text-text-secondary">
            {new Date(alt.flight.departure_utc).toLocaleDateString([], { month: "short", day: "numeric" })}
            {" · "}
            {new Date(alt.flight.departure_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>

          {/* Gain / cost breakdown */}
          <Stack className="border-t border-border-default pt-3" gap={2}>
            <Stack direction="row" align="start" gap={2}>
              <TrendingUp className="w-3.5 h-3.5 text-signal-positive mt-0.5 flex-shrink-0" />
              <Stack gap={0}>
                <Text variant="subtext" size="xs" className="uppercase tracking-wider font-semibold text-signal-positive">What you gain</Text>
                <Text variant="mono" size="xs" className="text-signal-positive font-medium mt-0.5">{alt.gain}</Text>
              </Stack>
            </Stack>
            <Stack direction="row" align="start" gap={2}>
              <TrendingDown className="w-3.5 h-3.5 text-text-secondary mt-0.5 flex-shrink-0" />
              <Stack gap={0}>
                <Text variant="subtext" size="xs" className="uppercase tracking-wider font-semibold text-text-secondary">What you sacrifice</Text>
                <Text variant="mono" size="xs" className="text-text-secondary mt-0.5">{alt.cost}</Text>
              </Stack>
            </Stack>
          </Stack>

          {/* Quick metric badges */}
          <Stack direction="row" gap={2} className="flex-wrap">
            {alt.flight.refundable && <Badge variant="success">Refundable</Badge>}
            {alt.flight.baggage_included && <Badge variant="success">Bags included</Badge>}
          </Stack>
        </Stack>
      ) : (
        <Stack align="center" justify="center" className="py-8 text-center flex-1" gap={2}>
          <ShieldAlert className="w-6 h-6 text-text-secondary opacity-40" />
          <Text variant="subtext" size="xs" className="italic font-medium">
            {alt.gain || "No options available for this category"}
          </Text>
        </Stack>
      )}
    </Stack>
  );
}

interface AlternativesPanelProps {
  alternatives: Alternative[];
  verdict: ScoredFlight | null;
}

export function AlternativesPanel({ alternatives, verdict }: AlternativesPanelProps) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <Stack gap={6}>
      {/* Section header */}
      <Stack gap={1}>
        <Text as="h2" variant="heading" size="lg" className="text-text-primary font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Alternatives
        </Text>
        <Text variant="subtext" size="sm">
          Each option has a different priority. Pick based on what matters most to you right now.
        </Text>
      </Stack>

      {/* Cards grid */}
      <Stack className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4" gap={0}>
        {alternatives.map((alt) => {
          const isRecommended = !!(verdict && alt.flight && alt.flight.flight_id === verdict.flight_id);
          return (
            <AlternativeCard
              key={alt.kind}
              alt={alt}
              isRecommended={isRecommended}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
