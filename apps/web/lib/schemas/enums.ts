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

export type Sector = z.infer<typeof SectorSchema>;
export type Status = z.infer<typeof StatusSchema>;

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
