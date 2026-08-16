import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSiteContent } from "@/content/site-content";
import { publicSiteOrigin } from "@/lib/auth/config";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { isReferralCode, normalizeReferralCode } from "@/lib/referral-code";

type RouteProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ locale?: string | string[] }>;
};

function resolveLocale(value: string | string[] | undefined): Locale {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && isLocale(candidate) ? candidate : defaultLocale;
}

async function referralLandingContext({ params, searchParams }: RouteProps) {
  const code = normalizeReferralCode((await params).code);
  if (!isReferralCode(code)) notFound();
  const locale = resolveLocale((await searchParams).locale);
  return { code, locale, copy: getSiteContent(locale).referralShareLanding };
}

export async function generateMetadata(props: RouteProps): Promise<Metadata> {
  const { code, copy, locale } = await referralLandingContext(props);
  const origin = publicSiteOrigin();
  const url = `${origin}/share/ref/${encodeURIComponent(code)}?locale=${locale}`;
  const image = `${origin}/share/ref/${encodeURIComponent(code)}/opengraph-image?locale=${locale}`;

  return {
    title: copy.title,
    description: copy.description,
    robots: { index: false, follow: false },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: copy.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [image],
    },
  };
}

export default async function ReferralShareLanding(props: RouteProps) {
  const { code, copy, locale } = await referralLandingContext(props);
  const directReferralUrl = `/ref/${encodeURIComponent(code)}?locale=${locale}`;

  return (
    <main className="referral-public-landing" lang={locale}>
      <div className="referral-public-landing-shell">
        <section className="referral-public-landing-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="referral-public-landing-description">
            {copy.description}
          </p>
          <Link
            className="referral-public-landing-cta"
            href={directReferralUrl}
          >
            {copy.cta}
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </Link>
        </section>
        <div aria-hidden="true" className="referral-public-landing-visual">
          <span className="referral-public-landing-sun" />
          <span className="referral-public-landing-field" />
          <svg className="referral-public-landing-sprout" viewBox="0 0 160 180">
            <path d="M80 164c-1-47 0-78 3-111" />
            <path d="M83 88C55 83 35 66 30 42c27-3 49 11 54 37" />
            <path d="M82 61c13-27 36-40 65-35-4 28-26 49-65 54" />
          </svg>
          <p className="referral-public-landing-note">{copy.visualNote}</p>
        </div>
      </div>
    </main>
  );
}
