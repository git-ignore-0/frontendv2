import { notFound } from "next/navigation";
import { getSiteContent } from "@/content/site-content";
import { StorePage } from "@/features/store/store-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getSiteContent(locale).storeGuide;
  return { title: copy.title, description: copy.intro };
}

export default async function StoreRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = getSiteContent(locale).storeGuide;
  return <StorePage copy={copy} />;
}
