"use client";

import React from "react";
import { Stack, Text, Card } from "@/components/ui/primitives";
import { GitCompare, DollarSign, Clock, HelpCircle, BadgeCheck, ShieldAlert, Calendar } from "lucide-react";
import type { Alternative, ScoredFlight } from "@/core/types";

const KIND_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  cheapest: { label: "Cheapest Alternative", icon: <DollarSign className="w-4 h-4 text-accent" /> },
  fastest: { label: "Fastest Connection", icon: <Clock className="w-4 h-4 text-accent" /> },
  flexible: { label: "Refundable Choice", icon: <BadgeCheck className="w-4 h-4 text-accent" /> },
  comfort: { label: "Comfort Premium Pick", icon: <HelpCircle className="w-4 h-4 text-accent" /> },
  date_shift: { label: "Alternate Date Option", icon: <Calendar className="w-4 h-4 text-accent" /> },
};

export function OpportunityCostPanel({
  alternatives,
  verdict,
}: {
  alternatives: Alternative[];
  verdict: ScoredFlight | null;
}) {
  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack gap={4}>
        <Stack direction="row" align="center" gap={2} className="border-b border-border-default pb-3">
          <GitCompare className="w-5 h-5 text-accent" />
          <Text variant="heading" size="lg" className="text-text-primary font-bold">
            Opportunity Cost & Alternatives
          </Text>
        </Stack>

        <Stack className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {alternatives.map((alt: Alternative) => {
            const meta = KIND_LABELS[alt.kind] || { label: alt.kind, icon: <GitCompare className="w-4 h-4" /> };
            const isChampion = verdict && alt.flight && alt.flight.flight_id === verdict.flight_id;

            return (
              <Card
                key={alt.kind}
                className={`flex flex-col justify-between p-4 bg-bg-surface-raised/40 border-border-default rounded-md relative ${
                  isChampion ? "border-accent/50 bg-accent/5" : ""
                }`}
              >
                {isChampion && (
                  <span className="absolute -top-2.5 right-3 bg-accent text-text-on-accent text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase select-none">
                    Champion Choice
                  </span>
                )}

                <Stack gap={2}>
                  <Stack direction="row" align="center" gap={2} className="border-b border-border-default/60 pb-2">
                    {meta.icon}
                    <Text variant="heading" size="xs" className="font-semibold text-text-primary">
                      {meta.label}
                    </Text>
                  </Stack>

                  {alt.flight ? (
                    <Stack gap={2} className="pt-1">
                      <Stack direction="row" justify="between" align="baseline">
                        <Text variant="mono" size="base" weight="bold" className="text-text-primary">
                          {alt.flight.airline_name}
                        </Text>
                        <Text variant="mono" size="base" className="text-accent font-semibold">
                          ${alt.flight.price}
                        </Text>
                      </Stack>
                      <Text variant="subtext" size="xs" className="font-mono">
                        {alt.flight.airline_code} {alt.flight.flight_numbers} | {alt.flight.cabin_class}
                      </Text>
                      <Text variant="mono" size="xs" className="text-text-secondary mt-1">
                        {new Date(alt.flight.departure_utc).toLocaleDateString([], { month: "short", day: "numeric" })} |{" "}
                        {new Date(alt.flight.departure_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </Stack>
                  ) : (
                    <Stack align="center" justify="center" className="py-6 text-center">
                      <ShieldAlert className="w-6 h-6 text-text-secondary opacity-40 mb-1" />
                      <Text variant="subtext" size="xs" className="italic font-medium">
                        {alt.gain || "No options available"}
                      </Text>
                    </Stack>
                  )}
                </Stack>

                {alt.flight && (
                  <Stack gap={1} className="border-t border-border-default/60 pt-3 mt-3 text-xs">
                    <Text variant="mono" size="xs" className="text-signal-positive font-semibold">
                      Gain: {alt.gain}
                    </Text>
                    <Text variant="mono" size="xs" className="text-text-secondary">
                      Cost: {alt.cost}
                    </Text>
                  </Stack>
                )}
              </Card>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}
