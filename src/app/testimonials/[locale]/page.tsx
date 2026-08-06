import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { TestimonialsPage } from "@/features/testimonials/testimonials-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getSiteContent(locale).testimonials;
  return { title: copy.pageTitle, description: copy.pageIntro };
}

export default async function TestimonialsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <TestimonialsPage locale={locale} />;
}
