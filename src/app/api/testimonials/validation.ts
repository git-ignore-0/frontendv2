import { isLocale, type Locale } from "@/lib/i18n";

export type TestimonialFilter = "all" | "customer" | "farmer";

export function parseTestimonialLocale(
  searchParams: URLSearchParams,
): Locale | null {
  const locale = searchParams.get("locale") ?? "vi";
  return isLocale(locale) ? locale : null;
}

export function parseTestimonialFilter(
  searchParams: URLSearchParams,
): TestimonialFilter | null {
  const type = searchParams.get("type") ?? "all";
  return ["all", "customer", "farmer"].includes(type)
    ? (type as TestimonialFilter)
    : null;
}

export function parseBoundedInteger(
  searchParams: URLSearchParams,
  name: string,
  fallback: number,
  maximum: number,
) {
  const raw = searchParams.get(name);
  if (raw === null) return fallback;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value <= maximum ? value : null;
}
