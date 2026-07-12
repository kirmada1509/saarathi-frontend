"use client";

import React, { useState } from "react";
import { Stack, Text, Clickable } from "@/components/ui/primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { TraceStage } from "@/core/types";
import { Database, Terminal, ArrowRight, Layers, FileCode, CheckCircle2 } from "lucide-react";

const STAGE_ICONS: Record<string, React.ReactNode> = {
  request: <Terminal className="w-4 h-4" />,
  preferences: <Layers className="w-4 h-4" />,
  constraints: <CheckCircle2 className="w-4 h-4" />,
  candidates: <Database className="w-4 h-4" />,
  tradeoffs: <FileCode className="w-4 h-4" />,
  counterfactuals: <Terminal className="w-4 h-4" />,
  verdict: <CheckCircle2 className="w-4 h-4" />,
};

export function TraceBar({ trace }: { trace: TraceStage[] }) {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  if (!trace || trace.length === 0) return null;

  const activeStage = trace.find((s) => s.id === selectedStageId);

  return (
    <>
      <Stack
        direction="row"
        align="center"
        className="sticky bottom-0 left-0 right-0 z-30 h-14 bg-bg-surface/95 border-t border-border-default px-4 sm:px-6 justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md"
      >
        <Stack direction="row" align="center" gap={3} className="w-full justify-between flex-nowrap overflow-x-auto py-1">
          <Stack direction="row" align="center" gap={2} className="min-w-30 border-r border-border-default pr-4 mr-2 shrink-0">
            <Terminal className="w-4 h-4 text-accent" />
            <Text variant="mono" size="xs" weight="bold" className="text-accent uppercase tracking-wider">
              Decision Trace
            </Text>
          </Stack>

          <Stack direction="row" align="center" gap={2} className="flex-1 justify-center flex-nowrap min-w-150">
            {trace.map((stage: TraceStage, index: number) => (
              <React.Fragment key={stage.id}>
                <Clickable
                  onClick={() => setSelectedStageId(stage.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-bg-surface-raised border border-border-default text-xs font-mono font-medium hover:border-accent/60 hover:bg-accent/5 text-text-primary transition-all cursor-pointer select-none"
                >
                  <span className="text-accent">{STAGE_ICONS[stage.id] ?? <Terminal className="w-4 h-4" />}</span>
                  <span>{stage.label}</span>
                </Clickable>
                {index < trace.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </Stack>

          <Stack direction="row" align="center" gap={2} className="min-w-32.5 justify-end border-l border-border-default pl-4 ml-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-signal-positive" />
            <Text variant="mono" size="xs" className="text-text-secondary font-medium">
              Engine synced
            </Text>
          </Stack>
        </Stack>
      </Stack>

      <Sheet open={selectedStageId !== null} onOpenChange={(open) => !open && setSelectedStageId(null)}>
        <SheetContent className="w-full sm:max-w-xl bg-bg-surface border-l border-border-default text-text-primary p-6 overflow-y-auto z-9999">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-accent font-display text-xl flex items-center gap-2 border-b border-border-default pb-3">
              <Terminal className="w-5 h-5 text-accent" />
              Stage Trace: {activeStage?.label}
            </SheetTitle>
          </SheetHeader>

          <Stack gap={4} className="mt-4">
            <Text variant="subtext" size="xs">
              The exact JSON payload evaluated or returned by this step in the deterministic decision core.
            </Text>

            {activeStage && (
              <Stack className="bg-bg-surface-raised border border-border-default rounded-lg p-4 overflow-x-auto max-h-[75vh]">
                <pre className="font-mono text-[11px] leading-relaxed text-text-primary whitespace-pre-wrap select-all">
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
