import { z } from "zod";

export const publicTrackerFarmSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  signup_count: z.number().int().nonnegative(),
  sort_order: z.number().int(),
});

export const trackerRetryResponseSchema = z.object({
  data: publicTrackerFarmSchema.array(),
});

export type PublicTrackerFarm = z.infer<typeof publicTrackerFarmSchema>;

export function parseTrackerRetryResponse(payload: unknown) {
  return trackerRetryResponseSchema.parse(payload);
}
