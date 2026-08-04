import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { buildAccountLevelOnePath } from "@/features/account/account-level-one-back";
import { AccountRouteGate } from "@/features/account/account-route-gate";
import { AccountMembershipPage } from "@/features/membership/account-membership-pages";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getSiteContent(locale).account.membershipMetadataTitle };
}

export default async function MembershipRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  if (!isLocale(locale)) notFound();
  const copy = getSiteContent(locale).account;
  const returnPath = buildAccountLevelOnePath({
    locale,
    returnTo,
    currentPath: `/account/${locale}/membership`,
  });
  return (
    <AccountRouteGate locale={locale} returnPath={returnPath}>
      <AccountMembershipPage copy={copy} locale={locale} returnTo={returnTo} />
    </AccountRouteGate>
  );
}
