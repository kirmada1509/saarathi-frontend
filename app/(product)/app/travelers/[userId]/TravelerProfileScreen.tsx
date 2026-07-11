"use client";

import { Container, Stack, Text, Card, Badge, EmptyState, NavLink } from "@/components/ui/primitives";
import { useUsers, useRecommendation } from "@/lib/queries";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { buildDecisionQuery } from "@/lib/decision-params";
import { EvidencePanel } from "@/components/decision/EvidencePanel";
import { MapPin, Plane, ArrowRight, UserRound } from "lucide-react";

export function TravelerProfileScreen({ userId }: { userId: string }) {
  const { data: users, isLoading: usersLoading } = useUsers();
  const user = users?.find((u) => u.user_id === userId);
  const seed = getBenchmarkQuery(userId);

  const { data: response, isLoading: recLoading } = useRecommendation({
    userId,
    requestText: seed.requestText,
    destination: seed.destination,
    cities: seed.cities,
  });

  if (usersLoading || recLoading) {
    return (
      <Container className="py-10">
        <Text variant="subtext">Loading traveler profile...</Text>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Traveler not found"
          description={`No traveler with id "${userId}".`}
          icon={<UserRound className="w-10 h-10 text-text-secondary opacity-40" />}
        />
      </Container>
    );
  }

  const decisionQuery = buildDecisionQuery({
    userId,
    requestText: seed.requestText,
    destination: seed.destination,
    cities: seed.cities,
  });

  return (
    <Container className="py-10">
      <Stack gap={6}>
        <Card className="bg-bg-surface border-border-default">
          <Stack direction="row" align="start" justify="between" gap={4} className="flex-wrap">
            <Stack gap={2}>
              <Stack direction="row" align="center" gap={2}>
                <Badge variant="warning">{user.user_id}</Badge>
                <Text variant="display" size="2xl" weight="semibold">
                  {user.home_city}
                </Text>
              </Stack>
              <Text variant="subtext" size="sm" className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {user.home_airport} · Age {user.age}
              </Text>
              <Stack direction="row" gap={2} className="flex-wrap pt-1">
                <Badge variant="default">{user.preferred_cabin}</Badge>
                <Badge variant="default">{user.price_sensitivity} price sensitivity</Badge>
                <Badge variant="default">{user.direct_preference} direct preference</Badge>
                <Badge variant="default">{user.preferred_airlines || "Any airline"}</Badge>
              </Stack>
              <Text variant="body" size="sm" className="text-text-secondary italic pt-2 max-w-xl">
                &ldquo;{user.raw_history}&rdquo;
              </Text>
            </Stack>

            <NavLink
              href={`/app/decision?${decisionQuery}`}
              active={false}
              className="flex items-center gap-1.5 shrink-0 border border-border-default rounded-md px-3 py-2 hover:border-accent hover:text-accent"
            >
              <Plane className="size-3.5" /> Run this traveler&apos;s decision <ArrowRight className="size-3.5" />
            </NavLink>
          </Stack>
        </Card>

        <Text variant="subtext" size="xs">
          The preference profile below is computed from a representative sample request —{" "}
          <span className="italic">&ldquo;{seed.requestText}&rdquo;</span> — not a live query you typed.
        </Text>

        {response && (
          <EvidencePanel preference={response.preference} confidence={response.confidence} />
        )}
      </Stack>
    </Container>
  );
}
