import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { AccountRouteGate } from "@/features/account/account-route-gate";
import { MembershipUsagePage } from "@/features/membership/account-membership-pages";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getSiteContent(locale).account.membershipUsageMetadataTitle };
}

export default async function MembershipUsageRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getSiteContent(locale).account;
  return (
    <AccountRouteGate
      locale={locale}
      returnPath={`/account/${locale}/membership/usage`}
    >
      <MembershipUsagePage copy={copy} locale={locale} />
    </AccountRouteGate>
  );
}
