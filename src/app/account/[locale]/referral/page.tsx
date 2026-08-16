import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { ReferralProgramPage } from "@/features/account/referral-program-page";
import { publicSiteOrigin } from "@/lib/auth/config";
import { isLocale } from "@/lib/i18n";
import { isReferralCode, normalizeReferralCode } from "@/lib/referral-code";

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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    ref?: string | string[];
    returnTo?: string | string[];
  }>;
}) {
  const { locale } = await params;
  const { ref, returnTo } = await searchParams;
  if (!isLocale(locale)) notFound();
  const normalizedRef =
    typeof ref === "string" ? normalizeReferralCode(ref) : null;
  const pendingReferralCode =
    normalizedRef && isReferralCode(normalizedRef) ? normalizedRef : undefined;
  const copy = getSiteContent(locale).account;
  return (
    <ReferralProgramPage
      locale={locale}
      copy={copy}
      pendingReferralCode={pendingReferralCode}
      publicSiteOrigin={publicSiteOrigin()}
      returnTo={returnTo}
    />
  );
}
