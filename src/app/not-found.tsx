import Link from "next/link";
import { headers } from "next/headers";
import { getSiteContent } from "@/content/site-content";
import { defaultLocale, isLocale, localizedPath } from "@/lib/i18n";

export default async function NotFound() {
  const requestedLocale = (await headers()).get("x-site-locale");
  const locale =
    requestedLocale && isLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;
  const content = getSiteContent(locale).common.notFound;
  return (
    <main className="section">
      <div className="shell">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1 className="section-heading">{content.title}</h1>
        <p className="lede">{content.body}</p>
        <Link className="text-link" href={localizedPath(locale)}>
          {content.cta} →
        </Link>
      </div>
    </main>
  );
}
