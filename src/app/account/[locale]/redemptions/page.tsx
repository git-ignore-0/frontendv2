import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { AccountRouteGate } from "@/features/account/account-route-gate";
import { RedemptionsPage } from "@/features/account/redemption-pages";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getSiteContent(locale).account.redemptionsMetadataTitle };
}

export default async function AccountRedemptionsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getSiteContent(locale).account;
  const returnPath = `/account/${locale}/redemptions`;
  return (
    <AccountRouteGate locale={locale} returnPath={returnPath}>
      <RedemptionsPage locale={locale} copy={copy} />
    </AccountRouteGate>
  );
}
