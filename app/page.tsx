import { Container, Stack, Text, Grid, Card, GradientMotif, NavLink, Section } from "@/components/ui/primitives";
import { AnimatedHero } from "@/components/marketing/AnimatedHero";
import { fetchRecommendation } from "@/lib/api";
import { BENCHMARK_QUERIES } from "@/lib/benchmark-queries";
import {
  PlaneTakeoff,
  Target,
  GitCompareArrows,
  MapPinned,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { RecommendResponse } from "@/core/types";

const FEATURES = [
  {
    icon: Target,
    title: "One verdict, not a list",
    body: "Saarathi commits to a single flight and defends it — the way a good travel agent would, not a wall of sortable columns.",
  },
  {
    icon: GitCompareArrows,
    title: "Exact counterfactuals",
    body: "“United 88 wins if its fare drops below $543” — a closed-form price and preference threshold, not a vague suggestion.",
  },
  {
    icon: Sparkles,
    title: "Deterministic, inspectable",
    body: "Every number traces to a scoring function you can invert. The LLM only writes the explanation — it never ranks or decides.",
  },
  {
    icon: MapPinned,
    title: "Real routes, real map",
    body: "Origin, destination, and every multi-city leg plotted on a live basemap with great-circle arcs — not a placeholder graphic.",
  },
];

export default async function Home() {
  let demo: RecommendResponse | null = null;
  try {
    demo = await fetchRecommendation({
      userId: "U01",
      requestText: BENCHMARK_QUERIES.U01.requestText,
      destination: BENCHMARK_QUERIES.U01.destination,
      perturbations: [],
    });
  } catch {
    demo = null;
  }

  const flipCounterfactual = demo?.counterfactuals.find((cf) => cf.flips);

  return (
    <Stack className="min-h-screen bg-bg-base text-text-primary">
      <Stack direction="row" align="center" justify="between" className="h-16 border-b border-border-default px-6">
        <Stack direction="row" align="center" gap={2}>
          <PlaneTakeoff className="size-5 text-accent" />
          <Text variant="display" size="lg" weight="semibold">Saarathi</Text>
        </Stack>
        <NavLink
          href="/app"
          active={false}
          className="border border-border-default rounded-md px-3 py-1.5 hover:border-accent hover:text-accent"
        >
          Enter app →
        </NavLink>
      </Stack>

      <Stack className="relative overflow-hidden">
        <GradientMotif variant="hero" />
        <Section spacing="xl">
          <Container className="max-w-3xl text-center">
            <AnimatedHero />
          </Container>
        </Section>
      </Stack>

      <Section spacing="lg">
        <Container>
          <Grid cols={4} gap={5}>
            {FEATURES.map((f) => (
              <Card key={f.title} className="bg-bg-surface border-border-default">
                <Stack gap={3}>
                  <Stack align="center" justify="center" className="size-9 rounded-md bg-accent/10 text-accent">
                    <f.icon className="size-4.5" />
                  </Stack>
                  <Text variant="heading" size="base" weight="semibold">{f.title}</Text>
                  <Text variant="body" size="sm" className="text-text-secondary">{f.body}</Text>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      {demo?.verdict && (
        <Section spacing="lg">
          <Container className="max-w-3xl">
            <Card className="bg-bg-surface border-border-default">
              <Stack gap={4}>
                <Text variant="subtext" size="xs" className="uppercase tracking-wide">
                  Live from the decision engine · Traveler U01
                </Text>
                <Text variant="heading" size="xl" weight="semibold">
                  &ldquo;{demo.verdict.airline_name} {demo.verdict.flight_numbers}, {demo.verdict.origin} → {demo.verdict.destination}, ${demo.verdict.price}&rdquo;
                </Text>
                <Text variant="body" size="sm" className="text-text-secondary">
                  {demo.confidence.matchPct}% match, {demo.confidence.tier} confidence.
                  {flipCounterfactual ? ` ${flipCounterfactual.label}.` : ""}
                </Text>
                <NavLink
                  href="/app/how-it-works"
                  active={false}
                  className="text-accent hover:text-accent-hover text-sm font-medium flex items-center gap-1 w-fit"
                >
                  Walk the full trace <ArrowRight className="size-3.5" />
                </NavLink>
              </Stack>
            </Card>
          </Container>
        </Section>
      )}

      {/* Submission Details Section */}
      <Section spacing="lg" className="border-t border-border-default/40 mt-10 pb-16">
        <Container className="max-w-3xl">
          <Card className="bg-bg-surface-raised/40 border border-border-default/60 p-6 rounded-xl">
            <Stack gap={4}>
              <Text variant="heading" size="lg" className="font-semibold text-text-primary">
                Submission Information
              </Text>
              
              <Stack className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm" gap={0}>
                {/* Author Info */}
                <Stack gap={2}>
                  <Text variant="body" size="sm" className="font-semibold text-text-primary">
                    Candidate Profile
                  </Text>
                  <Stack gap={1} className="text-text-secondary text-xs">
                    <Text><strong>Name:</strong> Mohan Krishna</Text>
                    <Text><strong>University:</strong> BITS Pilani, Pilani Campus</Text>
                    <Text><strong>Email:</strong> <a href="mailto:f20240732@pilani.bits-pilani.ac.in" className="text-accent hover:underline">f20240732@pilani.bits-pilani.ac.in</a></Text>
                    <Text><strong>Phone:</strong> +91 6302539619</Text>
                    <Text><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/mohan-krishna-karthik/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">mohan-kishna-karthik</a></Text>
                  </Stack>
                </Stack>

                {/* GitHub links */}
                <Stack gap={2}>
                  <Text variant="body" size="sm" className="font-semibold text-text-primary">
                    Project Repositories
                  </Text>
                  <Stack gap={2} className="text-text-secondary text-xs">
                    <Text>
                      <strong>Backend:</strong>{" "}
                      <a href="https://github.com/kirmada1509/saarathi-backend" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-mono">
                        kirmada1509/saarathi-backend
                      </a>
                    </Text>
                    <Text>
                      <strong>Frontend:</strong>{" "}
                      <a href="https://github.com/kirmada1509/saarathi-frontend" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-mono">
                        kirmada1509/saarathi-frontend
                      </a>
                    </Text>
                    <Text>
                      <strong>Docs:</strong>{" "}
                      <a href="https://github.com/kirmada1509/saarathi-docs" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-mono">
                        kirmada1509/saarathi-docs
                      </a>
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Container>
      </Section>
    </Stack>
  );
}
