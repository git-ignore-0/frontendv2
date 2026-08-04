import Link from "next/link";

import { Arrow } from "@/components/icons";
import {
  formatWorkshopDate,
  formatWorkshopDateTile,
} from "@/features/workshops/format";
import type { PublicWorkshop } from "@/lib/content-api";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/i18n";

import { workshopCopy } from "./copy";
import { WorkshopStatus } from "./workshop-status";

function WorkshopClockIcon() {
  return (
    <svg aria-hidden="true" className="workshop-time-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function WorkshopCard({
  workshop,
  locale,
  titleTag: TitleTag = "h3",
  calendar = false,
}: {
  workshop: PublicWorkshop;
  locale: Locale;
  titleTag?: "h3" | "h4";
  calendar?: boolean;
}) {
  const t = workshopCopy[locale];
  const dateTile = formatWorkshopDateTile(
    workshop.start_at,
    workshop.event_timezone,
    locale,
  );

  return (
    <article
      className={["workshop-card", calendar && "workshop-calendar-card"]
        .filter(Boolean)
        .join(" ")}
    >
      {calendar ? (
        <div className="workshop-date-tile">
          <time
            className="workshop-date-value"
            dateTime={workshop.start_at}
            aria-label={dateTile.label}
          >
            <span className="workshop-date-month">{dateTile.month}</span>
            <span className="workshop-date-day">{dateTile.day}</span>
          </time>
          <span className="workshop-date-status">
            <WorkshopStatus status={workshop.status} locale={locale} showDot />
          </span>
        </div>
      ) : (
        <time
          className="workshop-date-tile"
          dateTime={workshop.start_at}
          aria-label={dateTile.label}
        >
          <span className="workshop-date-day">{dateTile.day}</span>
          <span className="workshop-date-month">{dateTile.month}</span>
        </time>
      )}
      <div className="workshop-card-copy">
        <div className="workshop-card-meta">
          <span className="workshop-meta-status">
            <WorkshopStatus
              status={workshop.status}
              locale={locale}
              showDot={calendar}
            />
          </span>
          {calendar && <WorkshopClockIcon />}
          <time dateTime={workshop.start_at}>
            {formatWorkshopDate(
              workshop.start_at,
              workshop.end_at,
              workshop.event_timezone,
              locale,
            )}
          </time>
        </div>
        <TitleTag>
          <Link
            className="workshop-title-link"
            href={localizedPath(locale, `/workshops/${workshop.slug}`)}
          >
            {workshop.title}
          </Link>
        </TitleTag>
        <p>{workshop.summary}</p>
        {workshop.is_fallback && <p className="fallback-note">{t.fallback}</p>}
        {!calendar && (
          <Link
            className="workshop-detail-link"
            href={localizedPath(locale, `/workshops/${workshop.slug}`)}
          >
            {t.details} <Arrow />
          </Link>
        )}
      </div>
      {calendar && (
        <div className="workshop-card-action">
          <Link
            className="workshop-detail-link"
            href={localizedPath(locale, `/workshops/${workshop.slug}`)}
          >
            {t.details} <Arrow />
          </Link>
        </div>
      )}
    </article>
  );
}
