import { z } from "zod";

const publicTrackerImageSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string(),
});

export const publicTrackerFarmSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  location: z.string(),
  description: z.preprocess((value) => value ?? "", z.string()),
  image: publicTrackerImageSchema.nullable(),
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
