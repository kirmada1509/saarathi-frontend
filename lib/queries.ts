"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchUsers, fetchRecommendation, type RecommendPayload } from "./api";
import type { UserSummary } from "./types";
import type { Perturbation, RecommendResponse } from "@/core/types";

export function useUsers(): UseQueryResult<UserSummary[]> {
  return useQuery<UserSummary[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60_000,
  });
}

export interface RecommendationParams {
  userId: string;
  requestText: string;
  origin?: string;
  destination?: string;
  cities?: string[];
  stayDurations?: Record<string, number>;
  perturbations?: Perturbation[];
}

function recommendationKey(params: RecommendationParams) {
  return [
    "recommendation",
    params.userId,
    params.requestText,
    params.origin ?? "",
    params.destination ?? "",
    (params.cities ?? []).join(","),
    JSON.stringify(params.stayDurations ?? {}),
    JSON.stringify(params.perturbations ?? []),
  ] as const;
}

// The URL (via these params) is the cache key — reloading a deep-linked
// /app/decision URL reproduces the same state from cache instead of a
// fresh network round-trip.
export function useRecommendation(
  params: RecommendationParams | null
): UseQueryResult<RecommendResponse> {
  return useQuery<RecommendResponse>({
    queryKey: params ? recommendationKey(params) : ["recommendation", "idle"],
    queryFn: () => {
      const p = params!;
      const payload: RecommendPayload = {
        userId: p.userId,
        requestText: p.requestText,
        perturbations: p.perturbations ?? [],
        stayDurations: p.stayDurations,
        origin: p.origin,
      };
      if (p.cities && p.cities.length > 0) {
        payload.cities = p.cities;
      } else if (p.destination) {
        payload.destination = p.destination;
      }
      return fetchRecommendation(payload);
    },
    enabled: !!params && !!params.userId && !!params.requestText,
  });
}

export interface LegRecommendationParams {
  userId: string;
  requestText: string;
  origin: string;
  destination: string;
  perturbations?: Perturbation[];
}

export function useLegRecommendation(
  params: LegRecommendationParams | null
): UseQueryResult<RecommendResponse> {
  return useQuery<RecommendResponse>({
    queryKey: params
      ? [
          "leg-recommendation",
          params.userId,
          params.requestText,
          params.origin,
          params.destination,
          JSON.stringify(params.perturbations ?? []),
        ]
      : ["leg-recommendation", "idle"],
    queryFn: () => {
      const p = params!;
      return fetchRecommendation({
        userId: p.userId,
        requestText: p.requestText,
        origin: p.origin,
        destination: p.destination,
        perturbations: p.perturbations ?? [],
      });
    },
    enabled: !!params,
  });
}
