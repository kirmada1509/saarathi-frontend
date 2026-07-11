"use client";

import React from "react";
import { Stack, Text, Card, Badge, Clickable } from "@/components/ui/primitives";
import { DollarSign, ToggleLeft, ToggleRight, Check, XCircle } from "lucide-react";
import { perturbationsEqual } from "@/lib/decision-params";
import type { Perturbation, Counterfactual } from "@/core/types";

export function CounterfactualPanel({
  counterfactuals,
  activePerturbations,
  hasVerdict,
  onToggle,
  onClear,
}: {
  counterfactuals: Counterfactual[];
  activePerturbations: Perturbation[];
  hasVerdict: boolean;
  onToggle: (p: Perturbation) => void;
  onClear: () => void;
}) {
  const isActive = (p: Perturbation) =>
    activePerturbations.some((item) => perturbationsEqual(item, p));

  const priceDrops = counterfactuals.filter((cf) => cf.perturbation.kind === "price_drop");
  const toggleFlips = counterfactuals.filter((cf) => cf.perturbation.kind !== "price_drop");

  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack gap={4}>
        <Stack direction="row" align="center" justify="between" className="border-b border-border-default pb-3 flex-wrap gap-2">
          <Stack direction="row" align="center" gap={2}>
            <ToggleRight className="w-5 h-5 text-accent" />
            <Text variant="heading" size="lg" className="text-text-primary font-bold">
              Decision Boundaries
            </Text>
          </Stack>
          {activePerturbations.length > 0 && (
            <Clickable
              onClick={onClear}
              className="text-xs font-mono text-signal-negative hover:underline cursor-pointer flex items-center gap-1 bg-signal-negative/10 border border-signal-negative/20 px-2 py-0.5 rounded"
            >
              <XCircle className="w-3 h-3" /> Reset tweaks
            </Clickable>
          )}
        </Stack>

        <Stack className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Stack gap={3}>
            <Stack direction="row" align="center" gap={2}>
              <ToggleLeft className="w-4 h-4 text-accent" />
              <Text variant="heading" size="sm" className="text-accent font-semibold">
                Toggle preferences & constraints
              </Text>
            </Stack>

            <Stack gap={2}>
              {toggleFlips.length > 0 ? (
                toggleFlips.map((cf: Counterfactual, index: number) => {
                  const active = isActive(cf.perturbation);
                  return (
                    <Clickable
                      key={index}
                      onClick={() => onToggle(cf.perturbation)}
                      className={`w-full text-left p-3 rounded-md border text-sm font-sans flex items-start justify-between gap-3 transition-all cursor-pointer ${
                        active
                          ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                          : cf.flips
                          ? "bg-bg-surface-raised/40 border-border-default text-text-primary hover:border-accent/50"
                          : "bg-bg-surface-raised/10 border-border-default/60 text-text-secondary opacity-70 hover:opacity-90"
                      }`}
                    >
                      <Stack gap={1} className="flex-1">
                        <Text variant="body" size="sm" className="font-medium text-left">
                          {cf.label}
                        </Text>
                        <Text variant="subtext" size="xs" className="text-left font-mono">
                          {cf.flips ? "Boundary change: flips winner" : "No change (winner stays same)"}
                        </Text>
                      </Stack>
                      {active ? (
                        <span className="bg-accent text-text-on-accent rounded-full p-0.5 mt-0.5 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        cf.flips && (
                          <Badge variant="warning" className="text-[9px] mt-0.5 select-none">
                            Flip potential
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

          <Stack gap={3}>
            <Stack direction="row" align="center" gap={2}>
              <DollarSign className="w-4 h-4 text-accent" />
              <Text variant="heading" size="sm" className="text-accent font-semibold">
                Required competitor price thresholds
              </Text>
            </Stack>

            <Stack gap={2}>
              {priceDrops.length > 0 ? (
                priceDrops.map((cf: Counterfactual, index: number) => {
                  const active = isActive(cf.perturbation);
                  return (
                    <Clickable
                      key={index}
                      onClick={() => onToggle(cf.perturbation)}
                      className={`w-full text-left p-3 rounded-md border text-sm font-sans flex items-start justify-between gap-3 transition-all cursor-pointer ${
                        active
                          ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                          : cf.flips
                          ? "bg-bg-surface-raised/40 border-border-default text-text-primary hover:border-accent/50"
                          : "bg-bg-surface-raised/10 border-border-default/60 text-text-secondary opacity-70 hover:opacity-90"
                      }`}
                    >
                      <Stack gap={1} className="flex-1">
                        <Text variant="body" size="sm" className="font-medium text-left">
                          {cf.label}
                        </Text>
                        <Text variant="subtext" size="xs" className="text-left font-mono">
                          {cf.flips ? "Closed-form algebra: achievable" : "Unrealistic price change required"}
                        </Text>
                      </Stack>
                      {active ? (
                        <span className="bg-accent text-text-on-accent rounded-full p-0.5 mt-0.5 flex items-center justify-center">
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
                  {hasVerdict
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
