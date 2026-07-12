"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, Stack, Field, Text, Clickable } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CityChainBuilder } from "./CityChainBuilder";
import { buildDecisionQuery } from "@/lib/decision-params";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { Route as RouteIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useUsers } from "@/lib/queries";

export function RequestForm({ selectedUserId }: { selectedUserId: string }) {
  const router = useRouter();
  const { data: users = [] } = useUsers();
  const activeUser = users.find((u) => u.user_id === selectedUserId);

  const [requestText, setRequestText] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [cities, setCities] = React.useState<string[]>([]);
  const [stayDurations, setStayDurations] = React.useState<Record<string, number>>({});
  const [overrideRoute, setOverrideRoute] = React.useState(false);
  const [routeMode, setRouteMode] = React.useState<"single" | "multi">("single");
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state whenever selectedUserId is changed from the parent sidebar
  React.useEffect(() => {
    if (selectedUserId) {
      const seed = getBenchmarkQuery(selectedUserId);
      setRequestText(seed.requestText);
      setError(null);
      setStayDurations({});

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
  }, [selectedUserId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) {
      setError("Pick a traveler first.");
      return;
    }
    if (requestText.trim().length < 10) {
      setError("Describe the trip in a bit more detail.");
      return;
    }

    let resolvedDestination: string | undefined = undefined;
    let resolvedCities: string[] | undefined = undefined;
    let resolvedStayDurations: Record<string, number> | undefined = undefined;

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
        resolvedStayDurations = stayDurations;
      }
    } else {
      // If it matches the traveler default benchmark query, use its seed destination/cities
      const seed = getBenchmarkQuery(selectedUserId);
      if (requestText.trim() === seed.requestText.trim()) {
        resolvedDestination = seed.destination || undefined;
        resolvedCities = seed.cities.length > 0 ? seed.cities : undefined;
      }
    }

    setError(null);
    const query = buildDecisionQuery({
      userId: selectedUserId,
      requestText,
      destination: resolvedDestination,
      cities: resolvedCities,
      stayDurations: resolvedStayDurations,
    });
    router.push(`/app/decision?${query}`);
  }

  return (
    <Card className="bg-bg-surface border-border-default">
      <form onSubmit={onSubmit}>
        <Stack gap={5}>
          {/* Active Traveler Indicator Card */}
          {activeUser && (
            <Stack gap={2} className="bg-bg-surface-raised/40 p-4 rounded-md border border-border-default">
              <Stack direction="row" align="center" justify="between" className="flex-wrap gap-2">
                <Stack direction="row" align="center" gap={2}>
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <Text variant="body" size="sm" weight="semibold" className="text-text-primary">
                    Active Traveler: {activeUser.user_id}
                  </Text>
                </Stack>
                <Text variant="subtext" size="xs" className="text-text-secondary italic">
                  Age {activeUser.age} · Home: {activeUser.home_city} ({activeUser.home_airport})
                </Text>
              </Stack>
              <div className="flex flex-wrap gap-2 text-[11px] border-t border-border-default/40 pt-2.5 mt-1">
                <span className="bg-bg-base border border-border-default px-2 py-0.5 rounded text-text-secondary">
                  Cabin: <strong className="text-text-primary">{activeUser.preferred_cabin}</strong>
                </span>
                <span className="bg-bg-base border border-border-default px-2 py-0.5 rounded text-text-secondary">
                  Price Sensitivity: <strong className="text-text-primary">{activeUser.price_sensitivity}</strong>
                </span>
                <span className="bg-bg-base border border-border-default px-2 py-0.5 rounded text-text-secondary">
                  Direct flight: <strong className="text-text-primary">{activeUser.direct_preference}</strong>
                </span>
                {activeUser.preferred_airlines && (
                  <span className="bg-bg-base border border-border-default px-2 py-0.5 rounded text-text-secondary">
                    Airlines: <strong className="text-text-primary">{activeUser.preferred_airlines.replace(/;/g, ", ")}</strong>
                  </span>
                )}
              </div>
            </Stack>
          )}

          {/* Trip Description Textarea */}
          <Field
            label="Describe your trip"
            hint="Describe your destinations, dates, and preferences. Saarathi will automatically infer your route, stays, and preferences."
          >
            <Textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              rows={4}
              placeholder="e.g. I want to visit London for 3 days, Paris for 2 days, and Rome for 4 nights."
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
                      <Field label="City sequence" hint="Order matters — specify nights to stay at each destination.">
                        <CityChainBuilder
                          cities={cities}
                          onChange={setCities}
                          stayDurations={stayDurations}
                          onStayDurationsChange={setStayDurations}
                        />
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
            className="bg-accent text-text-on-accent hover:bg-accent-hover w-full sm:w-auto"
          >
            <RouteIcon className="size-4" /> Plan the itinerary
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
