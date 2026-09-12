import { notFound } from "next/navigation";

import { getCSAPurchaseCopy } from "@/features/membership/csa-purchase-copy";
import { CSAPurchasePage } from "@/features/membership/csa-purchase-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getCSAPurchaseCopy(locale);
  return { title: copy.title, description: copy.intro };
}

export default async function CSAPurchaseRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CSAPurchasePage locale={locale} />;
}
