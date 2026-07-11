import type { Metadata } from "next";
import Image from "next/image";
import { ContactLinks } from "@/components/contact-links";
import { notFound } from "next/navigation";
import { PageHero, ReviewNote } from "@/components/primitives";
import { getDictionary } from "@/content/dictionaries";
import { getSiteContent } from "@/content/site-content";
import { isLocale, languageAlternates, localizedPath } from "@/lib/i18n";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = getSiteContent(locale).about;
  return {
    title: c.metadataTitle,
    description: c.intro,
    alternates: {
      canonical: localizedPath(locale, "/about"),
      languages: languageAlternates("/about"),
    },
  };
}
export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getSiteContent(locale).about;
  const t = getDictionary(locale);
  return (
    <>
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.title}
        intro={c.intro}
        image="/images/people-on-soil.webp"
        alt={c.heroAlt}
        position="center 44%"
      />
      <section className="section about-mission">
        <div className="shell split">
          <div>
            <p className="eyebrow">{c.purposeEyebrow}</p>
            <h2 className="section-heading">{c.mission}</h2>
          </div>
          <div>
            <div className="prose mission-copy">
              {c.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="field-photo-row" aria-hidden="true">
              <div className="field-photo small">
                <Image
                  src="/images/harvest-leaves.webp"
                  alt=""
                  fill
                  sizes="18rem"
                />
              </div>
              <div className="field-photo wide">
                <Image
                  src="/images/farm-landscape.webp"
                  alt=""
                  fill
                  sizes="26rem"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section section-cream">
        <div className="shell">
          <p className="eyebrow">{c.valuesEyebrow}</p>
          <h2 className="section-heading">{c.values}</h2>
          <div className="value-grid elevated-grid">
            {c.cards.map(([title, body], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell split">
          <div className="about-image editorial-image">
            <Image
              src="/images/farmer-field.webp"
              alt={c.gardenAlt}
              fill
              sizes="(min-width:760px) 48vw,100vw"
              style={{ objectPosition: "center 38%" }}
            />
          </div>
          <div className="closing-panel">
            <p className="eyebrow">{c.storyEyebrow}</p>
            <h2 className="section-heading">{c.truth}</h2>
            <p className="lede">{c.truthBody}</p>
            <ReviewNote>{t.review}</ReviewNote>
            <ContactLinks dictionary={t} showSocials={false} />
          </div>
        </div>
      </section>
    </>
  );
}
