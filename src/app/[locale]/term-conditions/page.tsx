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
  return getLegalMetadata(resolveLegalLocale(locale), "terms");
}
export default async function TermsConditionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage locale={resolveLegalLocale(locale)} kind="terms" />;
}
