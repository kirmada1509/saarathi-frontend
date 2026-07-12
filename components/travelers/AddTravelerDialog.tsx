"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, type CreateUserPayload } from "@/lib/api";
import { UserSummary } from "@/lib/types";

interface AddTravelerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newUser: UserSummary) => void;
}

export function AddTravelerDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddTravelerDialogProps) {
  const [homeAirport, setHomeAirport] = React.useState("JFK");
  const [priceSensitivity, setPriceSensitivity] = React.useState<"low" | "medium" | "high" | "none">("medium");
  const [directPreference, setDirectPreference] = React.useState<"strong" | "moderate" | "none">("moderate");
  const [preferredCabin, setPreferredCabin] = React.useState("Economy");
  const [preferredAirlines, setPreferredAirlines] = React.useState("");
  const [rawHistory, setRawHistory] = React.useState("hate connections | cheapest option always");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateUserPayload = {
        home_airport: homeAirport.toUpperCase().trim(),
        price_sensitivity: priceSensitivity,
        direct_preference: directPreference,
        preferred_cabin: preferredCabin.trim(),
        preferred_airlines: preferredAirlines.trim(),
        raw_history: rawHistory.trim(),
      };

      if (!payload.home_airport) {
        throw new Error("Home airport code is required.");
      }
      if (!payload.raw_history) {
        throw new Error("Travel history text is required.");
      }

      const newUser = await createUser(payload);
      onSuccess(newUser);
      onOpenChange(false);
      // Reset form
      setHomeAirport("JFK");
      setPriceSensitivity("medium");
      setDirectPreference("moderate");
      setPreferredCabin("Economy");
      setPreferredAirlines("");
      setRawHistory("hate connections | cheapest option always");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-bg-surface border border-border-default max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-text-primary">
            Add Test Traveler
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-xs">
            Create a custom traveler at runtime. They will immediately become queryable for recommendations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 bg-signal-negative/10 border border-signal-negative/20 text-signal-negative text-xs rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">
              Home Airport (3-Letter Code) *
            </label>
            <Input
              value={homeAirport}
              onChange={(e) => setHomeAirport(e.target.value)}
              placeholder="e.g. JFK, LAX, LHR"
              maxLength={3}
              className="uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 flex flex-col">
              <label className="text-xs font-semibold text-text-primary mb-1">
                Price Sensitivity
              </label>
              <Select
                value={priceSensitivity}
                onValueChange={(v) => setPriceSensitivity(v as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 flex flex-col">
              <label className="text-xs font-semibold text-text-primary mb-1">
                Direct Flight Pref
              </label>
              <Select
                value={directPreference}
                onValueChange={(v) => setDirectPreference(v as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">
              Preferred Cabin Class
            </label>
            <Input
              value={preferredCabin}
              onChange={(e) => setPreferredCabin(e.target.value)}
              placeholder="e.g. Economy, Business, First"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">
              Preferred Airlines (Semicolon-Delimited)
            </label>
            <Input
              value={preferredAirlines}
              onChange={(e) => setPreferredAirlines(e.target.value)}
              placeholder="e.g. UA;DL;LH"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">
              Travel History / Rationale (Pipe-Delimited) *
            </label>
            <Textarea
              value={rawHistory}
              onChange={(e) => setRawHistory(e.target.value)}
              placeholder="e.g. hate connections | cheapest option always"
              rows={3}
              required
            />
            <span className="text-[10px] text-text-secondary leading-normal block">
              Exercises the preference inference engine (regex + embeddings).
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-text-on-accent hover:bg-accent-hover"
            >
              {isSubmitting ? "Creating..." : "Create Traveler"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
