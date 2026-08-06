import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { locales, localizedPath } from "@/lib/i18n";
import { getWorkshops } from "@/lib/content-api";
const base = siteConfig.url;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/about",
    "/plants",
    "/animals",
    "/workshops",
    "/testimonials",
  ].flatMap((path) =>
    locales.map((locale) => ({
      url: `${base}${localizedPath(locale, path)}`,
      changeFrequency: path ? ("monthly" as const) : ("weekly" as const),
      priority: path ? 0.8 : 1,
      alternates: {
        languages: Object.fromEntries(
          locales.map((language) => [
            language,
            `${base}${localizedPath(language, path)}`,
          ]),
        ),
      },
    })),
  );
  const csaPages = locales.map((locale) => ({
    url: `${base}/${locale}/csa`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
    alternates: {
      languages: Object.fromEntries(
        locales.map((language) => [language, `${base}/${language}/csa`]),
      ),
    },
  }));
  const localizedWorkshops = await Promise.all(
    locales.map(async (locale) => [
      ...(await getWorkshops(locale, "upcoming")),
      ...(await getWorkshops(locale, "past")),
    ]),
  );
  const workshopPages = localizedWorkshops.flatMap((items, localeIndex) =>
    items
      .filter((item) => !item.is_fallback)
      .map((item) => ({
        url: `${base}${localizedPath(locales[localeIndex], `/workshops/${item.slug}`)}`,
        lastModified: item.start_at,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  );
  return [...staticPages, ...csaPages, ...workshopPages];
}
