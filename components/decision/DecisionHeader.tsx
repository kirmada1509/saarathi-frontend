"use client";

import { Card, Stack, Text, Badge, NavLink } from "@/components/ui/primitives";
import { PenLine, MapPin, Route as RouteIcon } from "lucide-react";
import type { DecisionParams } from "@/lib/decision-params";
import type { UserSummary } from "@/lib/types";

export function DecisionHeader({
  params,
  user,
  mode,
}: {
  params: DecisionParams;
  user?: UserSummary;
  mode?: "single-leg" | "multi-city";
}) {
  const destinationLabel =
    params.cities && params.cities.length > 0
      ? params.cities.join(" → ")
      : params.destination;

  return (
    <Card className="bg-bg-surface border-border-default">
      <Stack direction="row" align="start" justify="between" gap={4} className="flex-wrap">
        <Stack gap={2} className="flex-1 min-w-65">
          <Stack direction="row" align="center" gap={2} className="flex-wrap">
            <Badge variant="warning">{user ? user.user_id : params.userId}</Badge>
            {mode === "multi-city" && (
              <Badge variant="default">
                <RouteIcon className="w-3 h-3 mr-1" /> Multi-City
              </Badge>
            )}
            {destinationLabel && (
              <Text variant="mono" size="xs" className="text-text-secondary flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {destinationLabel}
              </Text>
            )}
          </Stack>
          <Text variant="body" size="sm" className="text-text-primary/90 italic leading-relaxed">
            &ldquo;{params.requestText}&rdquo;
          </Text>
          {user && (
            <Text variant="subtext" size="xs">
              {user.home_city} ({user.home_airport}) · {user.preferred_cabin} · {user.preferred_airlines || "Any airline"}
            </Text>
          )}
        </Stack>

        <NavLink
          href={mode === "multi-city" ? "/app/multi-city" : "/app"}
          active={false}
          className="flex items-center gap-1.5 shrink-0 border border-border-default rounded-md px-3 py-1.5 hover:border-accent hover:text-accent"
        >
          <PenLine className="w-3.5 h-3.5" />
          Edit request
        </NavLink>
      </Stack>
    </Card>
  );
}
