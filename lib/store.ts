"use client";

import { create } from "zustand";
import type { Perturbation } from "@/core/types";

// Pure UI state only. Server-derived state (users, recommendations) lives in
// TanStack Query via lib/queries.ts, keyed off the URL — see lib/decision-params.ts.
interface SaarathiUIState {
  perturbations: Perturbation[];
  selectedLegIndex: number;
  commandPaletteOpen: boolean;
  compareSelection: [string | null, string | null];

  togglePerturbation: (p: Perturbation) => void;
  clearPerturbations: () => void;
  setPerturbations: (p: Perturbation[]) => void;
  selectLeg: (index: number) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setCompareSelection: (index: 0 | 1, userId: string | null) => void;
}

function isMatch(a: Perturbation, b: Perturbation) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "price_drop" && b.kind === "price_drop") {
    return a.flightId === b.flightId;
  }
  return true;
}

export const useUIStore = create<SaarathiUIState>((set, get) => ({
  perturbations: [],
  selectedLegIndex: 0,
  commandPaletteOpen: false,
  compareSelection: [null, null],

  togglePerturbation: (p) => {
    const { perturbations } = get();
    const exists = perturbations.some((item) => isMatch(item, p));
    set({
      perturbations: exists
        ? perturbations.filter((item) => !isMatch(item, p))
        : [...perturbations, p],
    });
  },

  clearPerturbations: () => set({ perturbations: [] }),
  setPerturbations: (p) => set({ perturbations: p }),
  selectLeg: (index) => set({ selectedLegIndex: index }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setCompareSelection: (index, userId) =>
    set((state) => {
      const next: [string | null, string | null] = [...state.compareSelection];
      next[index] = userId;
      return { compareSelection: next };
    }),
}));
