export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeConfig: Record<
  Locale,
  { label: string; shortLabel: string }
> = {
  en: { label: "English", shortLabel: "EN" },
  vi: { label: "Tiếng Việt", shortLabel: "VI" },
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedPath(locale: Locale, path = "") {
  return `/${locale}${path === "/" ? "" : path}`;
}

export function replacePathLocale(pathname: string, locale: Locale) {
  const localePattern = new RegExp(`^/(${locales.join("|")})(?=/|$)`);
  return localePattern.test(pathname)
    ? pathname.replace(localePattern, `/${locale}`)
    : localizedPath(locale, pathname);
}

export function languageAlternates(path = "") {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, localizedPath(locale, path)]),
    ),
    "x-default": localizedPath(defaultLocale, path),
  };
}
