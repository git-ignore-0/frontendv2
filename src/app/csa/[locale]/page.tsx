import { getSiteContent } from "@/content/site-content";
import { CsaPage } from "@/features/membership/csa-page";
import { farmsUrlFromSettings, getSiteSettings } from "@/lib/content-api";
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
  const settings = await getSiteSettings(locale);
  return (
    <CsaPage
      copy={getSiteContent(locale).csa}
      farmsUrl={farmsUrlFromSettings(settings)}
      locale={locale}
    />
  );
}
