"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Stack, Text, Card, Badge, Clickable } from "@/components/ui/primitives";
import { DollarSign, ToggleLeft, ToggleRight, Check, XCircle } from "lucide-react";
import { Perturbation, Counterfactual } from "@/core/types";

export function CounterfactualPanel() {
  const { response, legResponse, perturbations, togglePerturbation, clearPerturbations } = useStore();

  const activeResponse = response?.mode === "multi-city" ? legResponse : response;

  if (!activeResponse) return null;

  const { counterfactuals } = activeResponse;

  const isPerturbationActive = (p: Perturbation) => {
    return perturbations.some((item) => {
      if (item.kind !== p.kind) return false;
      if (item.kind === "price_drop" && p.kind === "price_drop") {
        return item.flightId === p.flightId;
      }
      return true;
    });
  };

  // Group into Type 1 (price drops) and Type 2 (toggle flips)
  const priceDrops = counterfactuals.filter((cf: Counterfactual) => cf.perturbation.kind === "price_drop");
  const toggleFlips = counterfactuals.filter((cf: Counterfactual) => cf.perturbation.kind !== "price_drop");

  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack gap={4}>
        {/* Title */}
        <Stack direction="row" align="center" justify="between" className="border-b border-border-default pb-3 flex-wrap gap-2">
          <Stack direction="row" align="center" gap={2}>
            <ToggleRight className="w-5 h-5 text-accent" />
            <Text variant="heading" size="lg" className="text-text-primary font-bold">
              Decision Boundaries (What-If Tweak Chips)
            </Text>
          </Stack>
          {perturbations.length > 0 && (
            <Clickable
              onClick={clearPerturbations}
              className="text-xs font-mono text-signal-negative hover:underline cursor-pointer flex items-center gap-1 bg-signal-negative/10 border border-signal-negative/20 px-2 py-0.5 rounded"
            >
              <XCircle className="w-3 h-3" /> Reset Tweaks
            </Clickable>
          )}
        </Stack>

        <Stack className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Toggle Flips (Type 2) */}
          <Stack gap={3}>
            <Stack direction="row" align="center" gap={2}>
              <ToggleLeft className="w-4 h-4 text-accent" />
              <Text variant="heading" size="sm" className="text-accent font-semibold">
                Toggle Preferences & Constraints
              </Text>
            </Stack>

            <Stack gap={2}>
              {toggleFlips.length > 0 ? (
                toggleFlips.map((cf: Counterfactual, index: number) => {
                  const active = isPerturbationActive(cf.perturbation);
                  return (
                    <Clickable
                      key={index}
                      onClick={() => togglePerturbation(cf.perturbation)}
                      className={`w-full text-left p-3 rounded-md border text-sm font-sans flex items-start justify-between gap-3 transition-all cursor-pointer ${
                        active
                          ? "bg-accent/15 border-accent text-text-primary shadow-sm"
                          : cf.flips
                          ? "bg-bg-surface-raised/20 border-border-default text-text-primary hover:border-accent/40"
                          : "bg-bg-surface-raised/5 border-border-default/40 text-text-secondary opacity-60 hover:opacity-80"
                      }`}
                    >
                      <Stack gap={1} className="flex-1">
                        <Text variant="body" size="sm" className="font-medium text-left">
                          {cf.label}
                        </Text>
                        <Text variant="subtext" size="xs" className="text-left font-mono">
                          {cf.flips ? "Boundary Change: FLIPS WINNER" : "No Change (winner stays same)"}
                        </Text>
                      </Stack>
                      {active ? (
                        <span className="bg-accent text-bg-base rounded-full p-0.5 mt-0.5 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        cf.flips && (
                          <Badge variant="warning" className="text-[9px] mt-0.5 select-none">
                            Flip Potential
                          </Badge>
                        )
                      )}
                    </Clickable>
                  );
                })
              ) : (
                <Text variant="subtext" className="italic py-3">
                  No filter boundary tweaks computed.
                </Text>
              )}
            </Stack>
          </Stack>

          {/* Column 2: Price Drops (Type 1) */}
          <Stack gap={3}>
            <Stack direction="row" align="center" gap={2}>
              <DollarSign className="w-4 h-4 text-accent" />
              <Text variant="heading" size="sm" className="text-accent font-semibold">
                Required Competitor Price Thresholds
              </Text>
            </Stack>

            <Stack gap={2}>
              {priceDrops.length > 0 ? (
                priceDrops.map((cf: Counterfactual, index: number) => {
                  const active = isPerturbationActive(cf.perturbation);
                  return (
                    <Clickable
                      key={index}
                      onClick={() => togglePerturbation(cf.perturbation)}
                      className={`w-full text-left p-3 rounded-md border text-sm font-sans flex items-start justify-between gap-3 transition-all cursor-pointer ${
                        active
                          ? "bg-accent/15 border-accent text-text-primary shadow-sm"
                          : cf.flips
                          ? "bg-bg-surface-raised/20 border-border-default text-text-primary hover:border-accent/40"
                          : "bg-bg-surface-raised/5 border-border-default/40 text-text-secondary opacity-60 hover:opacity-80"
                      }`}
                    >
                      <Stack gap={1} className="flex-1">
                        <Text variant="body" size="sm" className="font-medium text-left">
                          {cf.label}
                        </Text>
                        <Text variant="subtext" size="xs" className="text-left font-mono">
                          {cf.flips ? "Closed-Form Algebra: ACHIEVABLE" : "Unrealistic Price Change Required"}
                        </Text>
                      </Stack>
                      {active ? (
                        <span className="bg-accent text-bg-base rounded-full p-0.5 mt-0.5 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        cf.flips && (
                          <Badge variant="success" className="text-[9px] mt-0.5 select-none">
                            Achievable
                          </Badge>
                        )
                      )}
                    </Clickable>
                  );
                })
              ) : (
                <Text variant="subtext" className="italic py-3 text-text-secondary">
                  {activeResponse.verdict
                    ? "Cost weight sensitivity is 0. Compensating competitor fares will not change the verdict."
                    : "No flights scored. Price thresholds require at least one base result."}
                </Text>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
