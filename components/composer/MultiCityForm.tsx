"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, Stack, Field, Text } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TravelerSelect } from "./TravelerSelect";
import { CityChainBuilder } from "./CityChainBuilder";
import { useUsers } from "@/lib/queries";
import { buildDecisionQuery } from "@/lib/decision-params";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { Route as RouteIcon } from "lucide-react";

export function MultiCityForm() {
  const router = useRouter();
  const { data: users = [] } = useUsers();
  const [userId, setUserId] = React.useState("");
  const [requestText, setRequestText] = React.useState("");
  const [cities, setCities] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  function handleUserChange(id: string) {
    setUserId(id);
    const seed = getBenchmarkQuery(id);
    if (seed.cities.length > 0) setCities(seed.cities);
    if (!requestText) setRequestText(seed.requestText);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("Pick a traveler first.");
      return;
    }
    if (cities.length < 2) {
      setError("Add at least two cities to build a route.");
      return;
    }
    if (requestText.trim().length < 10) {
      setError("Describe the trip in a bit more detail.");
      return;
    }
    setError(null);
    const query = buildDecisionQuery({ userId, requestText, cities });
    router.push(`/app/decision?${query}`);
  }

  return (
    <Card className="bg-bg-surface border-border-default">
      <form onSubmit={handleSubmit}>
        <Stack gap={5}>
          <Field label="Traveler">
            <TravelerSelect users={users} value={userId} onValueChange={handleUserChange} />
          </Field>

          <Field label="City sequence" hint="Order matters — this is the exact routing order.">
            <CityChainBuilder cities={cities} onChange={setCities} />
          </Field>

          <Field label="Describe your trip">
            <Textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              rows={4}
              placeholder="e.g. Optimize my Europe tour for cost."
            />
          </Field>

          {error && (
            <Text variant="subtext" size="xs" className="text-signal-negative">
              {error}
            </Text>
          )}

          <Button type="submit" className="bg-accent text-text-on-accent hover:bg-accent-hover w-full sm:w-auto">
            <RouteIcon className="size-4" /> Plan the itinerary
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
