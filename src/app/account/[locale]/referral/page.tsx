import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { ReferralProgramPage } from "@/features/account/referral-program-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: getSiteContent(locale).account.referralProgramMetadataTitle,
  };
}

export default async function AccountReferralRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getSiteContent(locale).account;
  return <ReferralProgramPage locale={locale} copy={copy} />;
}
