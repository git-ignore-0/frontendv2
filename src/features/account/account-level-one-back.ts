import type { Locale } from "@/lib/i18n";

type AccountLevelOneBackHrefInput = {
  locale: Locale;
  returnTo?: unknown;
  currentPath: string;
};

const INTERNAL_ORIGIN = "https://naturalfarmingvietnam.local";

function normalizedPathname(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function isDisallowedPath(pathname: string) {
  if (pathname === "/api" || pathname.startsWith("/api/")) return true;
  return /^\/(?:[^/]+\/)?(?:auth\/callback|login|logout)(?:\/|$)/.test(
    pathname,
  );
}

export function resolveAccountLevelOneBackHref({
  locale,
  returnTo,
  currentPath,
}: AccountLevelOneBackHrefInput) {
  const fallback = `/${locale}`;
  if (
    typeof returnTo !== "string" ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//")
  ) {
    return fallback;
  }

  try {
    decodeURI(returnTo);
    const target = new URL(returnTo, INTERNAL_ORIGIN);
    const current = new URL(currentPath, INTERNAL_ORIGIN);
    if (
      target.origin !== INTERNAL_ORIGIN ||
      isDisallowedPath(target.pathname) ||
      normalizedPathname(target.pathname) ===
        normalizedPathname(current.pathname)
    ) {
      return fallback;
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}

export function buildAccountLevelOnePath({
  locale,
  returnTo,
  currentPath,
}: AccountLevelOneBackHrefInput) {
  const resolvedReturnTo = resolveAccountLevelOneBackHref({
    locale,
    returnTo,
    currentPath,
  });
  return `${currentPath}?returnTo=${encodeURIComponent(resolvedReturnTo)}`;
}
