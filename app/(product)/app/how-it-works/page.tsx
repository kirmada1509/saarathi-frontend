import { Container, Stack, Text, Card, Prose, EmptyState } from "@/components/ui/primitives";
import { fetchRecommendation } from "@/lib/api";
import { BENCHMARK_QUERIES } from "@/lib/benchmark-queries";
import { Database, Terminal, Layers, FileCode, CheckCircle2, AlertTriangle } from "lucide-react";
import type { TraceStage } from "@/core/types";

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

export default async function HowItWorksPage() {
  let trace: TraceStage[] | null = null;
  let error: string | null = null;

  try {
    const response = await fetchRecommendation({
      userId: "U01",
      requestText: BENCHMARK_QUERIES.U01.requestText,
      destination: BENCHMARK_QUERIES.U01.destination,
      perturbations: [],
    });
    trace = response.trace;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <Container className="py-12 md:py-16 max-w-3xl">
      <Stack gap={8}>
        <Stack gap={3}>
          <Text variant="display" size="3xl" weight="semibold">
            How it works
          </Text>
          <Prose>
            <Text as="p">
              Saarathi doesn&apos;t rank flights and let you pick — it takes a position. The
              pipeline below is the real 7-stage trace from a live benchmark request
              (traveler U01, wanting a nonstop business-class flight to Tokyo), not a
              diagram of intended behavior.
            </Text>
          </Prose>
        </Stack>

        {error && (
          <EmptyState
            title="Backend unreachable"
            description={`Couldn't run the live benchmark trace (${error}). Start saarathi-backend on port 4000 and reload.`}
            icon={<AlertTriangle className="w-10 h-10 text-signal-negative opacity-60" />}
          />
        )}

        {trace && (
          <Stack gap={4}>
            {trace.map((stage, index) => (
              <Card key={stage.id} className="bg-bg-surface border-border-default">
                <Stack direction="row" gap={4} align="start">
                  <Stack
                    align="center"
                    justify="center"
                    className="shrink-0 size-10 rounded-full bg-accent/10 text-accent border border-accent/20"
                  >
                    {STAGE_ICONS[stage.id] ?? <Terminal className="w-5 h-5" />}
                  </Stack>
                  <Stack gap={2} className="flex-1 min-w-0">
                    <Stack direction="row" align="center" gap={2}>
                      <Text variant="mono" size="xs" className="text-text-secondary">
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                      <Text variant="heading" size="base" weight="semibold">
                        {stage.label}
                      </Text>
                    </Stack>
                    <Text variant="body" size="sm" className="text-text-secondary">
                      {STAGE_DESCRIPTIONS[stage.id]}
                    </Text>
                    <Stack className="bg-bg-surface-raised border border-border-default rounded-md p-3 overflow-x-auto max-h-[220px]">
                      <pre className="font-mono text-[11px] leading-relaxed text-text-primary/90 whitespace-pre-wrap">
                        {JSON.stringify(stage.payload, null, 2)}
                      </pre>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
