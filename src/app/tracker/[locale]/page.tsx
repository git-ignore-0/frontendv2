import { getSiteContent } from "@/content/site-content";
import { TrackerPage } from "@/features/tracker/tracker-page";
import { TrackerRetryBoundary } from "@/features/tracker/tracker-retry-boundary";
import { getTrackerFarmsResult } from "@/lib/content-api";
import { requireLocale } from "@/lib/require-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: segment } = await params;
  const locale = requireLocale(segment);
  const copy = getSiteContent(locale).tracker;
  return { title: copy.title, description: copy.intro };
}

export default async function TrackerRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: segment } = await params;
  const locale = requireLocale(segment);
  const copy = getSiteContent(locale).tracker;
  const result = await getTrackerFarmsResult(locale);
  return result.ok ? (
    <TrackerPage copy={copy} farms={result.farms} />
  ) : (
    <TrackerRetryBoundary copy={copy} locale={locale} />
  );
}
