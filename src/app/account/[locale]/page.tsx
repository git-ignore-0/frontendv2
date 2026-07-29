import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { AccountPage, SignedOutAccount } from "@/features/account/account-page";
import { readSession } from "@/lib/auth/session";
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
  const session = await readSession();
  return session ? (
    <AccountPage locale={locale} copy={copy} />
  ) : (
    <SignedOutAccount locale={locale} copy={copy} />
  );
}
