import { LegalPage, getLegalMetadata } from "@/features/pages/legal-page";
import { requireLocale } from "@/lib/require-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getLegalMetadata(requireLocale(locale), "privacy");
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage locale={requireLocale(locale)} kind="privacy" />;
}
