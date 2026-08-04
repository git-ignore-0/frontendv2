import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { CsaPage } from "@/features/membership/csa-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getSiteContent(locale).csa.metadataTitle };
}

export default async function CsaRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CsaPage copy={getSiteContent(locale).csa} locale={locale} />;
}
