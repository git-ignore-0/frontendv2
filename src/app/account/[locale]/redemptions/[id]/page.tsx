import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { AccountRouteGate } from "@/features/account/account-route-gate";
import { RedemptionDetailPage } from "@/features/account/redemption-pages";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getSiteContent(locale).account.redemptionDetailTitle };
}

export default async function AccountRedemptionDetailRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getSiteContent(locale).account;
  const returnPath = `/account/${locale}/redemptions/${id}`;
  return (
    <AccountRouteGate locale={locale} returnPath={returnPath}>
      <RedemptionDetailPage locale={locale} redemptionId={id} copy={copy} />
    </AccountRouteGate>
  );
}
