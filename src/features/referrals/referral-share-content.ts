import { siteConfig } from "@/config/site";
import { getSiteContent } from "@/content/site-content";
import type { Locale } from "@/lib/i18n";

export function referralOpenGraphImageCopy(locale: Locale) {
  const copy = getSiteContent(locale).referralShareLanding;
  return {
    eyebrow: copy.eyebrow,
    title: copy.title,
    visualNote: copy.visualNote,
    brandName: siteConfig.name,
  };
}
