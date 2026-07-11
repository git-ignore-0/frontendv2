import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextLink } from "@/components/primitives";
import { contactEmailHref } from "@/config/site";
import { getSiteContent } from "@/content/site-content";
import {
  isLocale,
  languageAlternates,
  localizedPath,
  type Locale,
} from "@/lib/i18n";

export type LegalPageKind = "privacy" | "terms";

export function getLegalMetadata(
  locale: Locale,
  kind: LegalPageKind,
): Metadata {
  const item = getSiteContent(locale).legal[kind];
  const slug = kind === "privacy" ? "privacy-policy" : "term-conditions";
  return {
    title: item.title,
    description: item.description,
    alternates: {
      canonical: localizedPath(locale, `/${slug}`),
      languages: languageAlternates(`/${slug}`),
    },
    robots: { index: false, follow: true },
  };
}

export function LegalPage({
  locale,
  kind,
}: {
  locale: Locale;
  kind: LegalPageKind;
}) {
  const content = getSiteContent(locale).legal;
  const page = content[kind];
  return (
    <section className="legal-page section">
      <div className="shell legal-shell">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{page.title}</h1>
        <div className="legal-notice">
          <h2>{content.pendingTitle}</h2>
          <p>{content.pendingBody}</p>
          <p className="legal-source">{content.sourceNote}</p>
          <TextLink href={contactEmailHref}>{content.contactCta}</TextLink>
        </div>
      </div>
    </section>
  );
}

export function resolveLegalLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}
