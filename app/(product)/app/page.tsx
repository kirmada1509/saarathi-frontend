"use client";

import * as React from "react";
import { Container, Stack, Text, GradientMotif, Card, Clickable, Skeleton } from "@/components/ui/primitives";
import { RequestForm } from "@/components/composer/RequestForm";
import { useUsers } from "@/lib/queries";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { Check } from "lucide-react";

export default function ComposerPage() {
  const [selectedUserId, setSelectedUserId] = React.useState("U01");
  const { data: users = [], isLoading } = useUsers();

  const benchmarkUsers = ["U01", "U02", "U03", "U04", "U05", "U06"]
    .map((id) => users.find((u) => u.user_id === id))
    .filter((u): u is NonNullable<typeof u> => !!u);

  return (
    <Stack className="relative overflow-hidden">
      <GradientMotif variant="hero" />
      <Container className="max-w-6xl py-12 md:py-20">
        <Stack gap={8}>
          <Stack gap={2}>
            <Text variant="display" size="3xl" weight="semibold">
              Plan a trip
            </Text>
            <Text variant="body" size="base" className="text-text-secondary">
              Describe your trip on the left. The engine will parse your route, analyze traveler history, run counterfactuals, and commit to one verdict.
            </Text>
          </Stack>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column (2/3 width) */}
            <div className="lg:col-span-2">
              <RequestForm selectedUserId={selectedUserId} />
            </div>

            {/* Traveler Sidebar Column (1/3 width) */}
            <div className="lg:col-span-1">
              <Card className="bg-bg-surface border-border-default h-full">
                <Stack gap={4}>
                  <Text variant="heading" size="base" className="font-semibold text-accent border-b border-border-default pb-3">
                    Traveler Profiles
                  </Text>
                  <Text variant="subtext" size="xs">
                    Select a benchmark traveler below to load their preferences and default query.
                  </Text>

                  {isLoading ? (
                    <Stack gap={3}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </Stack>
                  ) : (
                    <Stack gap={3} className="max-h-[600px] overflow-y-auto pr-1">
                      {benchmarkUsers.map((u) => {
                        const isSelected = u.user_id === selectedUserId;
                        const seed = getBenchmarkQuery(u.user_id);
                        return (
                          <Clickable
                            key={u.user_id}
                            onClick={() => setSelectedUserId(u.user_id)}
                            className={`text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer block ${
                              isSelected
                                ? "border-accent bg-bg-surface-raised/60 shadow-sm ring-1 ring-accent"
                                : "border-border-default bg-bg-surface hover:border-border-default/80 hover:bg-bg-surface-raised/20"
                            }`}
                          >
                            <Stack gap={2}>
                              <Stack direction="row" align="center" justify="between">
                                <Stack direction="row" align="center" gap={2}>
                                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-accent" : "bg-text-secondary/40"}`} />
                                  <Text variant="mono" size="xs" weight="bold" className={isSelected ? "text-accent" : "text-text-primary"}>
                                    {u.user_id}
                                  </Text>
                                </Stack>
                                {isSelected && <Check className="size-4 text-accent" />}
                              </Stack>
                              <Stack gap={1}>
                                <Text variant="heading" size="sm" className="font-semibold text-text-primary">
                                  {u.home_city} ({u.home_airport})
                                </Text>
                                <Text variant="subtext" size="xs" className="text-text-secondary">
                                  Age {u.age} · {u.preferred_cabin}
                                </Text>
                              </Stack>
                              <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                                <span className="bg-bg-base border border-border-default px-1.5 py-0.5 rounded text-text-secondary">
                                  Price: {u.price_sensitivity}
                                </span>
                                <span className="bg-bg-base border border-border-default px-1.5 py-0.5 rounded text-text-secondary">
                                  Direct: {u.direct_preference}
                                </span>
                              </div>
                              <Text variant="subtext" size="xs" className="italic text-text-secondary/80 line-clamp-2 border-t border-border-default/40 pt-2 mt-1">
                                &ldquo;{seed.requestText}&rdquo;
                              </Text>
                            </Stack>
                          </Clickable>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </div>
          </div>
        </Stack>
      </Container>
    </Stack>
  );
}
