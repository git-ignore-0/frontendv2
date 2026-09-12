export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeConfig: Record<
  Locale,
  { label: string; shortLabel: string; icon: string; flag: string }
> = {
  en: { label: "English", shortLabel: "EN", icon: "🌐", flag: "🇬🇧" },
  vi: { label: "Tiếng Việt", shortLabel: "VI", icon: "🇻🇳", flag: "🇻🇳" },
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedPath(locale: Locale, path = "") {
  if (!path || path === "/") return `/${locale}`;
  return `${path}/${locale}`;
}

function splitPathSuffix(value: string) {
  const suffixStart = value.search(/[?#]/);
  const pathname = suffixStart === -1 ? value : value.slice(0, suffixStart);
  return {
    pathname: pathname.replace(/\/+$/, "") || "/",
    suffix: suffixStart === -1 ? "" : value.slice(suffixStart),
  };
}

export function isCSASectionPath(pathname: string) {
  const normalizedPath = splitPathSuffix(pathname).pathname;
  const localePattern = locales.join("|");
  return new RegExp(
    `^/csa/(?:(?:purchase|track|verify)/)?(?:${localePattern})$`,
  ).test(normalizedPath);
}

export function replacePathLocale(pathname: string, locale: Locale) {
  const { pathname: normalizedPath, suffix } = splitPathSuffix(pathname);
  const localePattern = locales.join("|");
  const csaPattern = new RegExp(`^/csa/(?:${localePattern})$`);
  const legacyCsaPattern = new RegExp(`^/(?:${localePattern})/csa$`);
  const accountPattern = new RegExp(`^/account/(?:${localePattern})(?=/|$)`);
  const prefixPattern = new RegExp(`^/(${localePattern})(?=/|$)`);
  const suffixPattern = new RegExp(`/(?:${localePattern})$`);

  if (
    csaPattern.test(normalizedPath) ||
    legacyCsaPattern.test(normalizedPath)
  ) {
    return `${localizedPath(locale, "/csa")}${suffix}`;
  }

  if (accountPattern.test(normalizedPath)) {
    return `${normalizedPath.replace(accountPattern, `/account/${locale}`)}${suffix}`;
  }

  if (prefixPattern.test(normalizedPath)) {
    const path = normalizedPath.replace(prefixPattern, "") || "/";
    return `${localizedPath(locale, path)}${suffix}`;
  }

  if (suffixPattern.test(normalizedPath)) {
    const path = normalizedPath.replace(suffixPattern, "") || "/";
    return `${localizedPath(locale, path)}${suffix}`;
  }

  return `${localizedPath(locale, normalizedPath)}${suffix}`;
}

export function languageAlternates(path = "") {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, localizedPath(locale, path)]),
    ),
    "x-default": localizedPath(defaultLocale, path),
  };
}
