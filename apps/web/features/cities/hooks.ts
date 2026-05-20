import useSWR from "swr";

import { api, fetcher } from "@/lib/api";
import { KEYS, revalidateCity } from "@/lib/cache";
import type { City, CityCreate } from "@/lib/schemas";

export function useCities() {
  return useSWR<City[]>(KEYS.cities, fetcher);
}

export function useAdminCities() {
  return useSWR<City[]>(KEYS.adminCities, fetcher);
}

export async function createCity(payload: CityCreate): Promise<City> {
  const city = await api.post<City>("/cities", payload);
  await revalidateCity(city.id);
  return city;
}

export async function archiveCity(id: string): Promise<City> {
  const city = await api.delete<City>(`/cities/${id}`);
  await revalidateCity(id);
  return city;
}

export async function restoreCity(id: string): Promise<City> {
  const city = await api.post<City>(`/cities/${id}/restore`, {});
  await revalidateCity(id);
  return city;
}
