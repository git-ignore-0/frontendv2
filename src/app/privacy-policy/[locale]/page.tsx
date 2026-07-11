import {
  LegalPage,
  getLegalMetadata,
  resolveLegalLocale,
} from "@/features/pages/legal-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getLegalMetadata(resolveLegalLocale(locale), "privacy");
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage locale={resolveLegalLocale(locale)} kind="privacy" />;
}
