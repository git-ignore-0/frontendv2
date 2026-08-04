import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/lib/i18n";

export default async function AccountRedemptionDetailRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/account/${locale}/redemptions`);
}
