"use client";

import { useParams } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { TrackerPage } from "@/features/tracker/tracker-page";
import { defaultLocale, isLocale } from "@/lib/i18n";

export default function TrackerLoading() {
  const params = useParams<{ locale?: string }>();
  const locale =
    params.locale && isLocale(params.locale) ? params.locale : defaultLocale;
  return (
    <TrackerPage
      copy={getSiteContent(locale).tracker}
      farms={[]}
      state="loading"
    />
  );
}
