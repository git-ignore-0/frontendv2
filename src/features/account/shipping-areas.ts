import { z } from "zod";

import { accountApi, AccountApiError } from "@/features/account/api";
import type { Locale } from "@/lib/i18n";

const shippingAreasSchema = z.array(
  z.object({
    province_code: z.string().trim().min(1),
    province_name: z.string().trim().min(1),
    wards: z
      .array(
        z.object({
          ward_code: z.string().trim().min(1),
          ward_name: z.string().trim().min(1),
          shipping_fee_vnd: z.string().regex(/^\d+$/),
        }),
      )
      .min(1),
  }),
);

export type SupportedShippingProvince = {
  code: string;
  name: string;
  wards: { code: string; name: string; shippingFeeVnd: string }[];
};

export async function getSupportedShippingAreas(
  locale: Locale,
  signal?: AbortSignal,
): Promise<SupportedShippingProvince[]> {
  const payload = await accountApi<unknown>(`shipping-areas?locale=${locale}`, {
    signal,
  });
  const parsed = shippingAreasSchema.safeParse(payload?.data);
  if (!parsed.success) throw new AccountApiError("invalid_response", 502);
  return parsed.data.map((province) => ({
    code: province.province_code,
    name: province.province_name,
    wards: province.wards.map((ward) => ({
      code: ward.ward_code,
      name: ward.ward_name,
      shippingFeeVnd: ward.shipping_fee_vnd,
    })),
  }));
}
