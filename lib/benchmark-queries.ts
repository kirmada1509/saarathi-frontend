export interface BenchmarkQuery {
  requestText: string;
  destination: string;
  cities: string[];
}

// Seed requests per traveler — used to give the traveler-profile / compare
// screens a real InferredPreference to render without requiring a live
// user-typed request (that call is disclosed in-UI as a representative sample).
export const BENCHMARK_QUERIES: Record<string, BenchmarkQuery> = {
  U01: {
    requestText:
      "Help me book my upcoming holiday flight to Tokyo. I hate connecting flights and would prefer to fly business if possible.",
    destination: "NRT",
    cities: [],
  },
  U02: {
    requestText: "I want to visit London, Paris, and Rome this winter. Optimize my itinerary.",
    destination: "",
    cities: ["LHR", "CDG", "FCO"],
  },
  U03: {
    requestText: "I want to spend a week in Bali next summer. Dates are flexible.",
    destination: "DPS",
    cities: [],
  },
  U04: {
    requestText: "I need to get to New York for a Tuesday meeting and return by Thursday.",
    destination: "JFK",
    cities: [],
  },
  U05: {
    requestText: "I want to visit Sydney around the holidays. Show me options.",
    destination: "SYD",
    cities: [],
  },
  U06: {
    requestText: "I am planning an Asia tour: HND to SIN, then KUL, then back to HND.",
    destination: "",
    cities: ["SIN", "KUL"],
  },
};

export const DEFAULT_QUERY: BenchmarkQuery = {
  requestText: "Find me flights.",
  destination: "",
  cities: [],
};

export function getBenchmarkQuery(userId: string): BenchmarkQuery {
  return BENCHMARK_QUERIES[userId] ?? DEFAULT_QUERY;
}
