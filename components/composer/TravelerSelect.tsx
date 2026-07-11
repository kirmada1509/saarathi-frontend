"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserSummary } from "@/lib/types";

export function TravelerSelect({
  users,
  value,
  onValueChange,
  placeholder = "Choose a traveler",
}: {
  users: UserSummary[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value || null} onValueChange={(v) => v && onValueChange(String(v))}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {users.map((u) => (
          <SelectItem key={u.user_id} value={u.user_id}>
            {u.user_id} — {u.home_city} ({u.preferred_cabin})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
