"use client";

import React from "react";
import { Container, Stack } from "@/components/ui/primitives";
import { Header } from "@/components/decision/Header";
import { ItineraryTimeline } from "@/components/decision/ItineraryTimeline";
import { VerdictCard } from "@/components/decision/VerdictCard";
import { EvidencePanel } from "@/components/decision/EvidencePanel";
import { OpportunityCostPanel } from "@/components/decision/OpportunityCostPanel";
import { CounterfactualPanel } from "@/components/decision/CounterfactualPanel";
import { RankedList } from "@/components/decision/RankedList";
import { TraceBar } from "@/components/decision/TraceBar";

export default function Home() {
  return (
    <Stack className="min-h-screen bg-bg-base text-text-primary pb-28 pt-6">
      <Container>
        <Stack gap={6}>
          {/* Header Picker & Input */}
          <Header />

          {/* Multi-City Leg Timeline */}
          <ItineraryTimeline />

          {/* Zone 1: Champion Verdict & Confidence */}
          <VerdictCard />

          {/* Zones 2 & 4: Preference profile and Boundary Chips */}
          <Stack className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EvidencePanel />
            <CounterfactualPanel />
          </Stack>

          {/* Zone 3: Alternatives (Opportunity Cost) */}
          <OpportunityCostPanel />

          {/* Zone 5: Candidate list table (collapsed by default) */}
          <RankedList />
        </Stack>
      </Container>

      {/* Zone 6: Execution payload trace bottom status bar */}
      <TraceBar />
    </Stack>
  );
}
