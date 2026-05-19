import { z } from "zod";

import { SectorSchema, StatusSchema } from "./enums";

export const ActionBaseSchema = z.object({
  title: z.string().min(3).max(120),
  sector: SectorSchema,
  annual_reduction: z.number().nonnegative(),
  status: StatusSchema,
  start_year: z.number().int().min(1900).max(2100),
});

export const ActionSchema = ActionBaseSchema.extend({
  id: z.string().uuid(),
  city_id: z.string().uuid(),
});

export const ActionDraftSchema = ActionBaseSchema;

export type ActionBase = z.infer<typeof ActionBaseSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ActionDraft = z.infer<typeof ActionDraftSchema>;
