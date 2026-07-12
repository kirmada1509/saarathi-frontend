"use client";

import React from "react";
import { Stack, Text, Card, Badge } from "@/components/ui/primitives";
import { Scale, Check, HelpCircle } from "lucide-react";
import { PreferenceRadar } from "@/components/charts/PreferenceRadar";
import type { EvidenceItem, InferredPreference, Confidence } from "@/core/types";

export function EvidencePanel({
  preference,
  confidence,
}: {
  preference: InferredPreference;
  confidence: Confidence;
}) {
  const strongSet = new Set(confidence.strongSignals);

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
          <Stack gap={2} className="md:col-span-2 bg-bg-surface-raised/40 border border-border-default rounded-md p-3">
            <Text variant="heading" size="sm" className="text-accent font-semibold">
              Inferred dimension weights
            </Text>
            <PreferenceRadar preference={preference} className="mx-auto h-[200px] w-full" />
            <Stack gap={1} className="border-t border-border-default pt-3 mt-1 text-xs">
              <Text variant="body" size="xs" weight="medium">Other hard constraints</Text>
              <Text variant="mono" size="xs" className="text-text-primary">
                Max layover: {preference.max_layover_minutes}m
              </Text>
              <Text variant="mono" size="xs" className="text-text-primary">
                Redeyes allowed: {preference.avoid_redeye ? "No" : "Yes"}
              </Text>
            </Stack>
          </Stack>

          <Stack gap={3} className="md:col-span-3">
            <Stack direction="row" justify="between" align="center">
              <Text variant="heading" size="sm" className="text-accent font-semibold">
                Inferred preference signals
              </Text>
              <Badge variant="default">{preference.evidence.length} indicators</Badge>
            </Stack>

            <Stack className="border border-border-default rounded-md overflow-hidden bg-bg-surface-raised/10 max-h-[260px] overflow-y-auto">
              <Stack gap={0} className="divide-y divide-border-default">
                {preference.evidence.map((item: EvidenceItem, index: number) => {
                  const isStrong = strongSet.has(item.dimension);
                  return (
                    <Stack
                      key={index}
                      direction="row"
                      gap={3}
                      align="start"
                      className="p-3 hover:bg-bg-surface-raised/40 transition-colors"
                    >
                      {isStrong ? (
                        <span className="bg-signal-positive/10 border border-signal-positive/30 rounded p-0.5 mt-0.5 flex items-center justify-center">
                          <Check className="w-3 h-3 text-signal-positive" />
                        </span>
                      ) : (
                        <span className="bg-bg-surface-raised border border-border-default rounded p-0.5 mt-0.5 flex items-center justify-center">
                          <HelpCircle className="w-3 h-3 text-text-secondary" />
                        </span>
                      )}
                      <Stack gap={1} className="flex-1">
                        <Text variant="body" size="sm" className="text-text-primary/95 leading-snug">
                          {item.text}
                        </Text>
                        <Stack direction="row" align="center" gap={2} className="text-xs">
                          <Text variant="mono" size="xs" className="text-accent">{item.dimension}</Text>
                          <Text variant="mono" size="xs" className="text-text-secondary">·</Text>
                          <Text variant="mono" size="xs" className="uppercase bg-bg-surface-raised px-1.5 py-0.5 rounded text-[10px] text-text-secondary">
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
