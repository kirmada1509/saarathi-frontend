"use client";

import React, { useState } from "react";
import { Stack, Text, Card, Badge, Clickable } from "@/components/ui/primitives";
import { ListFilter, ChevronDown, ChevronUp, Award } from "lucide-react";
import { ScoreBreakdownBars } from "@/components/charts/ScoreBreakdownBars";
import type { ScoredFlight } from "@/core/types";

export function RankedList({
  ranked,
  verdict,
}: {
  ranked: ScoredFlight[];
  verdict: ScoredFlight | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);

  if (ranked.length === 0) return null;

  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack gap={3}>
        <Clickable
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left flex items-center justify-between py-1 cursor-pointer focus:outline-none"
        >
          <Stack direction="row" align="center" gap={2}>
            <ListFilter className="w-5 h-5 text-accent" />
            <Text variant="heading" size="lg" className="text-text-primary font-bold">
              Full Ranked Candidates ({ranked.length})
            </Text>
          </Stack>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          )}
        </Clickable>

        {isOpen && (
          <Stack gap={3} className="pt-2 border-t border-border-default">
            <Text variant="subtext" size="xs">
              Click any candidate row to see its exact multi-attribute score breakdown.
            </Text>

            <Stack className="border border-border-default rounded-md overflow-hidden bg-bg-surface-raised/10">
              <Stack className="grid grid-cols-5 gap-2 p-3 bg-bg-surface-raised/60 border-b border-border-default text-xs font-mono font-medium text-text-secondary">
                <span className="col-span-2">AIRLINE / FLIGHT</span>
                <span>PRICE</span>
                <span>ROUTE</span>
                <span className="text-right">SCORE</span>
              </Stack>

              <Stack gap={0} className="divide-y divide-border-default">
                {ranked.map((f: ScoredFlight, index: number) => {
                  const isChampion = verdict && f.flight_id === verdict.flight_id;
                  const isExpanded = expandedFlightId === f.flight_id;

                  const formattedPrice = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: f.currency || "USD",
                    maximumFractionDigits: 0,
                  }).format(f.price);

                  return (
                    <Stack key={f.flight_id} gap={0}>
                      <Clickable
                        onClick={() =>
                          setExpandedFlightId(isExpanded ? null : f.flight_id)
                        }
                        className={`grid grid-cols-5 gap-2 p-3 text-sm text-left transition-colors cursor-pointer w-full items-center ${
                          isChampion ? "bg-accent/5 hover:bg-accent/10" : "hover:bg-bg-surface-raised/40"
                        }`}
                      >
                        <span className="col-span-2 flex items-center gap-2">
                          <Text variant="mono" size="xs" className="text-text-secondary font-bold min-w-[20px]">
                            #{index + 1}
                          </Text>
                          <Stack gap={1}>
                            <Text variant="body" size="sm" weight="medium">
                              {f.airline_name}
                            </Text>
                            <Text variant="mono" size="xs" className="text-text-secondary">
                              {f.airline_code} {f.flight_numbers} | {f.cabin_class}
                            </Text>
                          </Stack>
                        </span>
                        <Text variant="mono" size="sm" className="text-accent font-semibold">
                          {formattedPrice}
                        </Text>
                        <Stack gap={1}>
                          <Text variant="mono" size="xs" weight="bold">
                            {f.origin} → {f.destination}
                          </Text>
                          <Text variant="subtext" size="xs" className="font-mono">
                            {Math.floor(f.duration_minutes / 60)}h {f.duration_minutes % 60}m
                          </Text>
                        </Stack>
                        <span className="text-right">
                          <Badge variant={isChampion ? "warning" : "default"}>
                            {Math.round(f.score * 100) / 100}
                          </Badge>
                        </span>
                      </Clickable>

                      {isExpanded && f.breakdown && (
                        <Stack className="p-4 bg-bg-surface-raised/60 border-t border-b border-border-default/60 text-xs font-mono">
                          <Stack className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ScoreBreakdownBars breakdown={f.breakdown} className="min-h-[160px]" />

                            <Stack gap={2}>
                              <Text variant="heading" size="xs" className="text-accent font-semibold flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" /> Score summary
                              </Text>
                              <Stack gap={2} className="pl-1">
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Preferred-day bonus:</Text>
                                  <Text
                                    variant="mono"
                                    size="xs"
                                    className={f.breakdown.dayBonus > 0 ? "text-signal-positive font-bold" : "text-text-secondary"}
                                  >
                                    {f.breakdown.dayBonus > 0 ? `+${f.breakdown.dayBonus.toFixed(2)}` : "None"}
                                  </Text>
                                </Stack>
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Baggage contribution:</Text>
                                  <Text variant="mono" size="xs" className="text-text-primary">
                                    {f.breakdown.baggage.toFixed(3)}
                                  </Text>
                                </Stack>
                                <Stack direction="row" justify="between" className="border-t border-border-default/60 pt-2 mt-1 font-bold text-accent w-full">
                                  <Text variant="mono" size="xs">Total score:</Text>
                                  <Text variant="mono" size="xs">{f.score.toFixed(4)}</Text>
                                </Stack>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Stack>
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
