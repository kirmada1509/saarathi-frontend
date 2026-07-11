"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Stack, EmptyState, NavLink } from "@/components/ui/primitives";
import { Compass } from "lucide-react";
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
          destination: params.destination,
          cities: params.cities,
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

          {mapLegs.length > 0 && (
            <Stack className="h-[320px] rounded-lg overflow-hidden border border-border-default">
              <RouteMap legs={mapLegs} className="h-full w-full" />
            </Stack>
          )}

          <VerdictCard
            response={response}
            activeResponse={activeResponse}
            isLoading={isLoading || (isMultiCity && legLoading && !legResponse)}
          />

          {activeResponse && (
            <>
              <Stack className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <EvidencePanel preference={activeResponse.preference} confidence={activeResponse.confidence} />
                <CounterfactualPanel
                  counterfactuals={activeResponse.counterfactuals}
                  activePerturbations={params.perturbations}
                  hasVerdict={!!activeResponse.verdict}
                  onToggle={handleTogglePerturbation}
                  onClear={handleClearPerturbations}
                />
              </Stack>

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
