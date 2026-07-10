import { create } from "zustand";
import { RecommendResponse, Perturbation } from "@/core/types";

export interface UserSummary {
  user_id: string;
  home_airport: string;
  home_city: string;
  raw_history: string;
  age: string;
  price_sensitivity: string;
  direct_preference: string;
  preferred_cabin: string;
  preferred_airlines: string;
}

const API_BASE = "http://localhost:4000";

interface SaarathiState {
  users: UserSummary[];
  selectedUserId: string;
  requestText: string;
  destination: string;
  cities: string[];
  perturbations: Perturbation[];
  response: RecommendResponse | null;
  loading: boolean;
  error: string | null;

  // Leg Scoping Properties
  selectedLegIndex: number;
  legResponse: RecommendResponse | null;
  legLoading: boolean;

  // Actions
  fetchUsers: () => Promise<void>;
  selectUser: (userId: string) => void;
  setRequestText: (text: string) => void;
  setDestination: (dest: string) => void;
  setCities: (cities: string[]) => void;
  togglePerturbation: (p: Perturbation) => void;
  clearPerturbations: () => void;
  getRecommendation: () => Promise<void>;
  selectLeg: (index: number) => void;
  getLegRecommendation: () => Promise<void>;
}

// Map users to their benchmark queries
const BENCHMARK_QUERIES: Record<
  string,
  { requestText: string; destination: string; cities: string[] }
> = {
  U01: {
    requestText: "Help me book my upcoming holiday flight to Tokyo. I hate connecting flights and would prefer to fly business if possible.",
    destination: "HND",
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

export const useStore = create<SaarathiState>((set, get) => ({
  users: [],
  selectedUserId: "",
  requestText: "",
  destination: "",
  cities: [],
  perturbations: [],
  response: null,
  loading: false,
  error: null,

  selectedLegIndex: 0,
  legResponse: null,
  legLoading: false,

  fetchUsers: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (!res.ok) throw new Error("Failed to load users");
      const users = await res.json();
      set({ users });
      if (users.length > 0) {
        get().selectUser(users[0].user_id);
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  selectUser: (userId: string) => {
    const query = BENCHMARK_QUERIES[userId] || {
      requestText: "Find me flights.",
      destination: "",
      cities: [],
    };

    set({
      selectedUserId: userId,
      requestText: query.requestText,
      destination: query.destination,
      cities: query.cities,
      perturbations: [], // Clear on switch
      selectedLegIndex: 0,
      legResponse: null,
      error: null,
    });

    get().getRecommendation();
  },

  setRequestText: (text: string) => set({ requestText: text }),
  setDestination: (dest: string) => set({ destination: dest.toUpperCase() }),
  setCities: (cities: string[]) => set({ cities }),

  togglePerturbation: (p: Perturbation) => {
    const { perturbations } = get();
    let updated: Perturbation[] = [];

    const isMatch = (a: Perturbation, b: Perturbation) => {
      if (a.kind !== b.kind) return false;
      if (a.kind === "price_drop" && b.kind === "price_drop") {
        return a.flightId === b.flightId;
      }
      return true;
    };

    const exists = perturbations.some((item) => isMatch(item, p));
    if (exists) {
      updated = perturbations.filter((item) => !isMatch(item, p));
    } else {
      updated = [...perturbations, p];
    }

    set({ perturbations: updated });
    get().getRecommendation();
  },

  clearPerturbations: () => {
    set({ perturbations: [] });
    get().getRecommendation();
  },

  selectLeg: (index: number) => {
    set({ selectedLegIndex: index });
    get().getLegRecommendation();
  },

  getLegRecommendation: async () => {
    const { response, selectedLegIndex, selectedUserId, requestText, perturbations } = get();
    if (!response || response.mode !== "multi-city" || !response.itinerary) {
      set({ legResponse: null });
      return;
    }

    const leg = response.itinerary.legs[selectedLegIndex];
    if (!leg) return;

    set({ legLoading: true });
    try {
      const payload = {
        userId: selectedUserId,
        requestText,
        origin: leg.from,
        destination: leg.to,
        perturbations,
      };

      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Leg recommendation failed");
      }

      const legResponse = await res.json();
      set({ legResponse, legLoading: false });
    } catch (err) {
      console.error("fetch leg recommendation failed:", err);
      set({ legResponse: null, legLoading: false });
    }
  },

  getRecommendation: async () => {
    const { selectedUserId, requestText, destination, cities, perturbations } = get();
    if (!selectedUserId) return;

    set({ loading: true, error: null });

    try {
      const payload: Record<string, unknown> = {
        userId: selectedUserId,
        requestText,
        perturbations,
      };

      if (cities && cities.length > 0) {
        payload.cities = cities;
      } else if (destination) {
        payload.destination = destination;
      }

      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Recommendation request failed");
      }

      const response = await res.json();
      
      if (response.mode === "multi-city") {
        let idx = get().selectedLegIndex;
        if (idx >= response.itinerary.legs.length) {
          idx = 0;
        }
        set({ response, loading: false, selectedLegIndex: idx });
        get().getLegRecommendation();
      } else {
        set({ response, loading: false, selectedLegIndex: 0, legResponse: null });
      }
    } catch (err: unknown) {
      console.error("fetch recommendation failed:", err);
      set({
        error: err instanceof Error ? err.message : String(err),
        loading: false,
        response: null,
        legResponse: null,
      });
    }
  },
}));
