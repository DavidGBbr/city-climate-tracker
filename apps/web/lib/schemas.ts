/**
 * Zod schemas mirror the Pydantic models in apps/api/app/models.py.
 * Keep in sync — both layers validate the same shapes.
 */

import { z } from "zod";

export const SECTORS = [
  "transport",
  "energy",
  "buildings",
  "waste",
  "land use",
] as const;

export const STATUSES = ["planned", "in progress", "completed"] as const;

export const SectorSchema = z.enum(SECTORS);
export const StatusSchema = z.enum(STATUSES);

export const CitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  baseline_emissions: z.number().nonnegative(),
  target_year: z.number().int().min(1900).max(2100),
});

export const CityUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  baseline_emissions: z.number().nonnegative().optional(),
  target_year: z.number().int().min(1900).max(2100).optional(),
});

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

export type Sector = z.infer<typeof SectorSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type City = z.infer<typeof CitySchema>;
export type CityUpdate = z.infer<typeof CityUpdateSchema>;
export type ActionBase = z.infer<typeof ActionBaseSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ActionDraft = z.infer<typeof ActionDraftSchema>;
export type Summary = z.infer<typeof SummarySchema>;

export const SECTOR_LABELS: Record<Sector, string> = {
  transport: "Transport",
  energy: "Energy",
  buildings: "Buildings",
  waste: "Waste",
  "land use": "Land use",
};

export const STATUS_LABELS: Record<Status, string> = {
  planned: "Planned",
  "in progress": "In progress",
  completed: "Completed",
};
