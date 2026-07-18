import Link from "next/link";

import { Arrow } from "@/components/icons";
import { formatWorkshopDate } from "@/features/workshops/format";
import type { PublicWorkshop } from "@/lib/content-api";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/i18n";

import { workshopCopy } from "./copy";

export function WorkshopCard({
  workshop,
  locale,
}: {
  workshop: PublicWorkshop;
  locale: Locale;
}) {
  const t = workshopCopy[locale];
  return (
    <article className="workshop-card">
      <div className="workshop-card-copy">
        <div className="workshop-card-meta">
          <time dateTime={workshop.start_at}>
            {formatWorkshopDate(
              workshop.start_at,
              workshop.end_at,
              workshop.event_timezone,
              locale,
            )}
          </time>
        </div>
        <h3>
          <Link href={localizedPath(locale, `/workshops/${workshop.slug}`)}>
            {workshop.title}
          </Link>
        </h3>
        <p>{workshop.summary}</p>
        {workshop.is_fallback && <p className="fallback-note">{t.fallback}</p>}
        <Link
          className="text-link"
          href={localizedPath(locale, `/workshops/${workshop.slug}`)}
        >
          {t.details} <Arrow />
        </Link>
      </div>
    </article>
  );
}
