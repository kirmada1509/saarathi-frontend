import { API_BASE_URL } from "./env";
import type { UserSummary } from "./types";
import type { Perturbation, RecommendResponse } from "@/core/types";

export interface RecommendPayload {
  userId: string;
  requestText: string;
  destination?: string;
  cities?: string[];
  stayDurations?: Record<string, number>;
  origin?: string;
  perturbations: Perturbation[];
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response body wasn't JSON — keep the generic status message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchUsers(): Promise<UserSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/users`);
  return parseJsonOrThrow<UserSummary[]>(res);
}

export async function fetchRecommendation(
  payload: RecommendPayload
): Promise<RecommendResponse> {
  const res = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<RecommendResponse>(res);
}
