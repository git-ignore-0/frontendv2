import { z } from "zod";

const publicTrackerImageVariantSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const publicTrackerImageFields = {
  id: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string(),
};

export const publicTrackerImageSchema = z.object({
  ...publicTrackerImageFields,
  variants: publicTrackerImageVariantSchema.array(),
});

const legacyPublicTrackerImageSchema = z.object({
  ...publicTrackerImageFields,
  variants: publicTrackerImageVariantSchema.array().default([]),
});

export const publicTrackerFarmSchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    location: z.string(),
    description: z.preprocess((value) => value ?? "", z.string()),
    image: legacyPublicTrackerImageSchema.nullable(),
    images: publicTrackerImageSchema.array().optional(),
    signup_count: z.number().int().nonnegative(),
    one_month_signup_count: z
      .number()
      .int()
      .nonnegative()
      .nullish()
      .transform((value) => value ?? 0),
    sort_order: z.number().int(),
  })
  .transform((farm) => ({
    ...farm,
    images: farm.images ?? (farm.image ? [farm.image] : []),
  }));

export const trackerRetryResponseSchema = z.object({
  data: publicTrackerFarmSchema.array(),
});

export type PublicTrackerFarm = z.infer<typeof publicTrackerFarmSchema>;
export type PublicTrackerImage = z.infer<typeof publicTrackerImageSchema>;

export function parseTrackerRetryResponse(payload: unknown) {
  return trackerRetryResponseSchema.parse(payload);
}
