"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Stack, Text, Clickable } from "@/components/ui/primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TraceStage } from "@/core/types";
import { Database, Terminal, ArrowRight, Layers, FileCode, CheckCircle2 } from "lucide-react";

export function TraceBar() {
  const { response } = useStore();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  if (!response) return null;

  const { trace } = response;

  const handleStageClick = (stageId: string) => {
    setSelectedStageId(stageId);
  };

  const activeStage = trace.find((s: TraceStage) => s.id === selectedStageId);

  // Helper icons for stages
  const stageIcons: Record<string, React.ReactNode> = {
    request: <Terminal className="w-4 h-4" />,
    preferences: <Layers className="w-4 h-4" />,
    constraints: <CheckCircle2 className="w-4 h-4" />,
    candidates: <Database className="w-4 h-4" />,
    tradeoffs: <FileCode className="w-4 h-4" />,
    counterfactuals: <Terminal className="w-4 h-4" />,
    verdict: <CheckCircle2 className="w-4 h-4" />,
  };

  return (
    <>
      <Stack direction="row" align="center" className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-bg-surface-raised border-t border-border-default px-6 justify-between shadow-2xl backdrop-blur-md bg-opacity-95">
        <Stack direction="row" align="center" gap={3} className="w-full justify-between flex-nowrap overflow-x-auto py-1">
          {/* Label */}
          <Stack direction="row" align="center" gap={2} className="min-w-[140px] border-r border-border-default pr-4 mr-2">
            <Terminal className="w-4 h-4 text-accent animate-pulse" />
            <Text variant="mono" size="xs" weight="bold" className="text-accent uppercase tracking-wider">
              Decision Trace
            </Text>
          </Stack>

          {/* Steps */}
          <Stack direction="row" align="center" gap={2} className="flex-1 justify-center flex-nowrap min-w-[700px]">
            {trace.map((stage: TraceStage, index: number) => {
              const icon = stageIcons[stage.id] || <Terminal className="w-4 h-4" />;
              return (
                <React.Fragment key={stage.id}>
                  <Clickable
                    onClick={() => handleStageClick(stage.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-bg-base/60 border border-border-default/80 text-xs font-mono font-medium hover:border-accent/60 hover:bg-bg-base/90 text-text-primary transition-all cursor-pointer select-none"
                  >
                    <span className="text-accent">{icon}</span>
                    <span>{stage.label}</span>
                  </Clickable>

                  {index < trace.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-40 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </Stack>

          {/* Status Indicators */}
          <Stack direction="row" align="center" gap={2} className="min-w-[150px] justify-end border-l border-border-default pl-4 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-positive animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-signal-positive relative" />
            <Text variant="mono" size="xs" className="text-text-secondary font-medium">
              Engine Synced
            </Text>
          </Stack>
        </Stack>
      </Stack>

      {/* Slide-out Trace Stage Sheet */}
      <Sheet open={selectedStageId !== null} onOpenChange={(open) => !open && setSelectedStageId(null)}>
        <SheetContent className="w-full sm:max-w-xl bg-bg-surface border-l border-border-default text-text-primary p-6 overflow-y-auto z-[9999]">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-accent font-display text-xl flex items-center gap-2 border-b border-border-default pb-3">
              <Terminal className="w-5 h-5 text-accent" />
              Stage Trace: {activeStage?.label}
            </SheetTitle>
          </SheetHeader>

          <Stack gap={4} className="mt-4">
            <Text variant="subtext" size="xs">
              This panel displays the exact JSON payload evaluated or returned by this step in the deterministic decision core.
            </Text>

            {activeStage && (
              <Stack className="bg-bg-base border border-border-default rounded-lg p-4 overflow-x-auto max-h-[75vh]">
                <pre className="font-mono text-[11px] leading-relaxed text-cloud-100 whitespace-pre-wrap select-all">
                  {JSON.stringify(activeStage.payload, null, 2)}
                </pre>
              </Stack>
            )}
          </Stack>
        </SheetContent>
      </Sheet>
    </>
  );
}
