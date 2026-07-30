import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { PointHistoryPage } from "@/features/account/account-list-pages";
import { AccountRouteGate } from "@/features/account/account-route-gate";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getSiteContent(locale).account.history };
}

export default async function AccountPointsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getSiteContent(locale).account;
  const returnPath = `/account/${locale}/points`;
  return (
    <AccountRouteGate locale={locale} returnPath={returnPath}>
      <PointHistoryPage locale={locale} copy={copy} />
    </AccountRouteGate>
  );
}
