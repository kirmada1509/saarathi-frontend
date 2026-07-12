"use client";

import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { Stack, Text, Card, Badge, Clickable } from "@/components/ui/primitives";
import { Sparkles, Scale, ToggleRight, BarChart3, Check, HelpCircle, XCircle, DollarSign, ToggleLeft } from "lucide-react";
import { PreferenceRadar } from "@/components/charts/PreferenceRadar";
import { ScoreBreakdownPolygon } from "@/components/charts/ScoreBreakdownPolygon";
import { perturbationsEqual } from "@/lib/decision-params";
import type { InferredPreference, Confidence, EvidenceItem, Counterfactual, Perturbation } from "@/core/types";

type TabId = "why" | "profile" | "tradeoffs" | "sensitivity";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Preference profile", icon: <Scale className="w-3.5 h-3.5" /> },
  { id: "tradeoffs", label: "Trade-offs", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "sensitivity", label: "Sensitivity", icon: <ToggleRight className="w-3.5 h-3.5" /> },
];

function ProfileTab({
  preference,
  confidence,
}: {
  preference: InferredPreference;
  confidence: Confidence;
}) {
  const strongSet = new Set(confidence.strongSignals);

  return (
    <Stack gap={6}>
      <Stack className="grid grid-cols-1 md:grid-cols-5 gap-6" gap={0}>
        {/* Radar chart */}
        <Stack gap={3} className="md:col-span-2 bg-bg-surface-raised/40 border border-border-default rounded-xl p-4">
          <Text variant="heading" size="xs" className="text-text-secondary uppercase tracking-wider font-semibold">
            Dimension weights
          </Text>
          <PreferenceRadar preference={preference} className="h-50 w-full" />
          <Stack gap={2} className="border-t border-border-default pt-3">
            <Stack direction="row" justify="between" gap={0}>
              <Text variant="subtext" size="xs">Cost weight</Text>
              <Text variant="mono" size="xs" weight="bold">{Math.round(preference.cost_weight * 100)}%</Text>
            </Stack>
            <Stack direction="row" justify="between" gap={0}>
              <Text variant="subtext" size="xs">Direct route weight</Text>
              <Text variant="mono" size="xs" weight="bold">{Math.round(preference.direct_weight * 100)}%</Text>
            </Stack>
            <Stack direction="row" justify="between" gap={0}>
              <Text variant="subtext" size="xs">Convenience weight</Text>
              <Text variant="mono" size="xs" weight="bold">{Math.round(preference.convenience_weight * 100)}%</Text>
            </Stack>
            <Stack className="border-t border-border-default pt-2 mt-1" gap={1}>
              <Text variant="subtext" size="xs" className="font-semibold">Constraints</Text>
              <Text variant="mono" size="xs">Max layover: {preference.max_layover_minutes}m</Text>
              <Text variant="mono" size="xs">Redeye: {preference.avoid_redeye ? "Avoided" : "Allowed"}</Text>
              {preference.preferred_cabin && (
                <Text variant="mono" size="xs">Cabin: {preference.preferred_cabin}</Text>
              )}
            </Stack>
          </Stack>
        </Stack>

        {/* Evidence list */}
        <Stack gap={3} className="md:col-span-3">
          <Stack direction="row" justify="between" align="center" gap={0}>
            <Text variant="heading" size="xs" className="text-text-secondary uppercase tracking-wider font-semibold">
              Extracted signals
            </Text>
            <Badge variant="default">{preference.evidence.length} indicators</Badge>
          </Stack>
          <Stack className="border border-border-default rounded-xl overflow-hidden max-h-85 overflow-y-auto" gap={0}>
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
                      <span className="mt-0.5 shrink-0 bg-signal-positive/10 border border-signal-positive/30 rounded p-0.5 flex items-center justify-center">
                        <Check className="w-3 h-3 text-signal-positive" />
                      </span>
                    ) : (
                      <span className="mt-0.5 shrink-0 bg-bg-surface-raised border border-border-default rounded p-0.5 flex items-center justify-center">
                        <HelpCircle className="w-3 h-3 text-text-secondary" />
                      </span>
                    )}
                    <Stack gap={1} className="flex-1 min-w-0">
                      <Text variant="body" size="sm" className="text-text-primary/95 leading-snug">{item.text}</Text>
                      <Stack direction="row" align="center" gap={2}>
                        <Text variant="mono" size="xs" className="text-accent">{item.dimension}</Text>
                        <span className="text-text-secondary opacity-50">·</span>
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
  );
}

function TradeoffsTab({ breakdown }: { breakdown?: Record<string, number> }) {
  if (!breakdown) {
    return (
      <Stack align="center" justify="center" className="py-12" gap={2}>
        <Text variant="subtext" className="italic">Score breakdown not available for this result.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Text variant="subtext" size="sm">
        Multi-attribute score contributions shown as a polygonal alignment footprint. A larger, well-balanced polygon indicates better overall coverage of traveler preferences.
      </Text>
      <ScoreBreakdownPolygon breakdown={breakdown} className="h-60" />
    </Stack>
  );
}

function SensitivityTab({
  counterfactuals,
  activePerturbations,
  hasVerdict,
  onToggle,
  onClear,
  originalVerdict,
  currentVerdict,
}: {
  counterfactuals: Counterfactual[];
  activePerturbations: Perturbation[];
  hasVerdict: boolean;
  onToggle: (p: Perturbation) => void;
  onClear: () => void;
  originalVerdict: import("@/core/types").ScoredFlight | null;
  currentVerdict: import("@/core/types").ScoredFlight | null;
}) {
  const isActive = (p: Perturbation) =>
    activePerturbations.some((item) => perturbationsEqual(item, p));

  const priceDrops = counterfactuals.filter((cf) => cf.perturbation.kind === "price_drop");
  const toggleFlips = counterfactuals.filter((cf) => cf.perturbation.kind !== "price_drop");

  return (
    <Stack gap={6}>
      {activePerturbations.length > 0 && (
        <Card className="bg-accent/5 border border-accent/20 p-4 rounded-xl">
          <Stack gap={4}>
            <Stack direction="row" align="center" justify="between" gap={3} className="border-b border-border-default/40 pb-2">
              <Stack direction="row" align="center" gap={2}>
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                <Text variant="heading" size="xs" className="text-accent uppercase tracking-wider font-semibold">
                  Simulation Comparison
                </Text>
              </Stack>
              {originalVerdict && currentVerdict && originalVerdict.flight_id === currentVerdict.flight_id ? (
                <Badge variant="default" className="text-[10px] bg-bg-surface-raised border border-border-default text-text-secondary select-none">
                  Unchanged
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px] select-none animate-pulse">
                  Recommendation Flipped
                </Badge>
              )}
            </Stack>

            {originalVerdict && currentVerdict && originalVerdict.flight_id === currentVerdict.flight_id ? (
              <Text variant="body" size="xs" className="text-text-secondary font-medium leading-relaxed">
                The recommended flight remains unchanged under this scenario.
              </Text>
            ) : (
              <Text variant="body" size="xs" className="text-accent font-semibold leading-relaxed">
                The recommendation flipped from the original choice to a new optimal option!
              </Text>
            )}

            <Stack className="grid grid-cols-1 md:grid-cols-3 gap-4" gap={0}>
              {/* Original Flight */}
              <Stack gap={1} className="bg-bg-surface-raised/40 p-3 rounded-lg border border-border-default/60">
                <Text variant="subtext" size="xs" className="uppercase font-mono text-[10px]">Original Flight</Text>
                {originalVerdict ? (
                  <Stack gap={1}>
                    <Text variant="body" size="sm" className="font-bold text-text-primary">
                      {originalVerdict.airline_name} {originalVerdict.flight_numbers}
                    </Text>
                    <Text variant="subtext" size="xs">
                      {originalVerdict.stops === 0 ? "Nonstop" : `${originalVerdict.stops} stop(s)`} · ${originalVerdict.price}
                    </Text>
                  </Stack>
                ) : (
                  <Text variant="body" size="sm" className="italic text-text-secondary">No matching flight</Text>
                )}
              </Stack>

              {/* Perturbation Details */}
              <Stack gap={1} className="bg-bg-surface-raised/40 p-3 rounded-lg border border-border-default/60 justify-center">
                <Text variant="subtext" size="xs" className="uppercase font-mono text-[10px]">Applied Scenario</Text>
                <Stack gap={1}>
                  {activePerturbations.map((p, idx) => {
                    let desc = "";
                    if (p.kind === "price_drop") {
                      desc = `Price for flight ${p.flightId.substring(0, 6)} drops to $${p.toPrice}`;
                    } else if (p.kind === "accept_one_stop") {
                      desc = "Willing to accept 1-stop flights";
                    } else if (p.kind === "bags_matter") {
                      desc = "Baggage inclusion is required";
                    } else if (p.kind === "evening_ok") {
                      desc = "Evening departures acceptable";
                    } else if (p.kind === "ignore_loyalty") {
                      desc = "Ignoring loyalty preferences";
                    } else if (p.kind === "shift_dates") {
                      desc = `Shift travel dates by ${p.days} day(s)`;
                    }
                    return (
                      <Text key={idx} variant="body" size="sm" className="font-medium text-accent">
                        • {desc}
                      </Text>
                    );
                  })}
                </Stack>
              </Stack>

              {/* New Flight */}
              <Stack gap={1} className="bg-bg-surface-raised/40 p-3 rounded-lg border border-border-default/60">
                <Text variant="subtext" size="xs" className="uppercase font-mono text-[10px]">New Recommendation</Text>
                {currentVerdict ? (
                  <Stack gap={1}>
                    <Text variant="body" size="sm" className="font-bold text-accent">
                      {currentVerdict.airline_name} {currentVerdict.flight_numbers}
                    </Text>
                    <Text variant="subtext" size="xs" className="text-text-primary">
                      {currentVerdict.stops === 0 ? "Nonstop" : `${currentVerdict.stops} stop(s)`} · ${currentVerdict.price}
                    </Text>
                  </Stack>
                ) : (
                  <Text variant="body" size="sm" className="italic text-signal-negative">No flight fits constraints</Text>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Card>
      )}
      <Stack direction="row" align="center" justify="between" gap={3} className="flex-wrap">
        <Text variant="subtext" size="sm">
          Toggle scenarios below to simulate how changing your preferences or constraints would affect the recommendation. Active scenarios recalculate the result instantly.
        </Text>
        {activePerturbations.length > 0 && (
          <Clickable
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-mono text-signal-negative hover:underline cursor-pointer bg-signal-negative/10 border border-signal-negative/20 px-2.5 py-1 rounded-lg transition-all"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reset all
          </Clickable>
        )}
      </Stack>

      <Stack className="grid grid-cols-1 md:grid-cols-2 gap-6" gap={0}>
        {/* Toggle scenarios */}
        <Stack gap={3}>
          <Stack direction="row" align="center" gap={2}>
            <ToggleLeft className="w-4 h-4 text-accent" />
            <Text variant="heading" size="sm" className="text-accent font-semibold">
              Preference toggles
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
                    className={`w-full text-left p-3.5 rounded-xl border text-sm flex items-start justify-between gap-3 transition-all cursor-pointer ${
                      active
                        ? "bg-accent/8 border-accent text-text-primary shadow-sm"
                        : cf.flips
                        ? "bg-bg-surface-raised/40 border-border-default text-text-primary hover:border-accent/50"
                        : "bg-bg-surface-raised/10 border-border-default/60 text-text-secondary opacity-70 hover:opacity-90"
                    }`}
                  >
                    <Stack gap={1} className="flex-1">
                      <Text variant="body" size="sm" className="font-medium text-left">{cf.label}</Text>
                      <Text variant="subtext" size="xs" className="text-left font-mono">
                        {cf.flips ? "⚡ Flips the winner" : "No change to winner"}
                      </Text>
                    </Stack>
                    {active ? (
                      <span className="bg-accent text-text-on-accent rounded-full p-0.5 mt-0.5 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </span>
                    ) : (
                      cf.flips && (
                        <Badge variant="warning" className="text-[9px] mt-0.5 select-none shrink-0">
                          High impact
                        </Badge>
                      )
                    )}
                  </Clickable>
                );
              })
            ) : (
              <Text variant="subtext" className="italic py-4">No preference toggles computed.</Text>
            )}
          </Stack>
        </Stack>

        {/* Price thresholds */}
        <Stack gap={3}>
          <Stack direction="row" align="center" gap={2}>
            <DollarSign className="w-4 h-4 text-accent" />
            <Text variant="heading" size="sm" className="text-accent font-semibold">
              Competitor price thresholds
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
                    className={`w-full text-left p-3.5 rounded-xl border text-sm flex items-start justify-between gap-3 transition-all cursor-pointer ${
                      active
                        ? "bg-accent/8 border-accent text-text-primary shadow-sm"
                        : cf.flips
                        ? "bg-bg-surface-raised/40 border-border-default text-text-primary hover:border-accent/50"
                        : "bg-bg-surface-raised/10 border-border-default/60 text-text-secondary opacity-70 hover:opacity-90"
                    }`}
                  >
                    <Stack gap={1} className="flex-1">
                      <Text variant="body" size="sm" className="font-medium text-left">{cf.label}</Text>
                      <Text variant="subtext" size="xs" className="text-left font-mono">
                        {cf.flips ? "✓ Achievable threshold" : "Unrealistic price change"}
                      </Text>
                    </Stack>
                    {active ? (
                      <span className="bg-accent text-text-on-accent rounded-full p-0.5 mt-0.5 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </span>
                    ) : (
                      cf.flips && (
                        <Badge variant="success" className="text-[9px] mt-0.5 select-none shrink-0">
                          Achievable
                        </Badge>
                      )
                    )}
                  </Clickable>
                );
              })
            ) : (
              <Text variant="subtext" className="italic py-4 text-text-secondary">
                {hasVerdict
                  ? "Cost weight sensitivity is 0. No price thresholds would change the verdict."
                  : "No flights scored. Price thresholds require at least one base result."}
              </Text>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}

interface AIDecisionCenterProps {
  activeResponse: {
    explanation: string;
    preference: InferredPreference;
    confidence: Confidence;
    counterfactuals: Counterfactual[];
    verdict: import("@/core/types").ScoredFlight | null;
  };
  activePerturbations: Perturbation[];
  onToggle: (p: Perturbation) => void;
  onClear: () => void;
  originalVerdict: import("@/core/types").ScoredFlight | null;
}

export function AIDecisionCenter({
  activeResponse,
  activePerturbations,
  onToggle,
  onClear,
  originalVerdict,
}: AIDecisionCenterProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const verdictBreakdown = activeResponse.verdict?.breakdown;

  return (
    <Card className="bg-bg-surface border-border-default overflow-hidden">
      <Stack gap={0}>
        {/* Section header */}
        <Stack gap={1} className="pb-5 border-b border-border-default">
          <Stack direction="row" align="center" gap={2}>
            <Sparkles className="w-5 h-5 text-accent" />
            <Text as="h2" variant="heading" size="lg" className="text-text-primary font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Analysis & Trade-offs
            </Text>
          </Stack>
          <Text variant="subtext" size="sm">
            Explainability, preference analysis, trade-offs and sensitivity scenarios
          </Text>
        </Stack>

        {/* Tabs */}
        <Stack className="border-b border-border-default" gap={0}>
          <Stack direction="row" gap={0} className="flex-wrap">
            {TABS.map((tab) => (
              <Clickable
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap focus:outline-none ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
                }`}
              >
                <span className={activeTab === tab.id ? "text-accent" : "text-text-secondary"}>
                  {tab.icon}
                </span>
                {tab.label}
                {tab.id === "sensitivity" && activePerturbations.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-text-on-accent text-[10px] font-bold">
                    {activePerturbations.length}
                  </span>
                )}
              </Clickable>
            ))}
          </Stack>
        </Stack>

        {/* Tab content */}
        <Stack className="pt-5" gap={0}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "profile" && (
                <ProfileTab preference={activeResponse.preference} confidence={activeResponse.confidence} />
              )}
              {activeTab === "tradeoffs" && (
                <TradeoffsTab breakdown={verdictBreakdown} />
              )}
              {activeTab === "sensitivity" && (
                <SensitivityTab
                  counterfactuals={activeResponse.counterfactuals}
                  activePerturbations={activePerturbations}
                  hasVerdict={!!activeResponse.verdict}
                  onToggle={onToggle}
                  onClear={onClear}
                  originalVerdict={originalVerdict}
                  currentVerdict={activeResponse.verdict}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Stack>
      </Stack>
    </Card>
  );
}
