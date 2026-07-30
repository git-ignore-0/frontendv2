import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { AccountPage } from "@/features/account/account-page";
import { AccountRouteGate } from "@/features/account/account-route-gate";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getSiteContent(locale).account.metadataTitle };
}

export default async function AccountRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getSiteContent(locale).account;
  return (
    <AccountRouteGate locale={locale} returnPath={`/account/${locale}`}>
      <AccountPage locale={locale} copy={copy} />
    </AccountRouteGate>
  );
}
