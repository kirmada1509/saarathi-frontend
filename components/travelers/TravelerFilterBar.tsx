"use client";

import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/primitives";
import { Search } from "lucide-react";

export function TravelerFilterBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Stack direction="row" align="center" gap={2} className="relative max-w-sm">
      <Search className="absolute left-2.5 size-4 text-text-secondary pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter by city, cabin, or airline..."
        className="pl-8"
      />
    </Stack>
  );
}
