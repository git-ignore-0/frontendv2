import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { RewardsPage } from "@/features/account/rewards-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getSiteContent(locale).account.rewardsMetadataTitle };
}

export default async function AccountRewardsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getSiteContent(locale).account;
  return <RewardsPage locale={locale} copy={copy} />;
}
