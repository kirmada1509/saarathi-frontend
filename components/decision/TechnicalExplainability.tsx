"use client";

import React, { useState } from "react";
import { Stack, Text, Badge, Clickable } from "@/components/ui/primitives";
import {
  ChevronDown, ChevronRight, Terminal, Layers,
  CheckCircle2, Database, FileCode, ListFilter, Award
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { ScoreBreakdownPolygon } from "@/components/charts/ScoreBreakdownPolygon";
import type { TraceStage, ScoredFlight } from "@/core/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

const STAGE_ICONS: Record<string, React.ReactNode> = {
  request: <Terminal className="w-4 h-4" />,
  preferences: <Layers className="w-4 h-4" />,
  constraints: <CheckCircle2 className="w-4 h-4" />,
  candidates: <Database className="w-4 h-4" />,
  tradeoffs: <FileCode className="w-4 h-4" />,
  counterfactuals: <Terminal className="w-4 h-4" />,
  verdict: <CheckCircle2 className="w-4 h-4" />,
};

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, icon, badge, defaultOpen = false, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Stack gap={0} className="border border-border-default rounded-xl overflow-hidden">
      <Clickable
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 bg-bg-surface hover:bg-bg-surface-raised/30 transition-colors cursor-pointer focus:outline-none"
      >
        <Stack direction="row" align="center" gap={3}>
          <span className="text-accent">{icon}</span>
          <Text variant="heading" size="sm" className="text-text-primary font-semibold">{title}</Text>
          {badge && <Badge variant="default">{badge}</Badge>}
        </Stack>
        {open ? (
          <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
        )}
      </Clickable>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Stack className="border-t border-border-default p-5 bg-bg-surface-raised/20" gap={4}>
              {children}
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  );
}

interface TechnicalExplainabilityProps {
  trace: TraceStage[];
  ranked: ScoredFlight[];
  verdict: ScoredFlight | null;
}

export function TechnicalExplainability({ trace, ranked, verdict }: TechnicalExplainabilityProps) {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const activeStage = trace.find((s) => s.id === selectedStageId);

  return (
    <>
      <Stack gap={6}>
        {/* Section header */}
        <Stack gap={1}>
          <Text as="h2" variant="heading" size="lg" className="text-text-primary font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Technical Explainability
          </Text>
          <Text variant="subtext" size="sm">
            Advanced internals — decision trace, ranking methodology, candidate flights, and counterfactual analysis.
          </Text>
        </Stack>

        <Stack gap={3}>
          {/* Decision Trace */}
          {trace.length > 0 && (
            <AccordionSection
              title="Decision Trace"
              icon={<Terminal className="w-4 h-4" />}
              badge={`${trace.length} stages`}
            >
              <Text variant="subtext" size="xs" className="mb-3">
                Each stage represents one step in the deterministic AI decision pipeline. Click a stage to inspect its full JSON payload.
              </Text>
              <Stack direction="row" gap={2} className="flex-wrap">
                {trace.map((stage: TraceStage) => (
                  <Clickable
                    key={stage.id}
                    onClick={() => setSelectedStageId(stage.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-surface border border-border-default text-xs font-mono font-medium hover:border-accent/60 hover:bg-accent/5 text-text-primary transition-all cursor-pointer"
                  >
                    <span className="text-accent">{STAGE_ICONS[stage.id] ?? <Terminal className="w-4 h-4" />}</span>
                    {stage.label}
                  </Clickable>
                ))}
              </Stack>
            </AccordionSection>
          )}

          {/* Ranking Methodology */}
          <AccordionSection
            title="Ranking Methodology"
            icon={<Layers className="w-4 h-4" />}
          >
            <Stack gap={3}>
              <Text variant="body" size="sm" className="leading-relaxed text-text-primary/90">
                Saarathi uses a weighted multi-attribute scoring function where each flight is evaluated across six dimensions: fare price, route directness, connection convenience, cabin class alignment, airline loyalty, and baggage policy. Weights are inferred from the user&apos;s profile, historical behavior, and the parsed request text using evidence extraction.
              </Text>
              <Stack className="grid grid-cols-2 sm:grid-cols-3 gap-3" gap={0}>
                {["Price", "Directness", "Convenience", "Cabin match", "Airline loyalty", "Baggage"].map((dim) => (
                  <Stack key={dim} className="bg-bg-surface border border-border-default rounded-lg p-3" gap={1}>
                    <Text variant="mono" size="xs" weight="bold" className="text-accent">{dim}</Text>
                    <Text variant="subtext" size="xs">Weighted contribution</Text>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </AccordionSection>

          {/* All Candidate Flights */}
          {ranked.length > 0 && (
            <AccordionSection
              title={`All Candidate Flights`}
              icon={<ListFilter className="w-4 h-4" />}
              badge={`${ranked.length} ranked`}
            >
              <Text variant="subtext" size="xs" className="mb-3">
                Full ranked list of all flights evaluated. Click any row to see its score breakdown.
              </Text>
              <Stack className="border border-border-default rounded-xl overflow-hidden bg-bg-surface-raised/10" gap={0}>
                <Stack className="grid grid-cols-5 gap-2 p-3 bg-bg-surface-raised/60 border-b border-border-default text-xs font-mono font-medium text-text-secondary" gap={0}>
                  <span className="col-span-2">AIRLINE / FLIGHT</span>
                  <span>PRICE</span>
                  <span>ROUTE</span>
                  <span className="text-right">SCORE</span>
                </Stack>
                <Stack gap={0} className="divide-y divide-border-default">
                  {ranked.map((f: ScoredFlight, index: number) => {
                    const isChampion = verdict && f.flight_id === verdict.flight_id;
                    const isExpanded = expandedFlightId === f.flight_id;

                    return (
                      <Stack key={f.flight_id} gap={0}>
                        <Clickable
                          onClick={() => setExpandedFlightId(isExpanded ? null : f.flight_id)}
                          className={`grid grid-cols-5 gap-2 p-3 text-sm text-left transition-colors cursor-pointer w-full items-center ${
                            isChampion ? "bg-accent/5 hover:bg-accent/8" : "hover:bg-bg-surface-raised/40"
                          }`}
                        >
                          <span className="col-span-2 flex items-center gap-2">
                            <Text variant="mono" size="xs" className="text-text-secondary font-bold min-w-5">
                              #{index + 1}
                            </Text>
                            <Stack gap={1}>
                              <Text variant="body" size="sm" weight="medium">{f.airline_name}</Text>
                              <Text variant="mono" size="xs" className="text-text-secondary">
                                {f.airline_code} {f.flight_numbers} | {f.cabin_class}
                              </Text>
                            </Stack>
                          </span>
                          <Text variant="mono" size="sm" className="text-accent font-semibold">
                            {fmt(f.price, f.currency)}
                          </Text>
                          <Stack gap={1}>
                            <Text variant="mono" size="xs" weight="bold">
                              {f.origin} → {f.destination}
                            </Text>
                            <Text variant="subtext" size="xs" className="font-mono">
                              {fmtDur(f.duration_minutes)}
                            </Text>
                          </Stack>
                          <span className="text-right">
                            <Badge variant={isChampion ? "warning" : "default"}>
                              {Math.round(f.score * 100) / 100}
                            </Badge>
                          </span>
                        </Clickable>

                        {isExpanded && f.breakdown && (
                          <Stack className="p-4 bg-bg-surface-raised/60 border-t border-b border-border-default/60" gap={4}>
                            <Stack className="grid grid-cols-1 md:grid-cols-2 gap-4" gap={0}>
                              <ScoreBreakdownPolygon breakdown={f.breakdown} className="h-50" />
                              <Stack gap={3}>
                                <Text variant="heading" size="xs" className="text-accent font-semibold flex items-center gap-1.5">
                                  <Award className="w-3.5 h-3.5" /> Score breakdown
                                </Text>
                                <Stack gap={2}>
                                  {f.breakdown.dayBonus > 0 && (
                                    <Stack direction="row" justify="between" className="w-full" gap={0}>
                                      <Text variant="subtext" size="xs">Preferred-day bonus:</Text>
                                      <Text variant="mono" size="xs" className="text-signal-positive font-bold">
                                        +{f.breakdown.dayBonus.toFixed(2)}
                                      </Text>
                                    </Stack>
                                  )}
                                  <Stack direction="row" justify="between" className="border-t border-border-default/60 pt-2 font-bold text-accent w-full" gap={0}>
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
            </AccordionSection>
          )}

          {/* Evidence Extraction */}
          <AccordionSection
            title="Evidence Extraction"
            icon={<Database className="w-4 h-4" />}
          >
            <Text variant="body" size="sm" className="leading-relaxed text-text-primary/90">
              Preferences are extracted from three sources: the traveler&apos;s structured profile (home airport, preferred cabin, airline loyalty), raw booking history (patterns inferred from past trips), and the natural language request text. Sources are combined and weighted by signal strength — matching evidence from multiple sources produces strong signals.
            </Text>
          </AccordionSection>

          {/* Counterfactual Analysis */}
          <AccordionSection
            title="Counterfactual Analysis"
            icon={<FileCode className="w-4 h-4" />}
          >
            <Text variant="body" size="sm" className="leading-relaxed text-text-primary/90">
              For each non-winning flight, Saarathi computes the exact price or preference change that would cause it to become the winner. Price thresholds are solved using closed-form algebra on the scoring function. Preference flips are computed by toggling individual constraints and re-running the score comparison. This reveals the decision boundary with mathematical precision.
            </Text>
          </AccordionSection>
        </Stack>
      </Stack>

      {/* Trace detail sheet */}
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
              <Stack className="bg-bg-surface-raised border border-border-default rounded-lg p-4 overflow-x-auto max-h-[75vh]" gap={0}>
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
