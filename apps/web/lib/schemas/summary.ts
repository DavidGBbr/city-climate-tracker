import { z } from "zod";

export const SummarySchema = z.object({
  city_id: z.string().uuid(),
  city_name: z.string(),
  baseline_emissions: z.number(),
  target_year: z.number().int(),
  current_year: z.number().int(),
  total_reduction: z.number(),
  remaining_to_target: z.number(),
  progress_pct: z.number(),
  expected_progress_pct: z.number(),
  on_track: z.boolean(),
  by_sector: z.record(z.string(), z.number()),
  action_count: z.number().int(),
});

export type Summary = z.infer<typeof SummarySchema>;
