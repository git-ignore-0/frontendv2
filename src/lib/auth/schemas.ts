import { z } from "zod";

export const coreUserSchema = z.object({
  sub: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  email_verified: z.literal(true),
  locale: z.enum(["vi", "en"]),
  status: z.literal("active"),
  roles: z.array(z.string()),
});

export type CoreUser = z.infer<typeof coreUserSchema>;

export const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().optional(),
  expires_in: z.number().int().positive(),
  token_type: z.string(),
  scope: z.string().optional(),
});

export const meResponseSchema = z.object({ data: coreUserSchema });
