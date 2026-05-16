/**
 * Domain-level SWR hooks. Keep components free of fetcher boilerplate.
 */

import useSWR, { mutate } from "swr";

import { fetcher } from "./api";
import type { Action, City, Summary } from "./schemas";

export const KEYS = {
  cities: "/cities" as const,
  city: (id: string) => `/cities/${id}` as const,
  actions: (cityId: string) => `/cities/${cityId}/actions` as const,
  summary: (cityId: string, asOf?: number) =>
    asOf == null
      ? (`/cities/${cityId}/summary` as const)
      : (`/cities/${cityId}/summary?as_of=${asOf}` as const),
};

export function useCities() {
  return useSWR<City[]>(KEYS.cities, fetcher);
}

/** The MVP is single-city — surface the first one from the listing. */
export function useDefaultCity() {
  const { data, error, isLoading, mutate: revalidate } = useCities();
  return {
    city: data?.[0] ?? null,
    isLoading,
    error,
    revalidate,
  };
}

export function useActions(cityId: string | null | undefined) {
  return useSWR<Action[]>(cityId ? KEYS.actions(cityId) : null, fetcher);
}

export function useSummary(cityId: string | null | undefined) {
  return useSWR<Summary>(cityId ? KEYS.summary(cityId) : null, fetcher);
}

/** Revalidate every SWR key touched by a city/action mutation. */
export async function revalidateCity(cityId: string) {
  await Promise.all([
    mutate(KEYS.cities),
    mutate(KEYS.city(cityId)),
    mutate(KEYS.actions(cityId)),
    mutate(KEYS.summary(cityId)),
  ]);
}
