import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkshopCard } from "@/features/workshops/workshop-card";
import { workshopCopy } from "@/features/workshops/copy";
import { getWorkshops } from "@/lib/content-api";
import { isLocale, languageAlternates } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = workshopCopy[locale];
  return {
    title: t.title,
    description: t.intro,
    alternates: {
      canonical: `/workshops/${locale}`,
      languages: languageAlternates("/workshops"),
    },
  };
}

export default async function WorkshopListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = workshopCopy[locale];
  const [upcoming, past] = await Promise.all([
    getWorkshops(locale, "upcoming"),
    getWorkshops(locale, "past"),
  ]);
  return (
    <>
      <section className="workshop-list-hero">
        <div className="shell">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="lede">{t.intro}</p>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <h2 className="workshop-section-title">{t.upcoming}</h2>
          {upcoming.length ? (
            <div className="workshop-grid">
              {upcoming.map((item) => (
                <WorkshopCard key={item.id} workshop={item} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="workshop-empty">{t.emptyUpcoming}</p>
          )}
        </div>
      </section>
      <section className="section section-cream">
        <div className="shell">
          <h2 className="workshop-section-title">{t.past}</h2>
          {past.length ? (
            <div className="workshop-grid">
              {past.map((item) => (
                <WorkshopCard key={item.id} workshop={item} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="workshop-empty">{t.emptyPast}</p>
          )}
        </div>
      </section>
    </>
  );
}
