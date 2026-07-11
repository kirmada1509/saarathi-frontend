"use client";

import { Card, Stack, Text, Badge, NavLink } from "@/components/ui/primitives";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { UserSummary } from "@/lib/types";

export function TravelerCard({ user }: { user: UserSummary }) {
  return (
    <NavLink href={`/app/travelers/${user.user_id}`} active={false} className="block">
      <Card className="bg-bg-surface border-border-default h-full hover:border-accent/60 transition-colors group">
        <Stack gap={3}>
          <Stack direction="row" align="center" justify="between">
            <Badge variant="warning">{user.user_id}</Badge>
            <ArrowUpRight className="size-4 text-text-secondary group-hover:text-accent transition-colors" />
          </Stack>

          <Stack gap={1}>
            <Text variant="heading" size="lg" weight="semibold">
              {user.home_city}
            </Text>
            <Text variant="subtext" size="xs" className="flex items-center gap-1">
              <MapPin className="size-3" /> {user.home_airport} · Age {user.age}
            </Text>
          </Stack>

          <Stack direction="row" gap={2} className="flex-wrap">
            <Badge variant="default">{user.preferred_cabin}</Badge>
            <Badge variant="default">{user.price_sensitivity} price sensitivity</Badge>
            <Badge variant="default">{user.direct_preference} direct</Badge>
          </Stack>

          <Text variant="subtext" size="xs" className="italic line-clamp-2">
            &ldquo;{user.raw_history}&rdquo;
          </Text>
        </Stack>
      </Card>
    </NavLink>
  );
}
