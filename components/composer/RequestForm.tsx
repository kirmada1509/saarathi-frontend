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
import { Route as RouteIcon } from "lucide-react";
import { useUsers } from "@/lib/queries";

export function RequestForm({ selectedUserId }: { selectedUserId: string }) {
  const router = useRouter();
  const { data: users = [] } = useUsers();
  const activeUser = users.find((u) => u.user_id === selectedUserId);

  const [requestText, setRequestText] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [cities, setCities] = React.useState<string[]>([]);
  const [stayDurations, setStayDurations] = React.useState<Record<string, number>>({});
  const [routeMode, setRouteMode] = React.useState<"single" | "multi">("single");
  const [error, setError] = React.useState<string | null>(null);

  // Sync state whenever selectedUserId is changed from the parent sidebar
  React.useEffect(() => {
    if (selectedUserId) {
      const seed = getBenchmarkQuery(selectedUserId);
      setError(null);

      // Pre-fill stay durations for multi-city cities (e.g. 2 nights per city as default)
      const initialStays: Record<string, number> = {};
      if (seed.cities.length > 0) {
        seed.cities.forEach((city) => {
          initialStays[city] = 2;
        });
      }
      setStayDurations(initialStays);

      if (seed.requestText !== "Find me flights.") {
        setRequestText(seed.requestText);
      } else {
        const activeUserObj = users.find((u) => u.user_id === selectedUserId);
        if (activeUserObj) {
          setRequestText(`I want to find a flight from ${activeUserObj.home_airport} to `);
        } else {
          setRequestText("Find me flights.");
        }
      }

      // Pre-populate manual controls
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
  }, [selectedUserId, users]);

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

    if (routeMode === "single") {
      if (!destination || destination.length < 3) {
        setError("Enter a valid 3-letter IATA destination code.");
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

          {/* Inline Route Configuration */}
          <Stack gap={4} className="border border-border-default rounded-lg p-4 bg-bg-surface-raised/20">
            <Stack direction="row" align="center" justify="between" className="border-b border-border-default pb-2 flex-wrap gap-2">
              <Text variant="heading" size="sm" className="font-semibold text-text-primary">
                Route & Stay Details
              </Text>
              <div className="flex gap-2">
                <Clickable
                  type="button"
                  onClick={() => setRouteMode("single")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    routeMode === "single"
                      ? "bg-accent text-text-on-accent"
                      : "bg-bg-base border border-border-default text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Single Destination
                </Clickable>
                <Clickable
                  type="button"
                  onClick={() => setRouteMode("multi")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    routeMode === "multi"
                      ? "bg-accent text-text-on-accent"
                      : "bg-bg-base border border-border-default text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Multi-City Route
                </Clickable>
              </div>
            </Stack>

            {routeMode === "single" ? (
              <Field label="Destination Airport" hint="3-letter IATA code, e.g. JFK or NRT">
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  placeholder="JFK"
                  className="uppercase font-mono w-32"
                  maxLength={3}
                />
              </Field>
            ) : (
              <Field label="City Sequence & Nights of Stay" hint="Specify the nights to stay in each intermediate city.">
                <CityChainBuilder
                  cities={cities}
                  onChange={setCities}
                  stayDurations={stayDurations}
                  onStayDurationsChange={setStayDurations}
                />
              </Field>
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
