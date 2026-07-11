export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeConfig: Record<
  Locale,
  { label: string; shortLabel: string; icon: string }
> = {
  en: { label: "English", shortLabel: "EN", icon: "🌐" },
  vi: { label: "Tiếng Việt", shortLabel: "VI", icon: "🇻🇳" },
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedPath(locale: Locale, path = "") {
  if (!path || path === "/") return `/${locale}`;
  return `${path}/${locale}`;
}

export function replacePathLocale(pathname: string, locale: Locale) {
  const localePattern = locales.join("|");
  const prefixPattern = new RegExp(`^/(${localePattern})(?=/|$)`);
  const suffixPattern = new RegExp(`/(?:${localePattern})$`);

  if (prefixPattern.test(pathname)) {
    const path = pathname.replace(prefixPattern, "") || "/";
    return localizedPath(locale, path);
  }

  if (suffixPattern.test(pathname)) {
    const path = pathname.replace(suffixPattern, "") || "/";
    return localizedPath(locale, path);
  }

  return localizedPath(locale, pathname);
}

export function languageAlternates(path = "") {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, localizedPath(locale, path)]),
    ),
    "x-default": localizedPath(defaultLocale, path),
  };
}
