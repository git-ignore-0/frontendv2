import { getSiteContent } from "./site-content";
import type { Locale } from "@/lib/i18n";

export function getDictionary(locale: Locale) {
  return getSiteContent(locale).common;
}
