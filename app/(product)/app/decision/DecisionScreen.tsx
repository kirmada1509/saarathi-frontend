"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Stack, EmptyState, NavLink, Card, Badge, Clickable, Text } from "@/components/ui/primitives";
import { Compass, AlertCircle, Plane, Sparkles } from "lucide-react";
import { parseDecisionParams, buildDecisionQuery, perturbationsEqual } from "@/lib/decision-params";
import { useRecommendation, useLegRecommendation, useUsers } from "@/lib/queries";
import { ExecutiveSummary } from "@/components/decision/ExecutiveSummary";
import { JourneyTimeline } from "@/components/decision/JourneyTimeline";
import { AIDecisionCenter } from "@/components/decision/AIDecisionCenter";
import { AlternativesPanel } from "@/components/decision/AlternativesPanel";
import { TechnicalExplainability } from "@/components/decision/TechnicalExplainability";
import { StickyNav } from "@/components/decision/StickyNav";
import type { Perturbation } from "@/core/types";
import type { SectionId } from "@/components/decision/StickyNav";
import { toast } from "sonner";

export function DecisionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = parseDecisionParams(searchParams);
  const { data: users } = useUsers();

  // 1. Maintain local state for perturbations and legIndex to guarantee instant reactivity
  const [perturbations, setPerturbations] = React.useState<Perturbation[]>([]);
  const [legIndex, setLegIndex] = React.useState<number>(0);

  // Sync state from URL when URL is initially parsed or changes (e.g. initial mount or back button)
  React.useEffect(() => {
    if (params) {
      setPerturbations(params.perturbations || []);
      setLegIndex(params.leg || 0);
    }
  }, [searchParams]);

  // Section refs for scroll-to behavior
  const summaryRef = React.useRef<HTMLElement>(null);
  const journeyRef = React.useRef<HTMLElement>(null);
  const aiCenterRef = React.useRef<HTMLElement>(null);
  const alternativesRef = React.useRef<HTMLElement>(null);
  const technicalRef = React.useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("summary");

  const { data: response, isLoading, error } = useRecommendation(
    params
      ? {
          userId: params.userId,
          requestText: params.requestText,
          origin: params.origin,
          destination: params.destination,
          cities: params.cities,
          stayDurations: params.stayDurations,
          perturbations: perturbations, // reactive state
        }
      : null
  );

  const isMultiCity = response?.mode === "multi-city";
  const activeLeg =
    isMultiCity && response?.itinerary
      ? response.itinerary.legs[legIndex] ?? response.itinerary.legs[0]
      : null;

  const { data: legResponse, isLoading: legLoading } = useLegRecommendation(
    isMultiCity && activeLeg && params
      ? {
          userId: params.userId,
          requestText: params.requestText,
          origin: activeLeg.from,
          destination: activeLeg.to,
          perturbations: perturbations, // reactive state
        }
      : null
  );

  const activeResponse = isMultiCity ? legResponse : response;

  const { data: originalResponse } = useRecommendation(
    params && perturbations.length > 0
      ? {
          userId: params.userId,
          requestText: params.requestText,
          origin: params.origin,
          destination: params.destination,
          cities: params.cities,
          stayDurations: params.stayDurations,
          perturbations: [], // original (unperturbed)
        }
      : null
  );

  const { data: originalLegResponse } = useLegRecommendation(
    isMultiCity && activeLeg && params && perturbations.length > 0
      ? {
          userId: params.userId,
          requestText: params.requestText,
          origin: activeLeg.from,
          destination: activeLeg.to,
          perturbations: [], // original (unperturbed)
        }
      : null
  );

  const originalVerdict = perturbations.length > 0
    ? (isMultiCity ? originalLegResponse?.verdict : originalResponse?.verdict) ?? null
    : activeResponse?.verdict ?? null;

  React.useEffect(() => {
    if (response?.warnings) {
      response.warnings.forEach((warning) => {
        toast.warning(warning, { id: warning });
      });
    }
  }, [response?.warnings]);

  React.useEffect(() => {
    if (legResponse?.warnings) {
      legResponse.warnings.forEach((warning) => {
        toast.warning(warning, { id: warning });
      });
    }
  }, [legResponse?.warnings]);

  React.useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : String(error), { id: 'recommend-error' });
    }
  }, [error]);

  function updateUrl(nextPerturbations: Perturbation[], nextLeg: number) {
    if (!params) return;
    const query = buildDecisionQuery({
      ...params,
      perturbations: nextPerturbations,
      leg: nextLeg,
    });
    router.replace(`/app/decision?${query}`, { scroll: false });
  }

  function handleTogglePerturbation(p: Perturbation) {
    const exists = perturbations.some((item) => perturbationsEqual(item, p));
    const next = exists
      ? perturbations.filter((item) => !perturbationsEqual(item, p))
      : [...perturbations, p];
    setPerturbations(next);
    updateUrl(next, legIndex);
  }

  function handleClearPerturbations() {
    setPerturbations([]);
    updateUrl([], legIndex);
  }

  function handleSelectLeg(index: number) {
    setLegIndex(index);
    updateUrl(perturbations, index);
  }

  function handleScrollToSection(sectionId: SectionId) {
    const refMap: Record<SectionId, React.RefObject<HTMLElement | null>> = {
      summary: summaryRef,
      journey: journeyRef,
      "ai-center": aiCenterRef,
      alternatives: alternativesRef,
      technical: technicalRef,
    };
    const ref = refMap[sectionId];
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  }

  // Observe which section is in view
  React.useEffect(() => {
    const refs = [
      { id: "summary" as SectionId, ref: summaryRef },
      { id: "journey" as SectionId, ref: journeyRef },
      { id: "ai-center" as SectionId, ref: aiCenterRef },
      { id: "alternatives" as SectionId, ref: alternativesRef },
      { id: "technical" as SectionId, ref: technicalRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const found = refs.find((r) => r.ref.current === entry.target);
            if (found) setActiveSection(found.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    for (const { ref } of refs) {
      if (ref.current) observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [activeResponse]);

  if (!params) {
    return (
      <Container className="py-16">
        <EmptyState
          title="No request to analyze"
          description="Compose a travel request first — the Decision Screen needs a traveler and a request to run the deterministic scoring engine."
          icon={<Compass className="w-12 h-12 text-text-secondary opacity-40" />}
        >
          <NavLink
            href="/app"
            active={false}
            className="mt-4 inline-flex border border-border-default rounded-md px-4 py-2 hover:border-accent hover:text-accent"
          >
            Go to composer
          </NavLink>
        </EmptyState>
      </Container>
    );
  }

  const user = users?.find((u) => u.user_id === params.userId);
  const isPageLoading = isLoading || (isMultiCity && legLoading && !legResponse);

  return (
    <Stack className="pb-20 min-h-screen bg-bg-base">
      <Container className="py-8 flex-1">
        <Stack gap={8}>
          {/* Error state */}
          {error && (
            <EmptyState
              title="Request failed"
              description={error instanceof Error ? error.message : String(error)}
              icon={<AlertCircle className="w-12 h-12 text-signal-negative opacity-60" />}
            />
          )}

          {/* No results state */}
          {!isPageLoading && response && !response.verdict && !isMultiCity && (
            <EmptyState
              title="Zero matching flights found"
              description="No flights in the inventory matched this traveler's strict constraints. Try relaxing constraints in the Sensitivity tab of the AI Decision Center."
              icon={<Plane className="w-12 h-12 text-signal-negative opacity-60" />}
              className="border-signal-negative/30"
            />
          )}

          {/* Active Simulation Comparison Alert Banner */}
          {!isPageLoading && response && perturbations.length > 0 && (
            <Card className="bg-accent/5 border border-accent/20 p-4 rounded-xl relative overflow-hidden">
              <span className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
              <Stack gap={3}>
                <Stack direction="row" align="center" justify="between" gap={3} className="flex-wrap">
                  <Stack direction="row" align="center" gap={2}>
                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                    <Text variant="heading" size="sm" className="text-text-primary font-bold">
                      Active Simulation
                    </Text>
                  </Stack>
                  <Clickable
                    onClick={handleClearPerturbations}
                    className="text-xs font-mono text-signal-negative hover:underline cursor-pointer bg-signal-negative/10 border border-signal-negative/20 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Reset Simulation
                  </Clickable>
                </Stack>

                <Stack gap={2}>
                  {originalVerdict && response.verdict && originalVerdict.flight_id === response.verdict.flight_id ? (
                    <Stack direction="row" align="center" gap={2} className="flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-bg-surface-raised border border-border-default px-2 py-0.5 text-xs font-medium text-text-secondary select-none">
                        Unchanged
                      </span>
                      <Text variant="body" size="sm" className="text-text-secondary leading-snug">
                        The recommended option remains the same: <strong className="text-text-primary">{originalVerdict.airline_name} {originalVerdict.flight_numbers}</strong> (${originalVerdict.price.toFixed(0)}).
                      </Text>
                    </Stack>
                  ) : (
                    <Stack direction="row" align="center" gap={2} className="flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-xs font-bold text-accent select-none animate-pulse">
                        Recommendation Flipped
                      </span>
                      <Text variant="body" size="sm" className="text-text-secondary leading-snug">
                        Flipped from <span className="line-through">{originalVerdict ? `${originalVerdict.airline_name} ${originalVerdict.flight_numbers}` : "No flight"}</span> to <strong className="text-accent">{response.verdict ? `${response.verdict.airline_name} ${response.verdict.flight_numbers}` : "No flight"}</strong> (${response.verdict?.price.toFixed(0)}).
                      </Text>
                    </Stack>
                  )}

                  {/* Flight Metric comparisons */}
                  {originalVerdict && response.verdict && (
                    <Stack direction="row" gap={4} className="mt-2 flex-wrap text-xs text-text-secondary border-t border-border-default/30 pt-2">
                      {/* Price Difference */}
                      <Stack gap={1}>
                        <span className="font-semibold text-text-primary uppercase tracking-wider text-[9px] font-mono">Price</span>
                        <Text variant="mono" size="xs">
                          {originalVerdict.price === response.verdict.price ? (
                            `$${originalVerdict.price.toFixed(0)}`
                          ) : (
                            <span>
                              ${originalVerdict.price.toFixed(0)} &rarr;{" "}
                              <strong className="text-accent font-bold">${response.verdict.price.toFixed(0)}</strong>{" "}
                              ({response.verdict.price - originalVerdict.price > 0 ? "+" : ""}${(response.verdict.price - originalVerdict.price).toFixed(0)})
                            </span>
                          )}
                        </Text>
                      </Stack>

                      {/* Duration Difference */}
                      <Stack gap={1}>
                        <span className="font-semibold text-text-primary uppercase tracking-wider text-[9px] font-mono">Duration</span>
                        <Text variant="mono" size="xs">
                          {originalVerdict.duration_minutes === response.verdict.duration_minutes ? (
                            `${(originalVerdict.duration_minutes / 60).toFixed(1)}h`
                          ) : (
                            <span>
                              ${(originalVerdict.duration_minutes / 60).toFixed(1)}h &rarr;{" "}
                              <strong className="text-accent font-bold">${(response.verdict.duration_minutes / 60).toFixed(1)}h</strong>{" "}
                              ({response.verdict.duration_minutes - originalVerdict.duration_minutes > 0 ? "+" : ""}{((response.verdict.duration_minutes - originalVerdict.duration_minutes) / 60).toFixed(1)}h)
                            </span>
                          )}
                        </Text>
                      </Stack>

                      {/* Stops Difference */}
                      <Stack gap={1}>
                        <span className="font-semibold text-text-primary uppercase tracking-wider text-[9px] font-mono">Stops</span>
                        <Text variant="mono" size="xs">
                          {originalVerdict.stops === response.verdict.stops ? (
                            originalVerdict.stops === 0 ? "Nonstop" : `${originalVerdict.stops} stop(s)`
                          ) : (
                            <span>
                              {originalVerdict.stops === 0 ? "Nonstop" : `${originalVerdict.stops} stop(s)`} &rarr;{" "}
                              <strong className="text-accent font-bold">
                                {response.verdict.stops === 0 ? "Nonstop" : `${response.verdict.stops} stop(s)`}
                              </strong>
                            </span>
                          )}
                        </Text>
                      </Stack>

                      {/* Airline / Service Difference */}
                      {(originalVerdict.airline_code !== response.verdict.airline_code || originalVerdict.cabin_class !== response.verdict.cabin_class) && (
                        <Stack gap={1}>
                          <span className="font-semibold text-text-primary uppercase tracking-wider text-[9px] font-mono">Service</span>
                          <Text variant="body" size="xs" className="font-medium text-text-secondary">
                            {originalVerdict.airline_name} ({originalVerdict.cabin_class}) &rarr;{" "}
                            <strong className="text-accent font-semibold">
                              {response.verdict.airline_name} ({response.verdict.cabin_class})
                            </strong>
                          </Text>
                        </Stack>
                      )}
                    </Stack>
                  )}

                  <Stack direction="row" align="start" gap={2} className="mt-1">
                    <Text variant="subtext" size="xs" className="font-semibold text-text-secondary uppercase tracking-wide font-mono text-[9px] shrink-0 mt-0.5">
                      Scenarios:
                    </Text>
                    <Stack gap={1} className="flex-1">
                      {perturbations.map((p, idx) => {
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
                          <Text key={idx} variant="subtext" size="xs" className="text-text-secondary">
                            • {desc}
                          </Text>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          )}

          {/* ─────────────────────────────────────────────
              SECTION 2: Interactive Journey Timeline (Moved to top for Multi-City)
          ───────────────────────────────────────────── */}
          {isMultiCity && response?.itinerary && (
            <section ref={journeyRef}>
              <JourneyTimeline
                response={response}
                activeResponse={activeResponse}
                selectedLegIndex={legIndex}
                onSelectLeg={handleSelectLeg}
                legLoading={legLoading}
              />
            </section>
          )}

          {/* ─────────────────────────────────────────────
              SECTION 1: Executive Summary (Hero)
          ───────────────────────────────────────────── */}
          <section ref={summaryRef}>
            <ExecutiveSummary
              response={response}
              activeResponse={activeResponse}
              isLoading={isPageLoading}
              user={user}
              onScrollToAlternatives={() => handleScrollToSection("alternatives")}
            />
          </section>

          {/* ─────────────────────────────────────────────
              SECTION 3: Alternatives
          ───────────────────────────────────────────── */}
          {activeResponse && activeResponse.alternatives.length > 0 && (
            <section ref={alternativesRef}>
              <AlternativesPanel
                alternatives={activeResponse.alternatives}
                verdict={activeResponse.verdict}
              />
            </section>
          )}

          {/* ─────────────────────────────────────────────
              SECTION 4: AI Decision Center (tabbed)
          ───────────────────────────────────────────── */}
          {activeResponse && (
            <section ref={aiCenterRef}>
              <AIDecisionCenter
                activeResponse={activeResponse}
                activePerturbations={params.perturbations}
                onToggle={handleTogglePerturbation}
                onClear={handleClearPerturbations}
                originalVerdict={originalVerdict}
              />
            </section>
          )}

          {/* ─────────────────────────────────────────────
              SECTION 5: Technical Explainability
          ───────────────────────────────────────────── */}
          {activeResponse && (
            <section ref={technicalRef}>
              <TechnicalExplainability
                trace={response?.trace ?? []}
                ranked={activeResponse.ranked}
                verdict={activeResponse.verdict}
              />
            </section>
          )}
        </Stack>
      </Container>

      {/* Sticky navigation bar */}
      <StickyNav
        activeSection={activeSection}
        onNavigate={handleScrollToSection}
        engineSynced={!isLoading && !legLoading}
      />
    </Stack>
  );
}
