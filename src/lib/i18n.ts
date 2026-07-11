export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const storeUrl = "https://store.farmbrite.com/store/nntn";
export const siteUrl = "https://naturalfarmingvietnam.com";

export function localizedPath(locale: Locale, path = "") {
  return `/${locale}${path === "/" ? "" : path}`;
}
