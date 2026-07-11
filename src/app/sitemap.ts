import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { locales } from "@/lib/i18n";
const base = siteConfig.url;
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/plants", "/animals"].flatMap((path) =>
    locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path ? ("monthly" as const) : ("weekly" as const),
      priority: path ? 0.8 : 1,
      alternates: {
        languages: Object.fromEntries(
          locales.map((language) => [language, `${base}/${language}${path}`]),
        ),
      },
    })),
  );
}
