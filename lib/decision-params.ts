import type { Perturbation } from "@/core/types";

export interface DecisionParams {
  userId: string;
  requestText: string;
  origin?: string;
  destination?: string;
  cities?: string[];
  stayDurations?: Record<string, number>;
  perturbations: Perturbation[];
  leg: number;
}

export interface BuildDecisionQueryInput {
  userId: string;
  requestText: string;
  origin?: string;
  destination?: string;
  cities?: string[];
  stayDurations?: Record<string, number>;
  perturbations?: Perturbation[];
  leg?: number;
}

// The URL is the cache key for the Decision Screen — this is the one place
// that contract is assembled, so every writer (composer forms, chip taps,
// leg taps) stays in sync with every reader (the decision page itself).
export function buildDecisionQuery(input: BuildDecisionQueryInput): string {
  const sp = new URLSearchParams();
  sp.set("userId", input.userId);
  sp.set("requestText", input.requestText);

  if (input.origin) {
    sp.set("origin", input.origin);
  }

  if (input.cities && input.cities.length > 0) {
    sp.set("cities", input.cities.join(","));
  } else if (input.destination) {
    sp.set("destination", input.destination);
  }

  if (input.stayDurations && Object.keys(input.stayDurations).length > 0) {
    sp.set("stayDurations", JSON.stringify(input.stayDurations));
  }

  if (input.perturbations && input.perturbations.length > 0) {
    sp.set("pts", JSON.stringify(input.perturbations));
  }

  if (input.leg) {
    sp.set("leg", String(input.leg));
  }

  return sp.toString();
}

export function parseDecisionParams(
  searchParams: URLSearchParams
): DecisionParams | null {
  const userId = searchParams.get("userId");
  const requestText = searchParams.get("requestText");
  if (!userId || !requestText) return null;

  const origin = searchParams.get("origin") ?? undefined;
  const destination = searchParams.get("destination") ?? undefined;
  const citiesRaw = searchParams.get("cities");
  const cities = citiesRaw ? citiesRaw.split(",").filter(Boolean) : undefined;

  let stayDurations: Record<string, number> | undefined = undefined;
  const stayRaw = searchParams.get("stayDurations");
  if (stayRaw) {
    try {
      stayDurations = JSON.parse(stayRaw);
    } catch {
      stayDurations = undefined;
    }
  }

  let perturbations: Perturbation[] = [];
  const ptsRaw = searchParams.get("pts");
  if (ptsRaw) {
    try {
      const parsed = JSON.parse(ptsRaw);
      if (Array.isArray(parsed)) perturbations = parsed;
    } catch {
      perturbations = [];
    }
  }

  const leg = Number(searchParams.get("leg") ?? "0") || 0;

  return { userId, requestText, origin, destination, cities, stayDurations, perturbations, leg };
}

export function perturbationsEqual(a: Perturbation, b: Perturbation): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "price_drop" && b.kind === "price_drop") {
    return a.flightId === b.flightId;
  }
  return true;
}
