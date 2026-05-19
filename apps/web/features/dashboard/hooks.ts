import useSWR from "swr";

import { fetcher } from "@/lib/api";
import { KEYS } from "@/lib/cache";
import type { Summary } from "@/lib/schemas";

export function useSummary(cityId: string | null | undefined) {
  return useSWR<Summary>(cityId ? KEYS.summary(cityId) : null, fetcher);
}
