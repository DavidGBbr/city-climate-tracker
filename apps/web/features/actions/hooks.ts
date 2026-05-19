import useSWR from "swr";

import { fetcher } from "@/lib/api";
import { KEYS } from "@/lib/cache";
import type { Action } from "@/lib/schemas";

export function useActions(cityId: string | null | undefined) {
  return useSWR<Action[]>(cityId ? KEYS.actions(cityId) : null, fetcher);
}
