import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { SignedOutAccount } from "@/features/account/account-page";
import { PointHistoryPage } from "@/features/account/account-list-pages";
import { readSession } from "@/lib/auth/session";
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
  const session = await readSession();
  const returnPath = `/account/${locale}/points`;
  return session ? (
    <PointHistoryPage locale={locale} copy={copy} />
  ) : (
    <SignedOutAccount locale={locale} copy={copy} returnPath={returnPath} />
  );
}
