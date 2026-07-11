"use client";

import * as React from "react";
import { Container, Stack, Text, Grid, Skeleton, EmptyState } from "@/components/ui/primitives";
import { TravelerCard } from "@/components/travelers/TravelerCard";
import { TravelerFilterBar } from "@/components/travelers/TravelerFilterBar";
import { useUsers } from "@/lib/queries";
import { Users } from "lucide-react";

export default function TravelersPage() {
  const { data: users = [], isLoading } = useUsers();
  const [filter, setFilter] = React.useState("");

  const filtered = users.filter((u) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      u.home_city.toLowerCase().includes(q) ||
      u.preferred_cabin.toLowerCase().includes(q) ||
      u.preferred_airlines.toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q)
    );
  });

  return (
    <Container className="py-10">
      <Stack gap={6}>
        <Stack gap={2}>
          <Text variant="display" size="3xl" weight="semibold">
            Travelers
          </Text>
          <Text variant="body" size="base" className="text-text-secondary">
            The {users.length || ""} seeded traveler profiles the decision engine has been benchmarked against.
          </Text>
        </Stack>

        <TravelerFilterBar value={filter} onChange={setFilter} />

        {isLoading ? (
          <Grid cols={3} gap={4}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </Grid>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No travelers match"
            description="Try a different search term."
            icon={<Users className="w-10 h-10 text-text-secondary opacity-40" />}
          />
        ) : (
          <Grid cols={3} gap={4}>
            {filtered.map((u) => (
              <TravelerCard key={u.user_id} user={u} />
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
