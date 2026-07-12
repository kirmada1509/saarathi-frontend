"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Stack, EmptyState, NavLink } from "@/components/ui/primitives";
import { Compass, AlertCircle, Plane } from "lucide-react";
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

export function DecisionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = parseDecisionParams(searchParams);
  const { data: users } = useUsers();

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
      <Container className="py-8">
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
              SECTION 2: Interactive Journey Timeline
          ───────────────────────────────────────────── */}
          {(activeResponse?.verdict || response?.itinerary) && (
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
              SECTION 3: AI Decision Center (tabbed)
          ───────────────────────────────────────────── */}
          {activeResponse && (
            <section ref={aiCenterRef}>
              <AIDecisionCenter
                activeResponse={activeResponse}
                activePerturbations={params.perturbations}
                onToggle={handleTogglePerturbation}
                onClear={handleClearPerturbations}
              />
            </section>
          )}

          {/* ─────────────────────────────────────────────
              SECTION 4: Alternatives
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
