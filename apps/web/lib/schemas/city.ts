import { z } from "zod";

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

export type City = z.infer<typeof CitySchema>;
export type CityUpdate = z.infer<typeof CityUpdateSchema>;
