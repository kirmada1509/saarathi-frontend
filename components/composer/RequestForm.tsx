"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, Stack, Field, Text, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildDecisionQuery } from "@/lib/decision-params";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { parseRoute } from "@/lib/api";
import { Route as RouteIcon, Sparkles } from "lucide-react";
import { useUsers } from "@/lib/queries";

export function RequestForm({ selectedUserId }: { selectedUserId: string }) {
  const router = useRouter();
  const { data: users = [] } = useUsers();
  const activeUser = users.find((u) => u.user_id === selectedUserId);

  const [requestText, setRequestText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  
  // Inline confirmation state variables
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [showStaysConfirmation, setShowStaysConfirmation] = React.useState(false);
  const [inferredCities, setInferredCities] = React.useState<string[]>([]);
  const [inferredStayDurations, setInferredStayDurations] = React.useState<Record<string, number>>({});
  const [placeNames, setPlaceNames] = React.useState<Record<string, string>>({});

  const loadedForUserRef = React.useRef<string | null>(null);

  // Sync state whenever selectedUserId is changed from the parent sidebar
  React.useEffect(() => {
    if (!selectedUserId) return;

    const seed = getBenchmarkQuery(selectedUserId);
    const savedText = localStorage.getItem(`saarathi_request_text_${selectedUserId}`);

    let next: string;
    if (savedText) {
      next = savedText;
    } else if (seed.requestText !== "Find me flights.") {
      next = seed.requestText;
    } else {
      const activeUserObj = users.find((u) => u.user_id === selectedUserId);
      next = activeUserObj
        ? `I want to find a flight from ${activeUserObj.home_airport} to `
        : "Find me flights.";
    }

    // Batch all state updates in a microtask so they are treated as
    // external-system synchronisation, not synchronous setState in an effect
    const tid = setTimeout(() => {
      setError(null);
      setShowStaysConfirmation(false);
      setRequestText(next);
      loadedForUserRef.current = selectedUserId;
    }, 0);
    return () => clearTimeout(tid);
  }, [selectedUserId, users]);

  // Persist requestText changes to localStorage
  React.useEffect(() => {
    if (selectedUserId && requestText && loadedForUserRef.current === selectedUserId) {
      localStorage.setItem(`saarathi_request_text_${selectedUserId}`, requestText);
    }
  }, [selectedUserId, requestText]);

  async function handlePlanItinerary(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) {
      setError("Pick a traveler first.");
      return;
    }
    if (requestText.trim().length < 10) {
      setError("Describe the trip in a bit more detail.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await parseRoute({ userId: selectedUserId, requestText });
      setIsAnalyzing(false);

      if (res.mode === "single") {
        // Direct redirect for single-leg
        const query = buildDecisionQuery({
          userId: selectedUserId,
          requestText,
          origin: res.origin || undefined,
          destination: res.destination || undefined,
        });
        router.push(`/app/decision?${query}`);
      } else {
        // Multi-city: intercept flow and ask for stays confirmation
        setInferredCities(res.cities || []);
        setInferredStayDurations(res.stayDurations || {});
        setPlaceNames(res.placeNames || {});
        setShowStaysConfirmation(true);
      }
    } catch (err) {
      setIsAnalyzing(false);
      setError(err instanceof Error ? err.message : "Failed to resolve route from description.");
    }
  }

  function handleConfirmFlights() {
    if (inferredCities.length < 2) {
      setError("At least two cities are required for a multi-city route.");
      return;
    }
    const query = buildDecisionQuery({
      userId: selectedUserId,
      requestText,
      cities: inferredCities,
      stayDurations: inferredStayDurations,
    });
    router.push(`/app/decision?${query}`);
  }

  if (showStaysConfirmation) {
    return (
      <Card className="bg-bg-surface border-border-default relative overflow-hidden">
        <span className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
        <Stack gap={5} className="pl-2">
          {/* Header */}
          <Stack gap={1}>
            <Stack direction="row" align="center" gap={2}>
              <Sparkles className="size-5 text-accent animate-pulse" />
              <Text variant="heading" size="lg" className="text-text-primary font-bold">
                Confirm Stay Durations
              </Text>
            </Stack>
            <Text variant="body" size="sm" className="text-text-secondary">
              We detected a multi-city route. Please configure how many nights you want to spend at each destination:
            </Text>
          </Stack>

          {/* Active Traveler Summary */}
          {activeUser && (
            <Stack className="bg-bg-surface-raised/40 p-3 rounded border border-border-default text-xs text-text-secondary">
              <Text variant="subtext" size="xs">
                Traveler Profile: <strong className="text-text-primary">{activeUser.user_id}</strong> · Home Base: <strong className="text-text-primary">{activeUser.home_city} ({activeUser.home_airport})</strong>
              </Text>
            </Stack>
          )}
          {/* Journey Sequence */}
          <Stack gap={4} className="border border-border-default rounded-lg p-4 bg-bg-surface-raised/20 relative">
            
            {/* Start Airport */}
            <Stack direction="row" align="center" gap={3} className="border-b border-border-default pb-3 bg-bg-surface/40 p-2.5 rounded-md">
              <Stack className="w-6 h-6 rounded-full bg-accent/20 items-center justify-center border border-accent">
                <Stack className="w-2.5 h-2.5 rounded-full bg-accent" />
              </Stack>
              <Stack gap={1}>
                <Text variant="subtext" size="xs" className="uppercase tracking-wider font-bold text-accent">Start Base</Text>
                <Text variant="mono" size="sm" weight="bold" className="text-text-primary">
                  {activeUser?.home_airport} {activeUser?.home_city ? `(${activeUser.home_city})` : ""}
                </Text>
              </Stack>
            </Stack>

            {/* Intermediate Stays */}
            <Stack gap={3} className="py-1">
              <Text variant="subtext" size="xs" className="uppercase tracking-wider font-bold text-text-secondary pl-1">
                Intermediate Stays
              </Text>
              {inferredCities.map((code, index) => (
                <Stack
                  key={`${code}-${index}`}
                  direction="row"
                  align="center"
                  justify="between"
                  className="border border-border-default rounded-md px-3 py-2 bg-bg-surface hover:border-accent/40 transition-colors"
                >
                  <Stack direction="row" align="center" gap={3}>
                    <Badge variant="default" className="bg-bg-surface-raised border border-border-default text-text-primary font-bold">
                      Stop {index + 1}
                    </Badge>
                    <Text variant="mono" size="sm" weight="bold" className="text-text-primary">
                      {code} {placeNames[code] ? `(${placeNames[code]})` : ""}
                    </Text>
                  </Stack>

                  <Stack direction="row" align="center" gap={2}>
                    {/* Minus button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const current = inferredStayDurations[code] ?? 2;
                        setInferredStayDurations({
                          ...inferredStayDurations,
                          [code]: Math.max(0, current - 1),
                        });
                      }}
                      className="w-7 h-7 p-0 items-center justify-center rounded-md border border-border-default bg-bg-surface text-text-primary hover:bg-bg-surface-raised hover:border-accent text-sm font-bold transition-all focus:outline-none select-none active:scale-95 cursor-pointer"
                    >
                      -
                    </Button>

                    {/* Value display */}
                    <span className="w-8 text-center text-sm font-mono font-bold text-text-primary select-none">
                      {inferredStayDurations[code] ?? 2}
                    </span>

                    {/* Plus button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const current = inferredStayDurations[code] ?? 2;
                        setInferredStayDurations({
                          ...inferredStayDurations,
                          [code]: Math.min(30, current + 1),
                        });
                      }}
                      className="w-7 h-7 p-0 items-center justify-center rounded-md border border-border-default bg-bg-surface text-text-primary hover:bg-bg-surface-raised hover:border-accent text-sm font-bold transition-all focus:outline-none select-none active:scale-95 cursor-pointer"
                    >
                      +
                    </Button>

                    <Text variant="subtext" size="xs" className="ml-2 w-28 text-left select-none text-text-secondary">
                      {(inferredStayDurations[code] ?? 2) === 0
                        ? "same day departure"
                        : (inferredStayDurations[code] ?? 2) === 1
                        ? "night"
                        : "nights"}
                    </Text>
                  </Stack>
                </Stack>
              ))}
            </Stack>

            {/* End Airport */}
            <Stack direction="row" align="center" gap={3} className="border-t border-border-default pt-3 bg-bg-surface/40 p-2.5 rounded-md mt-1">
              <Stack className="w-6 h-6 rounded-full bg-border-default/40 items-center justify-center border border-border-default">
                <Stack className="w-2.5 h-2.5 rounded-full bg-text-secondary" />
              </Stack>
              <Stack gap={1}>
                <Text variant="subtext" size="xs" className="uppercase tracking-wider font-bold text-text-secondary">Return Base</Text>
                <Text variant="mono" size="sm" weight="bold" className="text-text-primary">
                  {activeUser?.home_airport} {activeUser?.home_city ? `(${activeUser.home_city})` : ""}
                </Text>
              </Stack>
            </Stack>

          </Stack>

          {error && (
            <Text variant="subtext" size="xs" className="text-signal-negative font-medium">
              {error}
            </Text>
          )}

          {/* Action buttons */}
          <Stack direction="row" gap={3} className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowStaysConfirmation(false)}
              className="flex-1"
            >
              Edit Prompt
            </Button>
            <Button
              type="button"
              onClick={handleConfirmFlights}
              className="flex-1 bg-accent text-text-on-accent hover:bg-accent-hover"
            >
              Optimize Itinerary →
            </Button>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Card className="bg-bg-surface border-border-default">
      <form onSubmit={handlePlanItinerary}>
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
              <Stack className="flex flex-wrap gap-2 text-[11px] border-t border-border-default/40 pt-2.5 mt-1">
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
              </Stack>
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
              rows={5}
              placeholder="e.g. I want to visit London for 3 days, Paris for 2 days, and Rome for 4 nights."
            />
          </Field>

          {error && (
            <Text variant="subtext" size="xs" className="text-signal-negative font-medium">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            disabled={isAnalyzing}
            className="bg-accent text-text-on-accent hover:bg-accent-hover w-full sm:w-auto"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-text-on-accent border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing route...
              </>
            ) : (
              <>
                <RouteIcon className="size-4" /> Plan the itinerary
              </>
            )}
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
