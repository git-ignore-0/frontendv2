import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LocaleShell } from "@/components/locale-shell";
import { workshopCopy } from "@/features/workshops/copy";
import { WorkshopDetail } from "@/features/workshops/workshop-detail-page";
import { getWorkshopPreview } from "@/lib/content-api";
import { isLocale } from "@/lib/i18n";

const previewDefaultLocale = "vi" as const;

export const dynamic = "force-dynamic";

function previewLocale(locale?: string) {
  return locale && isLocale(locale) ? locale : previewDefaultLocale;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const locale = previewLocale((await searchParams).locale);
  return {
    title: workshopCopy[locale].preview,
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const locale = previewLocale(query.locale);
  const workshop = await getWorkshopPreview(token, locale);
  if (!workshop) notFound();
  return (
    <LocaleShell locale={locale}>
      <WorkshopDetail workshop={workshop} locale={locale} preview />
    </LocaleShell>
  );
}
