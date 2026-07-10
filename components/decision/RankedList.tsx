"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Stack, Text, Card, Badge, Clickable } from "@/components/ui/primitives";
import { ListFilter, ChevronDown, ChevronUp, Award, AlertTriangle } from "lucide-react";
import { ScoredFlight } from "@/core/types";

export function RankedList() {
  const { response, legResponse } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);

  const activeResponse = response?.mode === "multi-city" ? legResponse : response;

  if (!activeResponse) return null;

  const { ranked, verdict } = activeResponse;

  // Filter out the champion from the candidate list (or keep it all but mark the champion)
  // Let's list all ranked candidates
  if (ranked.length === 0) return null;

  const handleRowClick = (flightId: string) => {
    if (expandedFlightId === flightId) {
      setExpandedFlightId(null);
    } else {
      setExpandedFlightId(flightId);
    }
  };

  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack gap={3}>
        {/* Toggle Button Header */}
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
              Click any candidate row to display its exact multi-attribute score breakdown.
            </Text>

            <Stack className="border border-border-default rounded-md overflow-hidden bg-bg-surface-raised/5">
              {/* Table Header */}
              <Stack className="grid grid-cols-5 gap-2 p-3 bg-bg-surface-raised/40 border-b border-border-default text-xs font-mono font-medium text-text-secondary">
                <span className="col-span-2">AIRLINE / FLIGHT</span>
                <span>PRICE</span>
                <span>ROUTE</span>
                <span className="text-right">SCORE</span>
              </Stack>

              {/* Table Rows */}
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
                      {/* Row Clickable */}
                      <Clickable
                        onClick={() => handleRowClick(f.flight_id)}
                        className={`grid grid-cols-5 gap-2 p-3 text-sm text-left transition-colors cursor-pointer w-full items-center ${
                          isChampion
                            ? "bg-accent/5 hover:bg-accent/10"
                            : "hover:bg-bg-surface-raised/20"
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
                            {f.origin} ➔ {f.destination}
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

                      {/* Expandable Breakdown Card */}
                      {isExpanded && f.breakdown && (
                        <Stack className="p-4 bg-bg-surface-raised/60 border-t border-b border-border-default/50 text-xs font-mono">
                          <Stack className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Score Metrics */}
                            <Stack gap={2}>
                              <Text variant="heading" size="xs" className="text-accent font-semibold flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" /> Component Scores (0 to 1)
                              </Text>

                              <Stack gap={2} className="pl-1">
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Direct Route Match:</Text>
                                  <Text variant="mono" size="xs" className="text-text-primary">{f.breakdown.directScore.toFixed(3)}</Text>
                                </Stack>
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Fare Pricing Rank:</Text>
                                  <Text variant="mono" size="xs" className="text-text-primary">{f.breakdown.priceScore.toFixed(3)}</Text>
                                </Stack>
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Duration & Layover:</Text>
                                  <Text variant="mono" size="xs" className="text-text-primary">{f.breakdown.convenienceScore.toFixed(3)}</Text>
                                </Stack>
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Cabin Tier Match:</Text>
                                  <Text variant="mono" size="xs" className="text-text-primary">{f.breakdown.cabinScore.toFixed(3)}</Text>
                                </Stack>
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Airline Loyalty Match:</Text>
                                  <Text variant="mono" size="xs" className="text-text-primary">{f.breakdown.airlineScore.toFixed(3)}</Text>
                                </Stack>
                              </Stack>
                            </Stack>

                            {/* Right: Applied Penalties */}
                            <Stack gap={2}>
                              <Text variant="heading" size="xs" className="text-accent font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" /> Active Penalties
                              </Text>

                              <Stack gap={2} className="pl-1">
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Redeye Departure:</Text>
                                  <Text variant="mono" size="xs" className={f.breakdown.redeyePenalty < 1 ? "text-signal-negative font-bold" : "text-signal-positive"}>
                                    {f.breakdown.redeyePenalty === 1 ? "None (1.0x)" : `${f.breakdown.redeyePenalty.toFixed(2)}x penalty`}
                                  </Text>
                                </Stack>
                                <Stack direction="row" justify="between" className="w-full">
                                  <Text variant="subtext" size="xs">Holiday Season Premium:</Text>
                                  <Text variant="mono" size="xs" className={f.breakdown.holidayPenalty < 1 ? "text-signal-negative font-bold" : "text-signal-positive"}>
                                    {f.breakdown.holidayPenalty === 1 ? "None (1.0x)" : `${f.breakdown.holidayPenalty.toFixed(2)}x penalty`}
                                  </Text>
                                </Stack>
                                <Stack direction="row" justify="between" className="border-t border-border-default/50 pt-2 mt-1 font-bold text-accent w-full">
                                  <Text variant="mono" size="xs">Weighted Final Score:</Text>
                                  <Text variant="mono" size="xs">{f.breakdown.finalScore.toFixed(4)}</Text>
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
