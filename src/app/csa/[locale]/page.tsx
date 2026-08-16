import { getSiteContent } from "@/content/site-content";
import { CsaPage } from "@/features/membership/csa-page";
import { requireLocale } from "@/lib/require-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: segment } = await params;
  const locale = requireLocale(segment);
  return { title: getSiteContent(locale).csa.metadataTitle };
}

export default async function CsaRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: segment } = await params;
  const locale = requireLocale(segment);
  return <CsaPage copy={getSiteContent(locale).csa} locale={locale} />;
}
