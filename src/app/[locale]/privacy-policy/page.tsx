import { redirect } from "next/navigation";
import { requireLocale } from "@/lib/require-locale";
import { localizedPath } from "@/lib/i18n";

export default async function LegacyPrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(localizedPath(requireLocale(locale), "/privacy-policy"));
}
