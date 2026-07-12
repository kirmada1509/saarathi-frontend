"use client";

import * as React from "react";
import { Stack, Text, Badge, Clickable } from "@/components/ui/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ArrowUp, ArrowDown, Plus } from "lucide-react";

export function CityChainBuilder({
  cities,
  onChange,
  stayDurations = {},
  onStayDurationsChange,
}: {
  cities: string[];
  onChange: (cities: string[]) => void;
  stayDurations?: Record<string, number>;
  onStayDurationsChange?: (durations: Record<string, number>) => void;
}) {
  const [draft, setDraft] = React.useState("");

  function addCity() {
    const code = draft.trim().toUpperCase();
    if (code.length < 3) return;
    onChange([...cities, code]);
    setDraft("");
  }

  function removeAt(index: number) {
    const code = cities[index];
    if (onStayDurationsChange) {
      const nextDurations = { ...stayDurations };
      delete nextDurations[code];
      onStayDurationsChange(nextDurations);
    }
    onChange(cities.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= cities.length) return;
    const next = [...cities];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <Stack gap={3}>
      <Stack direction="row" gap={2}>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCity();
            }
          }}
          placeholder="Add IATA code, e.g. CDG"
          maxLength={4}
          className="uppercase"
        />
        <Button type="button" variant="outline" onClick={addCity}>
          <Plus className="size-4" /> Add
        </Button>
      </Stack>

      {cities.length === 0 ? (
        <Text variant="subtext" size="xs">
          No cities added yet — add at least two to build a route.
        </Text>
      ) : (
        <Stack gap={2}>
          {cities.map((code, index) => (
            <Stack
              key={`${code}-${index}`}
              direction="row"
              align="center"
              justify="between"
              className="border border-border-default rounded-md px-3 py-2 bg-bg-surface-raised/40"
            >
              <Stack direction="row" align="center" gap={4} className="flex-1">
                <Stack direction="row" align="center" gap={2}>
                  <Badge variant="default">{index + 1}</Badge>
                  <Text variant="mono" size="sm" weight="bold">{code}</Text>
                </Stack>

                {onStayDurationsChange && (
                  <Stack direction="row" align="center" gap={2} className="ml-4">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={stayDurations[code] ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        onStayDurationsChange({
                          ...stayDurations,
                          [code]: Math.max(0, val),
                        });
                      }}
                      className="w-12 h-7 rounded border border-border-default bg-bg-surface text-center text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <Text variant="subtext" size="xs">
                      {(stayDurations[code] ?? 0) === 0
                        ? "same day departure"
                        : (stayDurations[code] ?? 0) === 1
                        ? "night"
                        : "nights"}
                    </Text>
                  </Stack>
                )}
              </Stack>

              <Stack direction="row" gap={1}>
                <Clickable
                  onClick={() => move(index, -1)}
                  className="p-1 rounded hover:bg-bg-surface-raised text-text-secondary hover:text-text-primary"
                  aria-label="Move earlier"
                >
                  <ArrowUp className="size-3.5" />
                </Clickable>
                <Clickable
                  onClick={() => move(index, 1)}
                  className="p-1 rounded hover:bg-bg-surface-raised text-text-secondary hover:text-text-primary"
                  aria-label="Move later"
                >
                  <ArrowDown className="size-3.5" />
                </Clickable>
                <Clickable
                  onClick={() => removeAt(index)}
                  className="p-1 rounded hover:bg-signal-negative/10 text-text-secondary hover:text-signal-negative"
                  aria-label="Remove"
                >
                  <X className="size-3.5" />
                </Clickable>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
