"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Stack, Text, Card, Badge } from "@/components/ui/primitives";
import { Scale, Check, Heart, DollarSign, Clock, HelpCircle, Layers } from "lucide-react";
import { EvidenceItem } from "@/core/types";

export function EvidencePanel() {
  const { response, legResponse } = useStore();

  const activeResponse = response?.mode === "multi-city" ? legResponse : response;

  if (!activeResponse) return null;

  const { preference, confidence } = activeResponse;
  const strongSet = new Set(confidence.strongSignals);

  // Helper icons for dimensions
  const dimensionIcons: Record<string, React.ReactNode> = {
    direct: <Scale className="w-3.5 h-3.5 text-accent" />,
    cost: <DollarSign className="w-3.5 h-3.5 text-accent" />,
    convenience: <Clock className="w-3.5 h-3.5 text-accent" />,
    redeye: <Clock className="w-3.5 h-3.5 text-accent" />,
    airline: <Layers className="w-3.5 h-3.5 text-accent" />,
    cabin: <Heart className="w-3.5 h-3.5 text-accent" />,
  };

  return (
    <Card className="bg-bg-surface border-border-default h-full">
      <Stack gap={4}>
        <Stack direction="row" align="center" gap={2} className="border-b border-border-default pb-3">
          <Scale className="w-5 h-5 text-accent" />
          <Text variant="heading" size="lg" className="text-text-primary font-bold">
            Preference & Evidence Profile
          </Text>
        </Stack>

        <Stack className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left Column: Weights (md:span-2) */}
          <Stack gap={4} className="md:col-span-2 bg-bg-surface-raised/20 border border-border-default rounded-md p-4">
            <Text variant="heading" size="sm" className="text-accent font-semibold">
              Inferred Dimension Weights
            </Text>

            <Stack gap={3}>
              {/* Direct Weight */}
              <Stack gap={2}>
                <Stack direction="row" justify="between" align="center">
                  <Text variant="body" size="xs" weight="medium">Direct Preference</Text>
                  <Text variant="mono" size="xs" className="text-accent font-bold">
                    {Math.round(preference.direct_weight * 100)}%
                  </Text>
                </Stack>
                <span className="block w-full h-2 bg-bg-surface-raised border border-border-default rounded-full overflow-hidden">
                  <span
                    className="block h-full bg-accent transition-all duration-500"
                    style={{ width: `${preference.direct_weight * 100}%` }}
                  />
                </span>
              </Stack>

              {/* Cost Weight */}
              <Stack gap={2}>
                <Stack direction="row" justify="between" align="center">
                  <Text variant="body" size="xs" weight="medium">Cost Sensitivity</Text>
                  <Text variant="mono" size="xs" className="text-accent font-bold">
                    {Math.round(preference.cost_weight * 100)}%
                  </Text>
                </Stack>
                <span className="block w-full h-2 bg-bg-surface-raised border border-border-default rounded-full overflow-hidden">
                  <span
                    className="block h-full bg-accent transition-all duration-500"
                    style={{ width: `${preference.cost_weight * 100}%` }}
                  />
                </span>
              </Stack>

              {/* Convenience Weight */}
              <Stack gap={2}>
                <Stack direction="row" justify="between" align="center">
                  <Text variant="body" size="xs" weight="medium">Convenience Weight</Text>
                  <Text variant="mono" size="xs" className="text-accent font-bold">
                    {Math.round(preference.convenience_weight * 100)}%
                  </Text>
                </Stack>
                <span className="block w-full h-2 bg-bg-surface-raised border border-border-default rounded-full overflow-hidden">
                  <span
                    className="block h-full bg-accent transition-all duration-500"
                    style={{ width: `${preference.convenience_weight * 100}%` }}
                  />
                </span>
              </Stack>
            </Stack>

            <Stack gap={1} className="border-t border-border-default pt-3 mt-1 text-xs text-text-secondary">
              <Text variant="body" size="xs" weight="medium">Other Hard Constraints:</Text>
              <Text variant="mono" size="xs" className="text-text-primary">
                Max Layover: {preference.max_layover_minutes}m
              </Text>
              <Text variant="mono" size="xs" className="text-text-primary">
                Redeyes Allowed: {preference.avoid_redeye ? "No" : "Yes"}
              </Text>
            </Stack>
          </Stack>

          {/* Right Column: Evidence List (md:span-3) */}
          <Stack gap={3} className="md:col-span-3">
            <Stack direction="row" justify="between" align="center">
              <Text variant="heading" size="sm" className="text-accent font-semibold">
                Inferred Preference Signals
              </Text>
              <Badge variant="default">{preference.evidence.length} Indicators</Badge>
            </Stack>

            <Stack className="border border-border-default rounded-md overflow-hidden bg-bg-surface-raised/10 max-h-[220px] overflow-y-auto">
              <Stack gap={0} className="divide-y divide-border-default">
                {preference.evidence.map((item: EvidenceItem, index: number) => {
                  const isStrong = strongSet.has(item.dimension);
                  return (
                    <Stack
                      key={index}
                      direction="row"
                      gap={3}
                      align="start"
                      className="p-3 hover:bg-bg-surface-raised/20 transition-colors"
                    >
                      {/* Checkmark or bullet based on signal strength */}
                      {isStrong ? (
                        <span className="bg-signal-positive/10 border border-signal-positive/30 rounded p-0.5 mt-0.5 flex items-center justify-center">
                          <Check className="w-3 h-3 text-signal-positive" />
                        </span>
                      ) : (
                        <span className="bg-bg-surface-raised border border-border-default rounded p-0.5 mt-0.5 flex items-center justify-center">
                          <HelpCircle className="w-3 h-3 text-text-secondary" />
                        </span>
                      )}

                      {/* Signal description & meta */}
                      <Stack gap={1} className="flex-1">
                        <Text variant="body" size="sm" className="text-text-primary/95 leading-snug">
                          {item.text}
                        </Text>
                        <Stack direction="row" align="center" gap={2} className="text-xs text-text-secondary font-mono">
                          <Text variant="mono" size="xs" className="text-accent flex items-center gap-1">
                            {dimensionIcons[item.dimension]} {item.dimension}
                          </Text>
                          <Text variant="mono" size="xs">•</Text>
                          <Text variant="mono" size="xs" className="uppercase bg-bg-surface-raised px-1.5 py-0.5 rounded text-[10px]">
                            {item.source.replace("_", " ")}
                          </Text>
                        </Stack>
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
