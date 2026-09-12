import { notFound } from "next/navigation";

import { getCSAContractTrackerCopy } from "@/features/membership/csa-contract-tracker-copy";
import { CSAContractTrackerPage } from "@/features/membership/csa-contract-tracker-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getCSAContractTrackerCopy(locale);
  return { title: copy.title, description: copy.intro };
}

export default async function CSAContractTrackerRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CSAContractTrackerPage locale={locale} />;
}
