"use client";

import React, { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Stack, Text, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Users, Search } from "lucide-react";

export function Header() {
  const {
    users,
    selectedUserId,
    requestText,
    fetchUsers,
    selectUser,
    setRequestText,
    getRecommendation,
    loading,
  } = useStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectUser(e.target.value);
  };

  const handleAnalyze = () => {
    getRecommendation();
  };

  const selectedUser = users.find((u) => u.user_id === selectedUserId);

  return (
    <Card className="w-full bg-bg-surface border-border-default">
      <Stack gap={4}>
        <Stack direction="row" align="center" justify="between" className="flex-wrap gap-4">
          {/* Title */}
          <Stack gap={1}>
            <Text variant="heading" size="2xl" className="text-accent font-bold tracking-tight">
              Saarathi
            </Text>
            <Text variant="subtext" size="sm">
              Expedia AI Decision Engine & Boundary Analyzer
            </Text>
          </Stack>

          {/* Traveler Picker */}
          <Stack direction="row" align="center" gap={2} className="min-w-[280px]">
            <Users className="w-4 h-4 text-accent" />
            <Text variant="subtext" className="whitespace-nowrap">
              Traveler Profile:
            </Text>
            <select
              value={selectedUserId}
              onChange={handleUserChange}
              className="flex-1 bg-bg-surface-raised border border-border-default rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent font-sans cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.user_id} — {u.home_city} ({u.preferred_cabin})
                </option>
              ))}
            </select>
          </Stack>
        </Stack>

        {/* User context banner */}
        {selectedUser && (
          <Stack
            direction="row"
            gap={3}
            align="center"
            className="bg-bg-surface-raised/40 border border-border-default/50 rounded-md p-3 text-xs"
          >
            <Text variant="mono" className="text-accent bg-accent/10 px-2 py-0.5 rounded">
              CONTEXT
            </Text>
            <Stack gap={1} className="flex-1">
              <Text variant="body" size="sm" className="font-medium">
                Home: {selectedUser.home_city} ({selectedUser.home_airport}) | Preferred Cabin: {selectedUser.preferred_cabin} | Airlines: {selectedUser.preferred_airlines || "Any"}
              </Text>
              <Text variant="subtext" className="italic line-clamp-1">
                History: &quot;{selectedUser.raw_history}&quot;
              </Text>
            </Stack>
          </Stack>
        )}

        {/* Search input field */}
        <Stack direction="row" gap={3} align="stretch" className="w-full">
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            disabled={loading}
            placeholder="Type your travel request (e.g. 'Amsterdam to Bali next summer')"
            className="flex-1 bg-bg-surface-raised border border-border-default rounded-md px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent font-sans resize-none h-[72px]"
          />
          <Button
            onClick={handleAnalyze}
            disabled={loading || !requestText}
            className="bg-accent hover:bg-accent-hover text-bg-base font-semibold px-6 rounded-md transition-colors flex items-center justify-center gap-2 select-none self-stretch"
          >
            {loading ? (
              <Stack direction="row" align="center" gap={2}>
                <span className="w-4 h-4 border-2 border-bg-base border-t-transparent rounded-full animate-spin" />
                <Text variant="body" className="text-bg-base font-semibold">Running...</Text>
              </Stack>
            ) : (
              <Stack direction="row" align="center" gap={2}>
                <Search className="w-4 h-4 text-bg-base" />
                <Text variant="body" className="text-bg-base font-semibold">Analyze</Text>
              </Stack>
            )}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
