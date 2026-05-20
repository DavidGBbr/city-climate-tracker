/**
 * SWR cache keys + cross-feature revalidation helpers.
 *
 * Hooks per feature live in features/<feature>/hooks.ts and consume KEYS.
 */

import { mutate } from "swr";

export const KEYS = {
  cities: "/cities" as const,
  adminCities: "/cities?include_deleted=true" as const,
  city: (id: string) => `/cities/${id}` as const,
  actions: (cityId: string) => `/cities/${cityId}/actions` as const,
  summary: (cityId: string, asOf?: number) =>
    asOf == null
      ? (`/cities/${cityId}/summary` as const)
      : (`/cities/${cityId}/summary?as_of=${asOf}` as const),
};

/** Revalidate every SWR key touched by a city/action mutation. */
export async function revalidateCity(cityId: string) {
  await Promise.all([
    mutate(KEYS.cities),
    mutate(KEYS.adminCities),
    mutate(KEYS.city(cityId)),
    mutate(KEYS.actions(cityId)),
    mutate(KEYS.summary(cityId)),
  ]);
}
