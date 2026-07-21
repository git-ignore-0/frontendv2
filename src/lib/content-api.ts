import "server-only";

import type { Locale } from "@/lib/i18n";

export type PublicSiteSettings = {
  email: string;
  is_email_enabled: boolean;
  phone_display: string;
  is_phone_enabled: boolean;
  links: Array<{
    id: number;
    kind: string;
    label: string;
    url: string;
    position: number;
  }>;
};

export type PublicWorkshop = {
  id: string;
  slug: string;
  requested_locale: Locale;
  content_locale: Locale;
  available_locales: Locale[];
  is_fallback: boolean;
  default_locale: Locale;
  start_at: string;
  end_at: string;
  event_timezone: string;
  status: "upcoming" | "ongoing" | "completed";
  registration_url: string | null;
  title: string;
  summary: string;
  body?: Record<string, unknown>;
};

class ContentApiConfigurationError extends Error {}

export const contentApiOrigin = () => {
  const configured = process.env.CONTENT_API_ORIGIN?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new ContentApiConfigurationError(
        "CONTENT_API_ORIGIN is required in production",
      );
    }
    return "http://127.0.0.1:8000";
  }
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new ContentApiConfigurationError(
      "CONTENT_API_ORIGIN must be a valid URL",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new ContentApiConfigurationError(
      "CONTENT_API_ORIGIN must be an HTTP(S) origin without credentials or path",
    );
  }
  return url.origin;
};

function rethrowConfigurationError(error: unknown) {
  if (error instanceof ContentApiConfigurationError) throw error;
}

function contentFetchOptions(tags: string[], revalidate: number) {
  if (process.env.NODE_ENV === "development") {
    return { cache: "no-store" as const };
  }
  return { next: { tags, revalidate } };
}

async function contentFetch<T>(
  path: string,
  tags: string[],
  revalidate = 300,
): Promise<T> {
  const response = await fetch(`${contentApiOrigin()}${path}`, {
    ...contentFetchOptions(tags, revalidate),
  });
  if (!response.ok) throw new Error(`Content API ${response.status}: ${path}`);
  const payload = (await response.json()) as { data: T };
  return payload.data;
}

async function workshopPage(
  locale: Locale,
  period: "upcoming" | "past",
  page: number,
) {
  const response = await fetch(
    `${contentApiOrigin()}/api/v1/public/workshops?locale=${locale}&period=${period}&page_size=50&page=${page}`,
    contentFetchOptions(["workshops"], 300),
  );
  if (!response.ok)
    throw new Error(`Content API ${response.status}: workshops page ${page}`);
  return (await response.json()) as {
    data: PublicWorkshop[];
    meta: { page: number; page_size: number; total: number };
  };
}

export async function getSiteSettings(
  locale: Locale,
): Promise<PublicSiteSettings> {
  try {
    return await contentFetch<PublicSiteSettings>(
      `/api/v1/public/site-settings?locale=${locale}`,
      ["site-settings"],
    );
  } catch (error) {
    rethrowConfigurationError(error);
    return {
      email: "",
      is_email_enabled: false,
      phone_display: "",
      is_phone_enabled: false,
      links: [],
    };
  }
}

export async function getWorkshops(
  locale: Locale,
  period: "upcoming" | "past",
) {
  try {
    const first = await workshopPage(locale, period, 1);
    const pageCount = Math.ceil(first.meta.total / first.meta.page_size);
    if (pageCount <= 1) return first.data;
    const remaining = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) =>
        workshopPage(locale, period, index + 2),
      ),
    );
    return [first, ...remaining].flatMap((page) => page.data);
  } catch (error) {
    rethrowConfigurationError(error);
    return [];
  }
}

export async function getWorkshop(slug: string, locale: Locale) {
  try {
    return await contentFetch<PublicWorkshop>(
      `/api/v1/public/workshops/${encodeURIComponent(slug)}?locale=${locale}`,
      ["workshops", `workshop:${slug}`],
    );
  } catch (error) {
    rethrowConfigurationError(error);
    return null;
  }
}

export async function getWorkshopPreview(token: string, locale: Locale) {
  try {
    // Dynamic route params can contain the already encoded token. Normalize it
    // before encoding once for the backend request to avoid turning %3A into %253A.
    const decodedToken = decodeURIComponent(token);
    return await contentFetch<PublicWorkshop>(
      `/api/v1/public/workshops/preview/${encodeURIComponent(decodedToken)}?locale=${locale}`,
      [],
      0,
    );
  } catch (error) {
    rethrowConfigurationError(error);
    return null;
  }
}

export function linkFromSettings(settings: PublicSiteSettings, kind: string) {
  return settings.links.find((item) => item.kind === kind)?.url;
}
