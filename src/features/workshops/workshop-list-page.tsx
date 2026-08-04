import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkshopCard } from "@/features/workshops/workshop-card";
import { workshopCopy } from "@/features/workshops/copy";
import { formatWorkshopMonthGroup } from "@/features/workshops/format";
import { getWorkshops, type PublicWorkshop } from "@/lib/content-api";
import {
  isLocale,
  languageAlternates,
  type Locale,
} from "@/lib/i18n";

function groupWorkshopsByMonth(
  workshops: PublicWorkshop[],
  locale: Locale,
) {
  const groups = new Map<
    string,
    { key: string; label: string; workshops: PublicWorkshop[] }
  >();

  for (const workshop of workshops) {
    const month = formatWorkshopMonthGroup(
      workshop.start_at,
      workshop.event_timezone,
      locale,
    );
    const group = groups.get(month.key);

    if (group) {
      group.workshops.push(workshop);
    } else {
      groups.set(month.key, { ...month, workshops: [workshop] });
    }
  }

  return [...groups.values()];
}

function WorkshopMonthGroups({
  workshops,
  locale,
  idPrefix,
}: {
  workshops: PublicWorkshop[];
  locale: Locale;
  idPrefix: string;
}) {
  const groups = groupWorkshopsByMonth(workshops, locale);

  return (
    <div className="workshop-calendar">
      {groups.map((group) => {
        const headingId = `${idPrefix}-${group.key}`;

        return (
          <section
            key={group.key}
            className="workshop-month-group"
            aria-labelledby={headingId}
          >
            <header className="workshop-month-header">
              <h3 id={headingId} className="workshop-month-heading">
                {group.label}
              </h3>
              <span aria-hidden="true" className="workshop-month-divider" />
            </header>
            <div className="workshop-month-list">
              {group.workshops.map((workshop) => (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  locale={locale}
                  titleTag="h4"
                  calendar
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

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
    <div className="workshop-list-page">
      <div className="workshop-list-background" aria-hidden="true">
        <span className="workshop-background-grain" />
        <span className="workshop-background-moss" />
        <span className="workshop-background-straw" />
      </div>
      <div className="shell workshop-list-shell">
        <header className="workshop-list-hero">
          <h1>{t.title}</h1>
          <p className="workshop-list-intro">{t.intro}</p>
        </header>
        <section
          className="workshop-list-section"
          aria-labelledby="workshop-upcoming-title"
        >
          <header className="workshop-section-header">
            <h2 id="workshop-upcoming-title">{t.upcoming}</h2>
            <p className="workshop-section-count">
              {t.workshopCount(upcoming.length)}
            </p>
          </header>
          {upcoming.length ? (
            <WorkshopMonthGroups
              workshops={upcoming}
              locale={locale}
              idPrefix="workshop-upcoming-month"
            />
          ) : (
            <p className="workshop-empty">{t.emptyUpcoming}</p>
          )}
        </section>
        <section
          className="workshop-list-section workshop-list-section-past"
          aria-labelledby="workshop-past-title"
        >
          <header className="workshop-section-header">
            <h2 id="workshop-past-title">{t.past}</h2>
            <p className="workshop-section-count">
              {t.workshopCount(past.length)}
            </p>
          </header>
          {past.length ? (
            <WorkshopMonthGroups
              workshops={past}
              locale={locale}
              idPrefix="workshop-past-month"
            />
          ) : (
            <p className="workshop-empty">{t.emptyPast}</p>
          )}
        </section>
      </div>
    </div>
  );
}
