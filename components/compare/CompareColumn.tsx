"use client";

import { Card, Stack, Text, Badge, EmptyState } from "@/components/ui/primitives";
import { TravelerSelect } from "@/components/composer/TravelerSelect";
import { PreferenceRadar } from "@/components/charts/PreferenceRadar";
import { ConfidenceGauge } from "@/components/charts/ConfidenceGauge";
import { useUsers, useRecommendation } from "@/lib/queries";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { Users } from "lucide-react";

export function CompareColumn({
  userId,
  onSelect,
}: {
  userId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data: users = [] } = useUsers();
  const user = users.find((u) => u.user_id === userId);
  const seed = userId ? getBenchmarkQuery(userId) : null;

  const { data: response, isLoading } = useRecommendation(
    userId && seed
      ? { userId, requestText: seed.requestText, destination: seed.destination, cities: seed.cities }
      : null
  );

  return (
    <Card className="bg-bg-surface border-border-default h-full">
      <Stack gap={4}>
        <TravelerSelect users={users} value={userId ?? ""} onValueChange={onSelect} placeholder="Pick a traveler" />

        {!userId ? (
          <EmptyState
            title="No traveler selected"
            icon={<Users className="w-8 h-8 text-text-secondary opacity-40" />}
          />
        ) : isLoading || !response ? (
          <Text variant="subtext" size="sm">Loading...</Text>
        ) : (
          <Stack gap={4}>
            <Stack direction="row" gap={2} className="flex-wrap">
              <Badge variant="default">{user?.preferred_cabin}</Badge>
              <Badge variant="default">{user?.price_sensitivity} price sensitivity</Badge>
              <Badge variant="default">{user?.direct_preference} direct</Badge>
            </Stack>

            <ConfidenceGauge confidence={response.confidence} className="max-w-30" />

            <PreferenceRadar preference={response.preference} className="mx-auto h-45 w-full" />

            {response.verdict ? (
              <Stack gap={1} className="border-t border-border-default pt-3">
                <Text variant="heading" size="sm" className="font-semibold">
                  {response.verdict.airline_name}
                </Text>
                <Text variant="mono" size="xs" className="text-accent font-semibold">
                  ${response.verdict.price} · {response.verdict.cabin_class}
                </Text>
                <Text variant="subtext" size="xs">
                  {response.verdict.origin} → {response.verdict.destination}
                </Text>
              </Stack>
            ) : (
              <Text variant="subtext" size="xs" className="italic">
                No verdict for this seed request.
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
