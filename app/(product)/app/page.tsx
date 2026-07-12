"use client";

import * as React from "react";
import { Container, Stack, Text, GradientMotif, Card, Clickable, Skeleton } from "@/components/ui/primitives";
import { RequestForm } from "@/components/composer/RequestForm";
import { useUsers } from "@/lib/queries";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { Check, Search, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComposerPage() {
  // Lazy initializers — read from browser APIs once, no setState-in-effect
  const [selectedUserId, setSelectedUserId] = React.useState(() => {
    if (typeof window === "undefined") return "U01";
    return localStorage.getItem("saarathi_selected_user_id") ?? "U01";
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const isFirstRenderRef = React.useRef(true);

  const { data: users = [], isLoading } = useUsers();

  // Load sidebar collapse preference on desktop on mount
  React.useEffect(() => {
    const tid = setTimeout(() => {
      const saved = localStorage.getItem("saarathi_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    }, 0);
    return () => clearTimeout(tid);
  }, []);

  // Persist sidebar collapsed preference
  React.useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    localStorage.setItem("saarathi_sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  // Persist traveler selection
  React.useEffect(() => {
    localStorage.setItem("saarathi_selected_user_id", selectedUserId);
  }, [selectedUserId]);



  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.user_id.toLowerCase().includes(q) ||
      u.home_city.toLowerCase().includes(q) ||
      u.home_airport.toLowerCase().includes(q) ||
      u.preferred_cabin.toLowerCase().includes(q)
    );
  });

  return (
    <Stack className="relative overflow-hidden">
      <GradientMotif variant="hero" />
      <Container className="max-w-7xl py-8 md:py-12">
        <Stack direction="row" className="flex-col lg:flex-row gap-6 items-stretch relative">
          {/* Form Column (Flex 1) */}
          <Stack className="flex-1 w-full min-w-0">
            <Stack gap={6}>
              <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4">
                <Stack gap={2} className="flex-1 min-w-70">
                  <Text variant="display" size="3xl" weight="semibold">
                    Plan a trip
                  </Text>
                  <Text variant="body" size="base" className="text-text-secondary">
                    Describe your trip below. Saarathi will parse your route, analyze traveler preferences, and commit to one verdict.
                  </Text>
                </Stack>
                {/* Show Travelers Button */}
                <Clickable
                  onClick={() => {
                    setIsCollapsed(false);
                    setIsMobileOpen(true);
                  }}
                  className={cn(
                    "border border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer self-start",
                    isCollapsed ? "lg:flex" : "lg:hidden",
                    isMobileOpen ? "hidden" : "flex"
                  )}
                >
                  <Users className="size-4" />
                  <span>Show Travelers</span>
                </Clickable>
              </Stack>
              <RequestForm
                selectedUserId={selectedUserId}
                onStaysConfirmationChange={(show) => {
                  if (show) {
                    setIsCollapsed(true);
                    setIsMobileOpen(false);
                  }
                }}
              />
            </Stack>
          </Stack>

          {/* Traveler Sidebar Column */}
          <Stack
            className={cn(
              "w-full lg:w-[360px] lg:shrink-0",
              isCollapsed ? "lg:hidden" : "lg:block",
              isMobileOpen ? "block" : "hidden"
            )}
          >
            <Card 
              className="bg-bg-surface border-border-default h-full max-h-180 flex flex-col lg:min-w-70 w-full"
            >
              <Stack gap={4} className="p-5 border-b border-border-default">
                <Stack direction="row" align="center" justify="between">
                  <Stack direction="row" align="center" gap={2}>
                    <Users className="size-4 text-accent" />
                    <Text variant="heading" size="base" className="font-semibold text-accent">
                      Traveler Profiles
                    </Text>
                  </Stack>
                  <Clickable
                    onClick={() => {
                      setIsCollapsed(true);
                      setIsMobileOpen(false);
                    }}
                    className="p-1 rounded hover:bg-bg-surface-raised text-text-secondary hover:text-text-primary"
                    title="Collapse sidebar"
                  >
                    <ChevronRight className="size-4" />
                  </Clickable>
                </Stack>

                  <Text variant="subtext" size="xs">
                    Select any traveler to load preferences. Drag the divider to resize.
                  </Text>
                  
                  <Stack className="relative">
                    <input
                      type="text"
                      placeholder="Filter by ID, city, or cabin..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border-default bg-bg-base text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-secondary" />
                  </Stack>
                </Stack>

                <Stack className="flex-1 overflow-y-auto p-5 pt-3">
                  {isLoading ? (
                    <Stack className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </Stack>
                  ) : filteredUsers.length === 0 ? (
                    <Text variant="subtext" className="text-center py-8">
                      No matching travelers found.
                    </Text>
                  ) : (
                    <Stack className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                      {filteredUsers.map((u) => {
                        const isSelected = u.user_id === selectedUserId;
                        const seed = getBenchmarkQuery(u.user_id);
                        const displayQuery = seed.requestText !== "Find me flights." 
                          ? seed.requestText 
                          : `I want to find a flight from ${u.home_airport} to...`;

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
                              <Stack direction="row" className="flex-wrap gap-1 mt-1 text-[10px]">
                                <span className="bg-bg-base border border-border-default px-1.5 py-0.5 rounded text-text-secondary">
                                  Price: {u.price_sensitivity}
                                </span>
                                <span className="bg-bg-base border border-border-default px-1.5 py-0.5 rounded text-text-secondary">
                                  Direct: {u.direct_preference}
                                </span>
                              </Stack>
                              <Text variant="subtext" size="xs" className="italic text-text-secondary/80 line-clamp-2 border-t border-border-default/40 pt-2 mt-1">
                                &ldquo;{displayQuery}&rdquo;
                              </Text>
                            </Stack>
                          </Clickable>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Stack>
        </Stack>
      </Container>
    </Stack>
  );
}
