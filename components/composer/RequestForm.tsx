"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, Stack, Field, Text, Clickable } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TravelerSelect } from "./TravelerSelect";
import { CityChainBuilder } from "./CityChainBuilder";
import { useUsers } from "@/lib/queries";
import { buildDecisionQuery } from "@/lib/decision-params";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { Route as RouteIcon, ChevronDown, ChevronUp } from "lucide-react";

export function RequestForm() {
  const router = useRouter();
  const { data: users = [], isLoading } = useUsers();

  const [userId, setUserId] = React.useState("");
  const [requestText, setRequestText] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [cities, setCities] = React.useState<string[]>([]);
  const [overrideRoute, setOverrideRoute] = React.useState(false);
  const [routeMode, setRouteMode] = React.useState<"single" | "multi">("single");
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleUserChange(id: string) {
    setUserId(id);
    const seed = getBenchmarkQuery(id);
    setRequestText(seed.requestText);
    setError(null);

    // Pre-populate manual controls for fallback/override
    if (seed.cities.length > 0) {
      setCities(seed.cities);
      setDestination("");
      setRouteMode("multi");
    } else {
      setCities([]);
      setDestination(seed.destination || "");
      setRouteMode("single");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("Pick a traveler first.");
      return;
    }
    if (requestText.trim().length < 10) {
      setError("Describe the trip in a bit more detail.");
      return;
    }

    let resolvedDestination: string | undefined = undefined;
    let resolvedCities: string[] | undefined = undefined;

    if (overrideRoute) {
      if (routeMode === "single") {
        if (!destination || destination.length < 3) {
          setError("Enter a valid 3-letter IATA code.");
          return;
        }
        resolvedDestination = destination.toUpperCase();
      } else {
        if (cities.length < 2) {
          setError("Add at least two cities to build a route.");
          return;
        }
        resolvedCities = cities;
      }
    } else {
      // If it matches the traveler default benchmark query, use its seed destination/cities
      const seed = getBenchmarkQuery(userId);
      if (requestText.trim() === seed.requestText.trim()) {
        resolvedDestination = seed.destination || undefined;
        resolvedCities = seed.cities.length > 0 ? seed.cities : undefined;
      }
    }

    setError(null);
    const query = buildDecisionQuery({
      userId,
      requestText,
      destination: resolvedDestination,
      cities: resolvedCities,
    });
    router.push(`/app/decision?${query}`);
  }

  return (
    <Card className="bg-bg-surface border-border-default">
      <form onSubmit={onSubmit}>
        <Stack gap={5}>
          {/* Traveler Selection */}
          <Field label="Traveler">
            <TravelerSelect users={users} value={userId} onValueChange={handleUserChange} />
          </Field>

          {/* Trip Description Textarea */}
          <Field
            label="Describe your trip"
            hint="Describe your destinations, dates, and preferences. Saarathi will automatically infer your route and preferences."
          >
            <Textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              rows={4}
              placeholder="e.g. I need to get to New York for a Tuesday meeting and return by Thursday."
            />
          </Field>

          {/* Advanced Route Toggles (Optional) */}
          <Stack className="border border-border-default rounded-md bg-bg-surface-raised/10 overflow-hidden">
            <Clickable
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between px-4 py-3 bg-bg-surface-raised/40 hover:bg-bg-surface-raised/60 transition-colors w-full"
            >
              <Text variant="body" size="sm" weight="semibold" className="text-text-primary">
                Advanced Route Settings (Optional)
              </Text>
              {showAdvanced ? (
                <ChevronUp className="size-4 text-text-secondary" />
              ) : (
                <ChevronDown className="size-4 text-text-secondary" />
              )}
            </Clickable>

            {showAdvanced && (
              <Stack gap={4} className="p-4 border-t border-border-default">
                <Stack direction="row" align="center" gap={3}>
                  <input
                    type="checkbox"
                    id="overrideRoute"
                    checked={overrideRoute}
                    onChange={(e) => setOverrideRoute(e.target.checked)}
                    className="rounded border-border-default text-accent focus:ring-accent size-4"
                  />
                  <label
                    htmlFor="overrideRoute"
                    className="text-sm font-medium text-text-primary cursor-pointer select-none"
                  >
                    Manually specify destinations (ignores description inference)
                  </label>
                </Stack>

                {overrideRoute && (
                  <Stack gap={4} className="pl-7 pt-2 border-l-2 border-border-default/60">
                    <Field label="Routing Mode">
                      <select
                        value={routeMode}
                        onChange={(e) => setRouteMode(e.target.value as "single" | "multi")}
                        className="flex h-10 w-full rounded-md border border-input bg-bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="single">Single Destination</option>
                        <option value="multi">Multi-city Sequence</option>
                      </select>
                    </Field>

                    {routeMode === "single" ? (
                      <Field label="Destination airport" hint="3-letter IATA code, e.g. JFK">
                        <Input
                          value={destination}
                          onChange={(e) => setDestination(e.target.value.toUpperCase())}
                          placeholder="JFK"
                          className="uppercase"
                          maxLength={4}
                        />
                      </Field>
                    ) : (
                      <Field label="City sequence" hint="Order matters — this is the exact routing order.">
                        <CityChainBuilder cities={cities} onChange={setCities} />
                      </Field>
                    )}
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>

          {error && (
            <Text variant="subtext" size="xs" className="text-signal-negative font-medium">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-accent text-text-on-accent hover:bg-accent-hover w-full sm:w-auto"
          >
            <RouteIcon className="size-4" /> Plan the itinerary
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
