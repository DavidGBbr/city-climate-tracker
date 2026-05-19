import useSWR from "swr";

import { fetcher } from "@/lib/api";
import { KEYS } from "@/lib/cache";
import type { City } from "@/lib/schemas";

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
