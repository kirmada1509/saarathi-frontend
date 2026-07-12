"use client";

import * as React from "react";
import { Container, Stack, Text, Card, Prose, EmptyState, Clickable } from "@/components/ui/primitives";
import { fetchRecommendation } from "@/lib/api";
import { BENCHMARK_QUERIES } from "@/lib/benchmark-queries";
import { Database, Terminal, Layers, FileCode, CheckCircle2, AlertTriangle, Maximize2 } from "lucide-react";
import type { TraceStage } from "@/core/types";
import { Mermaid } from "@/components/ui/Mermaid";
import { useTheme } from "next-themes";

const STAGE_ICONS: Record<string, React.ReactNode> = {
  request: <Terminal className="w-5 h-5" />,
  preferences: <Layers className="w-5 h-5" />,
  constraints: <CheckCircle2 className="w-5 h-5" />,
  candidates: <Database className="w-5 h-5" />,
  tradeoffs: <FileCode className="w-5 h-5" />,
  counterfactuals: <Terminal className="w-5 h-5" />,
  verdict: <CheckCircle2 className="w-5 h-5" />,
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  request: "The raw traveler request and resolved query parameters, before any scoring happens.",
  preferences: "Structured preferences plus free-text history run through preference inference — every weight traces back to evidence, never a guess.",
  constraints: "Hard constraints (layovers, cabin, dates) filter the candidate pool. Each removed flight is logged with the constraint that removed it.",
  candidates: "The surviving flights, each scored by the deterministic linear function — same inputs always produce the same score.",
  tradeoffs: "The champion is compared against the cheapest, fastest, most flexible, and comfort-premium alternatives to quantify what you'd give up.",
  counterfactuals: "The scoring function is inverted algebraically to find the exact price or preference threshold that would flip the verdict.",
  verdict: "One flight, chosen — with the confidence tier and match percentage that justify committing to it over the runner-up.",
};

type ColorsConfig = {
  nestjs: string;
  coreLib: string;
  database: string;
  ai: string;
  client: string;
};

const getArchitectureChart = (c: ColorsConfig) => `
graph TD
  subgraph NestJS Backend Application [NestJS App Boundary]
    direction TB
    
    subgraph AppModule [App Module]
      AppMod[AppModule]
    end

    subgraph RecommendModule [Recommend Module]
      RecommendCtrl[RecommendController]
      RecommendSvc[RecommendService]
      RecommendSingleLegSvc[RecommendSingleLegService]
      RecommendMultiCitySvc[RecommendMultiCityService]
      RouteParserSvc[RouteParserService]
    end

    subgraph UsersModule [Users Module]
      UsersCtrl[UsersController]
      PrismaSvc[PrismaService]
    end

    subgraph CortexModule [Cortex AI Module]
      CortexSvc[CortexService]
    end

    subgraph SaarathiModule [Saarathi Core Library Module]
      Data[saarathi/data.ts]
      Prefs[saarathi/preferences.ts]
      Rank[saarathi/ranking.ts]
      CF[saarathi/counterfactuals.ts]
      Conf[saarathi/confidence.ts]
      MC[saarathi/multicity.ts]
      Types[saarathi/types.ts]
    end
  end

  AppMod --> RecommendCtrl
  AppMod --> UsersCtrl
  RecommendCtrl --> RecommendSvc
  RecommendSvc --> RecommendSingleLegSvc
  RecommendSvc --> RecommendMultiCitySvc
  RecommendSvc --> RouteParserSvc
  UsersCtrl --> PrismaSvc

  %% Cortex Interactions
  RecommendSingleLegSvc --> CortexSvc
  RecommendMultiCitySvc --> CortexSvc
  RouteParserSvc --> CortexSvc

  %% Saarathi Core dependencies
  RecommendSvc --> Prefs
  RecommendSvc --> CF
  RecommendSvc --> Data

  RecommendSingleLegSvc --> Rank
  RecommendSingleLegSvc --> CF
  RecommendSingleLegSvc --> Conf
  RecommendSingleLegSvc --> Data

  RecommendMultiCitySvc --> MC
  RecommendMultiCitySvc --> Conf

  RouteParserSvc --> Data
  AppMod --> Data

  classDef nestjs ${c.nestjs};
  classDef coreLib ${c.coreLib};

  class AppMod,RecommendCtrl,RecommendSvc,RecommendSingleLegSvc,RecommendMultiCitySvc,RouteParserSvc,UsersCtrl,PrismaSvc,CortexSvc nestjs;
  class Data,Prefs,Rank,CF,Conf,MC,Types coreLib;
`;

const SEQUENCE_SINGLE_CHART = `
sequenceDiagram
  autonumber
  actor Client
  participant C as RecommendController (recommend)
  participant RS as RecommendService (recommend)
  participant RP as RouteParserService (recommend)
  participant RSL as RecommendSingleLegService (recommend)
  participant IP as preferences.ts (saarathi)
  participant AP as counterfactuals.ts (saarathi)
  participant R as ranking.ts (saarathi)
  participant CF as counterfactuals.ts (saarathi)
  participant CO as confidence.ts (saarathi)
  participant CTX as CortexService (cortex)

  Client->>C: POST /api/recommend (payload)
  C->>RS: getRecommendation(data)
  RS->>CTX: inferPreferences(user, requestText)
  alt LLM Inference succeeds
    CTX-->>RS: basePref
  else LLM fails / offline
    RS->>IP: inferPreferences(user, requestText)
    IP-->>RS: basePref
  end
  RS->>AP: applyPerturbations(basePref, perturbations)
  AP-->>RS: perturbedPref
  Note over RS,RP: If route missing, infer destination
  RS->>RP: inferRouteFromText(text, home, store)
  RP-->>RS: resolvedDestination
  RS->>RSL: getRecommendation(..., basePref, perturbedPref, ...)
  RSL->>RSL: resolveDestination(...)
  RSL->>RSL: runSingleLegRoutingWithFallback(...)
  RSL->>R: filterAndRank(routeFlights, perturbedPref, ...)
  R-->>RSL: rankedFlights
  Note over RSL,R: If empty match, triggers constraint relaxation
  RSL->>R: selectAlternatives(ranked, user)
  R-->>RSL: alternatives
  RSL->>CF: computeCounterfactuals(ranked, basePref, ...)
  CF-->>RSL: counterfactuals
  RSL->>CO: computeConfidence(ranked, perturbedPref)
  CO-->>RSL: confidence
  RSL->>CTX: generateExplanation(..., confidence)
  CTX-->>RSL: explanation string
  RSL-->>RS: RecommendResponse
  RS-->>C: RecommendResponse
  C-->>Client: 200 OK (payload + trace)
`;

const SEQUENCE_MULTI_CHART = `
sequenceDiagram
  autonumber
  actor Client
  participant C as RecommendController (recommend)
  participant RS as RecommendService (recommend)
  participant RP as RouteParserService (recommend)
  participant RMC as RecommendMultiCityService (recommend)
  participant IP as preferences.ts (saarathi)
  participant AP as counterfactuals.ts (saarathi)
  participant MC as multicity.ts (saarathi)
  participant CO as confidence.ts (saarathi)
  participant CTX as CortexService (cortex)

  Client->>C: POST /api/recommend (payload)
  C->>RS: getRecommendation(data)
  RS->>CTX: inferPreferences(user, requestText)
  alt LLM Inference succeeds
    CTX-->>RS: basePref
  else LLM fails / offline
    RS->>IP: inferPreferences(user, requestText)
    IP-->>RS: basePref
  end
  RS->>AP: applyPerturbations(basePref, perturbations)
  AP-->>RS: perturbedPref
  Note over RS,RP: If cities or stay durations missing
  RS->>RP: inferRouteFromText(text, home, store)
  RP-->>RS: resolvedCities
  RS->>RP: parseStayDurationsFromText(text, store)
  RP-->>RS: resolvedStayDurations
  RS->>RMC: getRecommendation(..., resolvedCities, perturbedPref, ...)
  RMC->>MC: optimizeRoute(cities, perturbedPref, stayDurations)
  MC-->>RMC: { itinerary, alternatives, counterfactualLabel, scoreGap }
  Note over RMC: Constructs synthetic margin
  RMC->>CO: computeConfidence(syntheticRanked, perturbedPref)
  CO-->>RMC: confidence
  RMC->>CTX: generateExplanation(..., confidence)
  CTX-->>RMC: explanation string
  RMC-->>RS: RecommendResponse
  RS-->>C: RecommendResponse
  C-->>Client: 200 OK (payload + trace)
`;

const getLifecycleChart = (c: ColorsConfig) => `
graph TD
  subgraph Startup [Once on application boot]
    Init[NestJS Bootstrap] --> AppModuleInit[AppModule.onModuleInit]
    AppModuleInit --> InitStore[initializeStoreFromDb]
    InitStore --> PrismaUsers[prisma.user.findMany]
    InitStore --> PrismaFlights[prisma.flight.findMany]
    PrismaUsers --> CoerceUsers[coerceUserRow]
    PrismaFlights --> CoerceFlights[coerceFlightRow]
    CoerceUsers --> BuildCache[Build DataStore Maps: users, flightsByRoute, flightsByOrigin, airports]
    CoerceFlights --> BuildCache
    BuildCache --> SetSingleton[Store Map Singleton: globalThis.__saarathi_store__]
  end

  subgraph Request [Per-Request Flow]
    Req[POST /api/recommend] --> GetStore[getStore]
    GetStore --> ReadCache[Read directly from globalThis.__saarathi_store__]
    ReadCache --> CompleteRequest[Run pricing/filter scoring logic in 0ms]
  end

  classDef nestjs ${c.nestjs};
  classDef coreLib ${c.coreLib};
  classDef database ${c.database};
  classDef client ${c.client};

  class Init,AppModuleInit,InitStore nestjs;
  class PrismaUsers,PrismaFlights database;
  class CoerceUsers,CoerceFlights,BuildCache,SetSingleton,GetStore,ReadCache,CompleteRequest coreLib;
  class Req client;
`;

const getAiBoundaryChart = (c: ColorsConfig) => `
graph TD
  subgraph AI Input/Output Schema
    Request[Request Rationale, Parse Route & Infer Preferences] -->|user_id, requestText| CortexService[CortexService]
    CortexService -->|API Call| Groq[Groq API: llama-3.3-70b-versatile]
  end

  subgraph generateExplanation Fallback Path
    GroqFails1[Groq API offline / Missing API key] -->|Catch Error| ExplanationFallback[explanationFallback]
    ExplanationFallback -->|Constructs deterministic text| FallbackText[best flight details + last 2 preferences evidence]
  end

  subgraph parseRoute Fallback Path
    GroqFails2[Groq API offline / Missing API key] -->|Returns null| RouteParserFallback[RouteParserService]
    RouteParserFallback -->|inferRouteFromText| RegexAirport[Regex match airport codes & city names]
    RouteParserFallback -->|parseStayDurationsFromText| RegexNights[Regex match stay durations e.g., '3 nights in LHR']
  end

  subgraph inferPreferences Fallback Path
    GroqFails3[Groq API offline / Missing API key] -->|Returns null| PrefFallback[preferences.ts]
    PrefFallback -->|Structured Mapping| BaseWeights[Map price & direct selections to base weights]
    PrefFallback -->|Regex Scanning| RegexWeights[Boost weights using keyword matches]
    PrefFallback -->|Local Embeddings| EmbedWeights[MiniLM cosine similarity threshold checks]
  end

  classDef nestjs ${c.nestjs};
  classDef coreLib ${c.coreLib};
  classDef ai ${c.ai};
  classDef client ${c.client};

  class CortexService,RouteParserFallback nestjs;
  class Groq ai;
  class ExplanationFallback,FallbackText,RegexAirport,RegexNights,GroqFails1,GroqFails2,PrefFallback,BaseWeights,RegexWeights,EmbedWeights,GroqFails3 coreLib;
  class Request client;
`;

const getDatabaseFlowChart = (c: ColorsConfig) => `
graph TD
  SQLite[(SQLite DB: dev.db)]
  Prisma[Prisma Client]

  SQLite <--> Prisma

  subgraph DB Hits [Direct SQLite Queries]
    AppBoot[App Boot: OnModuleInit] -->|Warms cache| Prisma
    GetUsers[GET /api/users] -->|Direct Query| Prisma
  end

  subgraph Cached [Zero DB Reads]
    GetRecommend[POST /api/recommend] -->|Reads from globalThis.__saarathi_store__| InMemoryStore[In-Memory Cache]
    GetParse[POST /api/recommend/parse-route] -->|Reads from globalThis.__saarathi_store__| InMemoryStore
  end

  classDef nestjs ${c.nestjs};
  classDef coreLib ${c.coreLib};
  classDef database ${c.database};

  class AppBoot nestjs;
  class SQLite,Prisma,GetUsers database;
  class GetRecommend,GetParse,InMemoryStore coreLib;
`;

export default function HowItWorksPage() {
  const [trace, setTrace] = React.useState<TraceStage[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingTrace, setLoadingTrace] = React.useState(true);

  // Enlarged modal state
  const [enlargedChart, setEnlargedChart] = React.useState<string | null>(null);
  const [enlargedTitle, setEnlargedTitle] = React.useState<string>("");

  const [enlargedJson, setEnlargedJson] = React.useState<string | null>(null);
  const [enlargedJsonTitle, setEnlargedJsonTitle] = React.useState<string>("");

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Colors config dynamically adjusted for light/dark mode readability and visual harmony
  const colors: ColorsConfig = isDark ? {
    nestjs: "fill:#1e293b,stroke:#0ea5e9,stroke-width:1.5px,color:#f8fafc", // slate-800, sky-500 border, slate-50 text
    coreLib: "fill:#1e1b4b,stroke:#f59e0b,stroke-width:1.5px,color:#f8fafc", // indigo-950, amber-500 border
    database: "fill:#1c1917,stroke:#ef4444,stroke-width:1.5px,color:#f8fafc", // stone-900, red-500 border
    ai: "fill:#2e1065,stroke:#a855f7,stroke-width:1.5px,color:#f8fafc", // purple-950, purple-500 border
    client: "fill:#064e3b,stroke:#10b981,stroke-width:1.5px,color:#f8fafc", // emerald-950, emerald-500 border
  } : {
    nestjs: "fill:#f0f9ff,stroke:#0284c7,stroke-width:1.5px,color:#0369a1", // light sky blue, sky-600 border, sky-700 text
    coreLib: "fill:#f5f3ff,stroke:#d97706,stroke-width:1.5px,color:#92400e", // light violet/indigo, amber-600 border
    database: "fill:#fff5f5,stroke:#dc2626,stroke-width:1.5px,color:#991b1b", // light red
    ai: "fill:#faf5ff,stroke:#7c3aed,stroke-width:1.5px,color:#5b21b6", // light purple
    client: "fill:#ecfdf5,stroke:#059669,stroke-width:1.5px,color:#047857", // light emerald
  };

  // Generate dynamic diagrams with node styles injected
  const architectureChart = getArchitectureChart(colors);
  const sequenceSingleChart = SEQUENCE_SINGLE_CHART;
  const sequenceMultiChart = SEQUENCE_MULTI_CHART;
  const lifecycleChart = getLifecycleChart(colors);
  const aiBoundaryChart = getAiBoundaryChart(colors);
  const databaseFlowChart = getDatabaseFlowChart(colors);

  React.useEffect(() => {
    async function loadTrace() {
      try {
        setLoadingTrace(true);
        const response = await fetchRecommendation({
          userId: "U01",
          requestText: BENCHMARK_QUERIES.U01.requestText,
          destination: BENCHMARK_QUERIES.U01.destination,
          perturbations: [],
        });
        setTrace(response.trace);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingTrace(false);
      }
    }
    loadTrace();
  }, []);

  // Listen for Escape key to close modal
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEnlargedChart(null);
        setEnlargedJson(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openEnlarged = (title: string, chart: string) => {
    setEnlargedTitle(title);
    setEnlargedChart(chart);
  };

  return (
    <Container className="py-12 md:py-16 max-w-4xl">
      <Stack gap={8}>
        {/* Title and Intro */}
        <Stack gap={3}>
          <Text variant="display" size="3xl" weight="semibold">
            System Architecture & Flow
          </Text>
          <Prose>
            <Text as="p">
              Explore the detailed NestJS backend module boundaries, request sequences, caching lifecycles, and AI integrations. 
              Click &ldquo;Enlarge View&rdquo; on any flowchart to view it in full screen.
            </Text>
          </Prose>
        </Stack>

        {/* 1. Module Architecture Card */}
        <Card className="bg-bg-surface border-border-default p-6">
          <Stack gap={4}>
            <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4 border-b border-border-default/60 pb-3">
              <Stack gap={1} className="flex-1 min-w-[280px]">
                <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                  1. Module Architecture
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary">
                  The NestJS DI container (<span className="font-mono text-xs text-accent">recommend</span>, <span className="font-mono text-xs text-accent">users</span>, and <span className="font-mono text-xs text-accent">cortex</span> modules) manages incoming requests, controllers, and services. The core business rules and search algorithms reside in the framework-free <span className="font-mono text-xs text-accent">saarathi/</span> TypeScript core library (marked in blue below).
                </Text>
              </Stack>
              <Clickable
                onClick={() => openEnlarged("Module Architecture", architectureChart)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20 cursor-pointer self-start"
              >
                <Maximize2 className="size-3.5" />
                <span>Enlarge View</span>
              </Clickable>
            </Stack>
            <Mermaid chart={architectureChart} />
          </Stack>
        </Card>

        {/* 2. Request Sequence Single Leg Card */}
        <Card className="bg-bg-surface border-border-default p-6">
          <Stack gap={4}>
            <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4 border-b border-border-default/60 pb-3">
              <Stack gap={1} className="flex-1 min-w-[280px]">
                <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                  2. Request Sequence: Single-Leg Route
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary">
                  Traces the request lifecycle for a single-leg search. Key steps include preference weight inference, constraint filtering, dynamic fallback relaxation if zero flights match, trade-off comparisons, counterfactual algebraic inversion, and LLM rationale generation.
                </Text>
              </Stack>
              <Clickable
                onClick={() => openEnlarged("Request Sequence: Single-Leg Route", sequenceSingleChart)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20 cursor-pointer self-start"
              >
                <Maximize2 className="size-3.5" />
                <span>Enlarge View</span>
              </Clickable>
            </Stack>
            <Mermaid chart={sequenceSingleChart} />
          </Stack>
        </Card>

        {/* 3. Request Sequence Multi City Card */}
        <Card className="bg-bg-surface border-border-default p-6">
          <Stack gap={4}>
            <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4 border-b border-border-default/60 pb-3">
              <Stack gap={1} className="flex-1 min-w-[280px]">
                <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                  3. Request Sequence: Multi-City Route
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary">
                  Shows how multi-city routes are optimized. Stays are validated and run through a branch-and-bound optimization matrix (<span className="font-mono text-xs text-accent">multicity.ts</span>). It constructs a synthetic margins comparison to evaluate traveler confidence and generate AI rationale.
                </Text>
              </Stack>
              <Clickable
                onClick={() => openEnlarged("Request Sequence: Multi-City Route", sequenceMultiChart)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20 cursor-pointer self-start"
              >
                <Maximize2 className="size-3.5" />
                <span>Enlarge View</span>
              </Clickable>
            </Stack>
            <Mermaid chart={sequenceMultiChart} />
          </Stack>
        </Card>

        {/* 4. Boot Lifecycle Card */}
        <Card className="bg-bg-surface border-border-default p-6">
          <Stack gap={4}>
            <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4 border-b border-border-default/60 pb-3">
              <Stack gap={1} className="flex-1 min-w-[280px]">
                <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                  4. Boot Lifecycle & Memory Caching
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary">
                  To achieve sub-millisecond response times, the application loads and indices SQLite data using Prisma on startup (<span className="font-mono text-xs text-accent">AppModule.onModuleInit</span>). All recommendation requests read directly from this cache singleton, completely bypassing database reads.
                </Text>
              </Stack>
              <Clickable
                onClick={() => openEnlarged("Boot Lifecycle & Memory Caching", lifecycleChart)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20 cursor-pointer self-start"
              >
                <Maximize2 className="size-3.5" />
                <span>Enlarge View</span>
              </Clickable>
            </Stack>
            <Mermaid chart={lifecycleChart} />
          </Stack>
        </Card>

        {/* 5. AI Boundary Card */}
        <Card className="bg-bg-surface border-border-default p-6">
          <Stack gap={4}>
            <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4 border-b border-border-default/60 pb-3">
              <Stack gap={1} className="flex-1 min-w-[280px]">
                <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                  5. AI/LLM System Boundary & Resilient Fallbacks
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary">
                  AI touches exactly two isolated spots: route parsing and explanation generation. In case of network errors or missing keys, the system falls back to a template summary and regex parsing, ensuring 100% uptime and functionality.
                </Text>
              </Stack>
              <Clickable
                onClick={() => openEnlarged("AI/LLM System Boundary & Resilient Fallbacks", aiBoundaryChart)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20 cursor-pointer self-start"
              >
                <Maximize2 className="size-3.5" />
                <span>Enlarge View</span>
              </Clickable>
            </Stack>
            <Mermaid chart={aiBoundaryChart} />
          </Stack>
        </Card>

        {/* 6. DB Flow Card */}
        <Card className="bg-bg-surface border-border-default p-6">
          <Stack gap={4}>
            <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4 border-b border-border-default/60 pb-3">
              <Stack gap={1} className="flex-1 min-w-[280px]">
                <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                  6. SQLite & Prisma Interaction Map
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary">
                  Only the cache initialization on startup and the <span className="font-mono text-xs text-accent">GET /api/users</span> endpoint make queries to SQLite via Prisma. The recommendation pipeline has zero direct DB connections.
                </Text>
              </Stack>
              <Clickable
                onClick={() => openEnlarged("SQLite & Prisma Interaction Map", databaseFlowChart)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20 cursor-pointer self-start"
              >
                <Maximize2 className="size-3.5" />
                <span>Enlarge View</span>
              </Clickable>
            </Stack>
            <Mermaid chart={databaseFlowChart} />
          </Stack>
        </Card>

        {/* 7. Core Deterministic Algorithms Card */}
        <Card className="bg-bg-surface border-border-default p-6">
          <Stack gap={5}>
            <Stack gap={1} className="border-b border-border-default/60 pb-3">
              <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                7. Core Deterministic Algorithms
              </Text>
              <Text variant="body" size="sm" className="text-text-secondary">
                The business logic is completely isolated from NestJS and database layers in the core <span className="font-mono text-xs text-accent">saarathi/</span> package. This guarantees 100% testable, predictable, and sub-millisecond execution.
              </Text>
            </Stack>

            <Stack gap={6} className="divide-y divide-border-default/40">
              {/* Preferences.ts */}
              <Stack gap={2} className="pt-0">
                <Text variant="heading" size="base" className="font-bold text-accent">
                  A. Preference Weight Inference (<span className="font-mono text-sm">CortexService</span> / <span className="font-mono text-sm">preferences.ts</span>)
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary leading-relaxed">
                  Infers numeric weights (0 to 1) for travel dimensions based on structured profile fields and raw unstructured history.
                </Text>
                <ul className="list-disc pl-5 text-xs text-text-secondary space-y-1.5 leading-relaxed">
                  <li>
                    <strong className="text-text-primary">LLM-Driven Inference:</strong> The primary path leverages Groq to analyze structured traveler settings alongside unstructured history, outputting weights and structured evidence arrays.
                  </li>
                  <li>
                    <strong className="text-text-primary">Local Fallback Pipeline:</strong> If the LLM is offline or keys are missing, the system gracefully falls back to the deterministic local pipeline:
                    <ul className="list-circle pl-5 mt-1 space-y-1">
                      <li><strong className="text-text-primary">Structured Mapping:</strong> Maps dropdown choices (e.g. <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded">strong</code> direct &rarr; 0.9, <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded">high</code> price sensitivity &rarr; 0.85).</li>
                      <li><strong className="text-text-primary">Regex Phrase Scanning:</strong> Scans history/prompts for keywords (e.g., <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded">/hate connections/i</code> boosts direct weight by +0.1).</li>
                      <li><strong className="text-text-primary">Embedding Fallback:</strong> Cosine similarity checks using local <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded">all-MiniLM-L6-v2</code> embeddings.</li>
                    </ul>
                  </li>
                </ul>
              </Stack>

              {/* Ranking.ts */}
              <Stack gap={2} className="pt-4">
                <Text variant="heading" size="base" className="font-bold text-accent">
                  B. Flight Filtering & Linear Scoring (<span className="font-mono text-sm">ranking.ts</span>)
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary leading-relaxed">
                  Applies absolute constraints to candidate flights and computes a linear combination score.
                </Text>
                <ul className="list-disc pl-5 text-xs text-text-secondary space-y-1.5 leading-relaxed">
                  <li>
                    <strong className="text-text-primary">Hard Constraints:</strong> Filters the flight pool by origin, destination, max layover minutes, date flexibility limits, and departs redeyes if <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded">avoid_redeye</code> is active.
                  </li>
                  <li>
                    <strong className="text-text-primary">Linear Scoring Equation:</strong>
                    <Stack className="bg-bg-surface-raised p-2.5 my-1.5 rounded-md font-mono text-[11px] overflow-x-auto text-text-primary border border-border-default/60">
                      Score = (costWeight * PriceScore + directWeight * DirectScore + (1 - costWeight) * 0.5 * DurationScore + convenienceWeight * 0.3 * CabinScore + 0.2 * AirlineScore + baggageWeight * BaggageScore) * DemandAdjustment * HolidayAdjustment + DayBonus
                    </Stack>
                  </li>
                  <li>
                    <strong className="text-text-primary">Scoring Adjusters:</strong> Price and duration are normalized relative to the current candidate pool. It applies multipliers for demand tiers (e.g., low demand &rarr; 1.05x bonus) and holiday seasons (0.95x penalty), plus a soft <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded">+0.15</code> bonus for preferred days of the week.
                  </li>
                </ul>
              </Stack>

              {/* Multicity.ts */}
              <Stack gap={2} className="pt-4">
                <Text variant="heading" size="base" className="font-bold text-accent">
                  C. Multi-City Routing Optimizer (<span className="font-mono text-sm">multicity.ts</span>)
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary leading-relaxed">
                  Finds the optimal sequencing and flight selection across multiple city destinations.
                </Text>
                <ul className="list-disc pl-5 text-xs text-text-secondary space-y-1.5 leading-relaxed">
                  <li>
                    <strong className="text-text-primary">Permutation Search:</strong> Generates all valid permutations of city order (e.g., origin &rarr; City A &rarr; City B &rarr; origin vs origin &rarr; City B &rarr; City A &rarr; origin).
                  </li>
                  <li>
                    <strong className="text-text-primary">Branch-and-Bound Backtracking:</strong> Recursively selects the best flight for each leg. Prunes branches early if the current score sum + max potential remaining score cannot beat the best sequence found so far.
                  </li>
                  <li>
                    <strong className="text-text-primary">Stay Duration Constraints:</strong> Verifies that the arrival timestamp of leg N is at least <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded">stayDurations[city]</code> nights prior to the departure of leg N+1.
                  </li>
                </ul>
              </Stack>

              {/* Counterfactuals.ts */}
              <Stack gap={2} className="pt-4">
                <Text variant="heading" size="base" className="font-bold text-accent">
                  D. Counterfactual Inversion (<span className="font-mono text-sm">counterfactuals.ts</span>)
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary leading-relaxed">
                  Algebraically inverts the scoring function to find the exact boundary threshold that would flip the recommendation.
                </Text>
                <ul className="list-disc pl-5 text-xs text-text-secondary space-y-1.5 leading-relaxed">
                  <li>
                    <strong className="text-text-primary">Closed-Form Price Thresholds:</strong> For runner-up flights, it solves:
                    <Stack className="bg-bg-surface-raised p-2 my-1.5 rounded font-mono text-[11px] text-text-primary border border-border-default/60 text-center">
                      priceDrop = (Score_champion - Score_challenger) * PriceRange / (cost_weight * demandAdj * holidayAdj)
                    </Stack>
                    If the required drop is &le; 60% of the flight fare, it outputs a realistic threshold price.
                  </li>
                  <li>
                    <strong className="text-text-primary">Hypothetical Scenario Toggles:</strong> Programmatically applies specific perturbations (like allowing stopovers, ignoring airline loyalty, shifting departure dates) and re-runs the ranking engine to report the hypothetical winner.
                  </li>
                </ul>
              </Stack>

              {/* Confidence.ts */}
              <Stack gap={2} className="pt-4">
                <Text variant="heading" size="base" className="font-bold text-accent">
                  E. Confidence Assessment (<span className="font-mono text-sm">confidence.ts</span>)
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary leading-relaxed">
                  Measures match percentage and determines the certainty tier of the recommendation.
                </Text>
                <ul className="list-disc pl-5 text-xs text-text-secondary space-y-1.5 leading-relaxed">
                  <li>
                    <strong className="text-text-primary">Match Percentage:</strong> Measures the champion&apos;s score against the theoretical maximum achievable score under the current preference weights.
                  </li>
                  <li>
                    <strong className="text-text-primary">Signal Validation:</strong> Validates preference dimensions. If a preference has both structured profile support and behavioral/textual history evidence, it is classified as a <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded text-accent">Strong Signal</code>.
                  </li>
                  <li>
                    <strong className="text-text-primary">Confidence Tiering:</strong>
                    Assigns <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded text-accent">high</code> confidence if the score margin between first and second place is &gt; 0.1, <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded text-accent">medium</code> for standard margins, and <code className="font-mono text-[11px] bg-bg-surface-raised px-1 py-0.5 rounded text-accent">low</code> if the margin is &lt; 0.04 or if conflicting strong signals exist (demotes to medium if match % &ge; 80%).
                  </li>
                </ul>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* 8. Live Trace Payloads Card */}
        <Card className="bg-bg-surface border-border-default p-6">
          <Stack gap={4}>
            <Stack gap={1} className="border-b border-border-default/60 pb-3">
              <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                8. Live Execution Trace Payloads
              </Text>
              <Text variant="body" size="sm" className="text-text-secondary">
                The payloads below represent a live, 7-stage diagnostic trace fetched from traveler U01&apos;s request. Turn on the backend to refresh this data live.
              </Text>
            </Stack>

            {loadingTrace && (
              <Stack className="bg-bg-surface p-8 rounded-lg border border-border-default text-center animate-pulse text-xs text-text-secondary font-mono">
                Loading live trace payloads...
              </Stack>
            )}

            {error && (
              <EmptyState
                title="Backend offline (Using static visual flows)"
                description={`Unable to load the live trace JSON payload (${error}). Start saarathi-backend on port 4000 to fetch trace data.`}
                icon={<AlertTriangle className="w-10 h-10 text-signal-negative opacity-60" />}
              />
            )}

            {trace && (
              <Stack gap={4}>
                {trace.map((stage, index) => (
                  <Card key={stage.id} className="bg-bg-surface border-border-default">
                    <Stack gap={4} className="p-6">
                      <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4 border-b border-border-default/60 pb-3">
                        <Stack direction="row" align="center" gap={3}>
                          <Stack
                            align="center"
                            justify="center"
                            className="shrink-0 size-10 rounded-full bg-accent/10 text-accent border border-accent/20"
                          >
                            {STAGE_ICONS[stage.id] ?? <Terminal className="w-5 h-5" />}
                          </Stack>
                          <Stack gap={1}>
                            <Text variant="mono" size="xs" className="text-text-secondary">
                              Stage {String(index + 1).padStart(2, "0")}
                            </Text>
                            <Text variant="heading" size="base" weight="semibold">
                              {stage.label}
                            </Text>
                          </Stack>
                        </Stack>
                        <Clickable
                          onClick={() => {
                            setEnlargedJsonTitle(`JSON Payload: ${stage.label}`);
                            setEnlargedJson(JSON.stringify(stage.payload, null, 2));
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20 cursor-pointer self-center"
                        >
                          <Maximize2 className="size-3.5" />
                          <span>Enlarge JSON</span>
                        </Clickable>
                      </Stack>
                      <Text variant="body" size="sm" className="text-text-secondary">
                        {STAGE_DESCRIPTIONS[stage.id]}
                      </Text>
                      <Stack className="bg-bg-surface-raised border border-border-default rounded-md p-3 overflow-x-auto max-h-55">
                        <pre className="font-mono text-[11px] leading-relaxed text-text-primary/90 whitespace-pre-wrap">
                          {JSON.stringify(stage.payload, null, 2)}
                        </pre>
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Enlarged Diagram Modal Overlay */}
      {enlargedChart && (
        <Stack 
          onClick={() => setEnlargedChart(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 cursor-pointer"
        >
          <Card 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[90vh] bg-bg-surface border border-border-default flex flex-col p-6 overflow-hidden relative cursor-default"
          >
            <Stack direction="row" align="center" justify="between" className="mb-4">
              <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                {enlargedTitle}
              </Text>
              <Clickable
                onClick={() => setEnlargedChart(null)}
                className="px-3 py-1.5 rounded bg-bg-surface-raised border border-border-default hover:bg-bg-surface-raised/80 text-xs font-semibold cursor-pointer"
              >
                Close (Esc)
              </Clickable>
            </Stack>
            <Stack className="flex-1 overflow-hidden bg-bg-base rounded border border-border-default/60">
              <Mermaid chart={enlargedChart} interactive />
            </Stack>
          </Card>
        </Stack>
      )}

      {/* Enlarged JSON Modal Overlay */}
      {enlargedJson && (
        <Stack 
          onClick={() => setEnlargedJson(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 cursor-pointer"
        >
          <Card 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] bg-bg-surface border border-border-default flex flex-col p-6 overflow-hidden relative cursor-default"
          >
            <Stack direction="row" align="center" justify="between" className="mb-4">
              <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                {enlargedJsonTitle}
              </Text>
              <Clickable
                onClick={() => setEnlargedJson(null)}
                className="px-3 py-1.5 rounded bg-bg-surface-raised border border-border-default hover:bg-bg-surface-raised/80 text-xs font-semibold cursor-pointer"
              >
                Close (Esc)
              </Clickable>
            </Stack>
            <Stack className="flex-1 overflow-auto p-4 bg-bg-base rounded border border-border-default/60">
              <pre className="font-mono text-xs leading-relaxed text-text-primary/95 whitespace-pre-wrap select-text">
                {enlargedJson}
              </pre>
            </Stack>
          </Card>
        </Stack>
      )}
    </Container>
  );
}
