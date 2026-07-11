import { redirect } from "next/navigation";
import { resolveLegalLocale } from "@/features/pages/legal-page";
import { localizedPath } from "@/lib/i18n";

export default async function LegacyTermsConditionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(localizedPath(resolveLegalLocale(locale), "/term-conditions"));
}
