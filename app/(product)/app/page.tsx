"use client";

import * as React from "react";
import { Container, Stack, Text, GradientMotif, Card, Clickable, Skeleton } from "@/components/ui/primitives";
import { RequestForm } from "@/components/composer/RequestForm";
import { useUsers } from "@/lib/queries";
import { getBenchmarkQuery } from "@/lib/benchmark-queries";
import { Check, Search, Users, ChevronRight } from "lucide-react";

export default function ComposerPage() {
  const [selectedUserId, setSelectedUserId] = React.useState("U01");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [width, setWidth] = React.useState(360);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  
  const { data: users = [], isLoading } = useUsers();

  React.useEffect(() => {
    setIsLargeScreen(window.innerWidth >= 1024);
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startDragging = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    function handleMouseMove(moveEvent: MouseEvent) {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = startWidth + deltaX;
      setWidth(Math.max(280, Math.min(650, newWidth)));
    }

    function handleMouseUp() {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [width]);

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
        <div className="flex flex-col lg:flex-row gap-6 items-stretch relative select-none">
          {/* Form Column (Flex 1) */}
          <div className="flex-1 w-full min-w-0">
            <Stack gap={6}>
              <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4">
                <Stack gap={2} className="flex-1 min-w-[280px]">
                  <Text variant="display" size="3xl" weight="semibold">
                    Plan a trip
                  </Text>
                  <Text variant="body" size="base" className="text-text-secondary">
                    Describe your trip below. Saarathi will parse your route, analyze traveler preferences, and commit to one verdict.
                  </Text>
                </Stack>
                {isCollapsed && (
                  <Clickable
                    onClick={() => setIsCollapsed(false)}
                    className="border border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer self-start"
                  >
                    <Users className="size-4" />
                    <span>Show Travelers</span>
                  </Clickable>
                )}
              </Stack>
              <RequestForm selectedUserId={selectedUserId} />
            </Stack>
          </div>

          {/* Draggable Divider Handle */}
          {!isCollapsed && (
            <div
              onMouseDown={startDragging}
              className="hidden lg:block w-2 hover:bg-accent/10 cursor-col-resize self-stretch transition-colors select-none relative group min-h-[400px]"
              title="Drag to resize sidebar"
            >
              {/* Center divider line */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-border-default group-hover:bg-accent" />
              {/* Visual Splitter Grabber Indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-7 rounded bg-bg-surface-raised border border-border-default flex items-center justify-center gap-[2px] px-[3px] group-hover:border-accent group-hover:shadow-sm">
                <span className="w-[1px] h-3 bg-text-secondary/40 group-hover:bg-accent/60" />
                <span className="w-[1px] h-3 bg-text-secondary/40 group-hover:bg-accent/60" />
              </div>
            </div>
          )}

          {/* Traveler Sidebar Column */}
          {!isCollapsed && (
            <div 
              style={{ width: isLargeScreen ? `${width}px` : "100%" }} 
              className="w-full lg:w-auto lg:flex-shrink-0"
            >
              <Card 
                className="bg-bg-surface border-border-default h-full max-h-[720px] flex flex-col lg:min-w-[280px] w-full"
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
                      onClick={() => setIsCollapsed(true)}
                      className="p-1 rounded hover:bg-bg-surface-raised text-text-secondary hover:text-text-primary"
                      title="Collapse sidebar"
                    >
                      <ChevronRight className="size-4" />
                    </Clickable>
                  </Stack>

                  <Text variant="subtext" size="xs">
                    Select any traveler to load preferences. Drag the divider to resize.
                  </Text>
                  
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter by ID, city, or cabin..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border-default bg-bg-base text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-secondary" />
                  </div>
                </Stack>

                <div className="flex-1 overflow-y-auto p-5 pt-3">
                  {isLoading ? (
                    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <Text variant="subtext" className="text-center py-8">
                      No matching travelers found.
                    </Text>
                  ) : (
                    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
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
                              <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                                <span className="bg-bg-base border border-border-default px-1.5 py-0.5 rounded text-text-secondary">
                                  Price: {u.price_sensitivity}
                                </span>
                                <span className="bg-bg-base border border-border-default px-1.5 py-0.5 rounded text-text-secondary">
                                  Direct: {u.direct_preference}
                                </span>
                              </div>
                              <Text variant="subtext" size="xs" className="italic text-text-secondary/80 line-clamp-2 border-t border-border-default/40 pt-2 mt-1">
                                &ldquo;{displayQuery}&rdquo;
                              </Text>
                            </Stack>
                          </Clickable>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </Stack>
  );
}
