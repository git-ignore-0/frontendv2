import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Arrow } from "@/components/icons";
import { workshopCopy } from "@/features/workshops/copy";
import { formatWorkshopDate } from "@/features/workshops/format";
import { RichText } from "@/features/workshops/rich-text";
import { WorkshopStatus } from "@/features/workshops/workshop-status";
import { getWorkshop, type PublicWorkshop } from "@/lib/content-api";
import { isLocale, localizedPath } from "@/lib/i18n";
import { serializeJsonLd } from "@/lib/json-ld";

const schemaEventStatus = {
  upcoming: "https://schema.org/EventScheduled",
  ongoing: "https://schema.org/EventScheduled",
  completed: "https://schema.org/EventCompleted",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  if (!isLocale(locale)) return {};
  const workshop = await getWorkshop(slug, locale);
  if (!workshop) return {};
  const canonical = localizedPath(
    workshop.content_locale,
    `/workshops/${slug}`,
  );
  return {
    title: workshop.title,
    description: workshop.summary,
    robots: workshop.is_fallback ? { index: false, follow: true } : undefined,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        workshop.available_locales.map((language) => [
          language,
          localizedPath(language, `/workshops/${slug}`),
        ]),
      ),
    },
    openGraph: {
      title: workshop.title,
      description: workshop.summary,
      url: canonical,
      type: "article",
    },
  };
}

function Detail({
  workshop,
  locale,
  preview = false,
}: {
  workshop: PublicWorkshop;
  locale: "vi" | "en";
  preview?: boolean;
}) {
  const t = workshopCopy[locale];
  const registrationUrl = workshop.registration_url?.trim() || "";
  const hasRegistrationUrl = Boolean(registrationUrl);
  const registrationOpen = workshop.status === "upcoming" && hasRegistrationUrl;
  const eventStatus = schemaEventStatus[workshop.status];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: workshop.title,
    description: workshop.summary,
    startDate: workshop.start_at,
    endDate: workshop.end_at,
    eventStatus,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      name: "Natural Farming Vietnam",
      url: "https://naturalfarmingvietnam.com",
    },
    offers: registrationOpen
      ? {
          "@type": "Offer",
          url: registrationUrl,
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };
  return (
    <>
      {preview && <div className="preview-banner">{t.preview}</div>}
      <article className="workshop-detail-page">
        <div className="workshop-list-background" aria-hidden="true">
          <span className="workshop-background-grain" />
          <span className="workshop-background-moss" />
          <span className="workshop-background-straw" />
        </div>
        <header className="workshop-detail-hero">
          <div className="shell workshop-detail-heading">
            <h1>{workshop.title}</h1>
            <p>{workshop.summary}</p>
          </div>
        </header>
        {workshop.is_fallback && (
          <div className="shell fallback-banner">
            <p>{t.fallback}</p>
            <Link
              className="text-link"
              href={localizedPath(
                workshop.content_locale,
                `/workshops/${workshop.slug}`,
              )}
            >
              {t.readOriginal} <Arrow />
            </Link>
          </div>
        )}
        <div className="shell workshop-detail-layout">
          <main className="workshop-main">
            <RichText document={workshop.body} />
          </main>
          <aside className="workshop-facts">
            <dl>
              <div>
                <dt>{t.statusLabel}</dt>
                <dd>
                  <WorkshopStatus status={workshop.status} locale={locale} />
                </dd>
              </div>
              <div>
                <dt>{t.date}</dt>
                <dd>
                  <time dateTime={workshop.start_at}>
                    {formatWorkshopDate(
                      workshop.start_at,
                      workshop.end_at,
                      workshop.event_timezone,
                      locale,
                    )}
                  </time>
                </dd>
              </div>
            </dl>
            {registrationOpen ? (
              <a
                className="workshop-register"
                href={registrationUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t.register} <Arrow external />
              </a>
            ) : null}
          </aside>
        </div>
      </article>
      {!preview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(jsonLd),
          }}
        />
      )}
    </>
  );
}

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  if (!isLocale(locale)) notFound();
  const workshop = await getWorkshop(slug, locale);
  if (!workshop) notFound();
  return <Detail workshop={workshop} locale={locale} />;
}

export { Detail as WorkshopDetail };
