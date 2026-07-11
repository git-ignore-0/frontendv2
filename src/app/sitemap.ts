import type { MetadataRoute } from "next";
const base = "https://naturalfarmingvietnam.com";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/plants", "/animals"].flatMap((path) =>
    (["en", "vi"] as const).map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path ? ("monthly" as const) : ("weekly" as const),
      priority: path ? 0.8 : 1,
      alternates: {
        languages: { en: `${base}/en${path}`, vi: `${base}/vi${path}` },
      },
    })),
  );
}
