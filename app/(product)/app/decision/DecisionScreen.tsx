"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Stack, EmptyState, NavLink, Card, Text } from "@/components/ui/primitives";
import { Compass, Sparkles } from "lucide-react";
import { parseDecisionParams, buildDecisionQuery, perturbationsEqual } from "@/lib/decision-params";
import { useRecommendation, useLegRecommendation, useUsers } from "@/lib/queries";
import { DecisionHeader } from "@/components/decision/DecisionHeader";
import { ItineraryTimeline } from "@/components/decision/ItineraryTimeline";
import { VerdictCard } from "@/components/decision/VerdictCard";
import { EvidencePanel } from "@/components/decision/EvidencePanel";
import { OpportunityCostPanel } from "@/components/decision/OpportunityCostPanel";
import { CounterfactualPanel } from "@/components/decision/CounterfactualPanel";
import { RankedList } from "@/components/decision/RankedList";
import { TraceBar } from "@/components/decision/TraceBar";
import { ConfidenceGauge } from "@/components/charts/ConfidenceGauge";
import type { Perturbation } from "@/core/types";

const RouteMap = dynamic(() => import("@/components/map/RouteMap").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <Stack className="h-full w-full animate-pulse bg-bg-surface-raised" />,
});

export function DecisionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = parseDecisionParams(searchParams);
  const { data: users } = useUsers();

  const { data: response, isLoading, error } = useRecommendation(
    params
      ? {
          userId: params.userId,
          requestText: params.requestText,
          origin: params.origin,
          destination: params.destination,
          cities: params.cities,
          stayDurations: params.stayDurations,
          perturbations: params.perturbations,
        }
      : null
  );

  const isMultiCity = response?.mode === "multi-city";
  const legIndex = params?.leg ?? 0;
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
          perturbations: params.perturbations,
        }
      : null
  );

  const activeResponse = isMultiCity ? legResponse : response;

  function updateUrl(overrides: Partial<{ perturbations: Perturbation[]; leg: number }>) {
    if (!params) return;
    const query = buildDecisionQuery({ ...params, ...overrides });
    router.replace(`/app/decision?${query}`);
  }

  function handleTogglePerturbation(p: Perturbation) {
    if (!params) return;
    const exists = params.perturbations.some((item) => perturbationsEqual(item, p));
    const next = exists
      ? params.perturbations.filter((item) => !perturbationsEqual(item, p))
      : [...params.perturbations, p];
    updateUrl({ perturbations: next });
  }

  function handleClearPerturbations() {
    updateUrl({ perturbations: [] });
  }

  function handleSelectLeg(index: number) {
    updateUrl({ leg: index });
  }

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

  const mapLegs = isMultiCity && response?.itinerary
    ? response.itinerary.legs.map((l, i) => ({ from: l.from, to: l.to, active: i === legIndex }))
    : activeResponse?.verdict
    ? [{ from: activeResponse.verdict.origin, to: activeResponse.verdict.destination, active: true }]
    : [];

  return (
    <Stack className="pb-20">
      <Container className="py-6">
        <Stack gap={6}>
          <DecisionHeader params={params} user={user} mode={response?.mode} />

          {error && (
            <EmptyState
              title="Request failed"
              description={error instanceof Error ? error.message : String(error)}
            />
          )}

          {isMultiCity && response?.itinerary && (
            <ItineraryTimeline
              itinerary={response.itinerary}
              selectedLegIndex={legIndex}
              onSelectLeg={handleSelectLeg}
              legLoading={legLoading}
            />
          )}

          <VerdictCard
            response={response}
            activeResponse={activeResponse}
            isLoading={isLoading || (isMultiCity && legLoading && !legResponse)}
          />

          {activeResponse && (
            <Stack className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column (2/3 width) */}
              <Stack gap={6} className="lg:col-span-2">
                {/* AI Rationale & Explanation */}
                <Card className="bg-bg-surface border-border-default p-5 h-full">
                  <Stack gap={4}>
                    <Stack direction="row" align="center" gap={2} className="border-b border-border-default pb-3">
                      <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                      <Text variant="heading" size="lg" className="text-text-primary font-bold">
                        AI Rationale & Explanation
                      </Text>
                    </Stack>
                    <div className="prose dark:prose-invert max-w-none">
                      <Text variant="body" size="sm" className="leading-relaxed text-text-primary/95 whitespace-pre-wrap">
                        {activeResponse.explanation}
                      </Text>
                    </div>
                  </Stack>
                </Card>

                {/* PreferenceRadar & Evidence profile */}
                <EvidencePanel preference={activeResponse.preference} confidence={activeResponse.confidence} />

                {/* Counterfactual Panel */}
                <CounterfactualPanel
                  counterfactuals={activeResponse.counterfactuals}
                  activePerturbations={params.perturbations}
                  hasVerdict={!!activeResponse.verdict}
                  onToggle={handleTogglePerturbation}
                  onClear={handleClearPerturbations}
                />
              </Stack>

              {/* Sidebar Column (1/3 width) */}
              <Stack gap={6} className="lg:col-span-1">
                {/* Compact Route Map */}
                {mapLegs.length > 0 && (
                  <Card className="bg-bg-surface border-border-default overflow-hidden h-[280px]">
                    <Stack gap={2} className="h-full">
                      <Text variant="heading" size="sm" className="px-4 pt-3 font-semibold text-text-primary">
                        Route Trajectory Map
                      </Text>
                      <div className="flex-1 rounded-b-lg overflow-hidden border-t border-border-default">
                        <RouteMap legs={mapLegs} className="h-full w-full" />
                      </div>
                    </Stack>
                  </Card>
                )}

                {/* Confidence Gauge */}
                <Card className="bg-bg-surface border-border-default p-5 flex flex-col items-center justify-center">
                  <Text variant="heading" size="sm" className="w-full text-left font-semibold text-text-primary border-b border-border-default pb-2 mb-4">
                    Scoring Match Confidence
                  </Text>
                  <ConfidenceGauge confidence={activeResponse.confidence} />
                </Card>
              </Stack>
            </Stack>
          )}

          {activeResponse && (
            <>
              <OpportunityCostPanel alternatives={activeResponse.alternatives} verdict={activeResponse.verdict} />
              <RankedList ranked={activeResponse.ranked} verdict={activeResponse.verdict} />
            </>
          )}
        </Stack>
      </Container>

      {response && <TraceBar trace={response.trace} />}
    </Stack>
  );
}
