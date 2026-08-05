import type { Metadata } from "next";
import Image from "next/image";
import { ContactLinks } from "@/components/contact-links";
import { notFound } from "next/navigation";
import { TextLink } from "@/components/primitives";
import { siteConfig } from "@/config/site";
import { getDictionary } from "@/content/dictionaries";
import { getSiteContent } from "@/content/site-content";
import { isLocale, languageAlternates, localizedPath } from "@/lib/i18n";
import { getSiteSettings, getWorkshops } from "@/lib/content-api";
import { WorkshopCard } from "@/features/workshops/workshop-card";
import { workshopCopy } from "@/features/workshops/copy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = getSiteContent(locale).home;
  return {
    title: c.title,
    description: c.intro,
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates(),
    },
    openGraph: {
      title: c.title,
      description: c.intro,
      url: `${siteConfig.url}/${locale}`,
      images: ["/images/farm-aerial.webp"],
    },
  };
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getSiteContent(locale).home;
  const t = getDictionary(locale);
  const [settings, workshops] = await Promise.all([
    getSiteSettings(locale),
    getWorkshops(locale, "upcoming"),
  ]);
  const workshopText = workshopCopy[locale];
  return (
    <>
      <section className="home-hero">
        <div className="hero-media">
          <Image
            src="/images/farm-aerial.webp"
            alt={c.heroAlt}
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="hero-shade" />
        <div className="shell hero-copy">
          <p className="eyebrow">{c.heroEyebrow}</p>
          <h1>{c.title}</h1>
          <p>{c.intro}</p>
          <div className="hero-actions">
            <TextLink href={localizedPath(locale, "/about")}>
              {c.primary}
            </TextLink>
            <TextLink href={localizedPath(locale, "/plants")}>
              {c.secondary}
            </TextLink>
          </div>
        </div>
      </section>
      <section className="section section-cream">
        <div className="shell split">
          <div>
            <p className="eyebrow">{c.systemsEyebrow}</p>
            <h2 className="section-heading">{c.what}</h2>
          </div>
          <div>
            <p className="lede">{c.whatBody}</p>
            <div className="principles">
              {c.principles.map(([title, body], i) => (
                <div className="principle" key={title}>
                  <strong>0{i + 1}</strong>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <p className="eyebrow">{c.pillarsEyebrow}</p>
          <h2 className="section-heading">{c.pillars}</h2>
          <div className="story-grid">
            <article>
              <div className="story-image">
                <Image
                  src="/images/harvest.webp"
                  alt=""
                  fill
                  sizes="(min-width:760px) 33vw,100vw"
                />
              </div>
              <p className="eyebrow">{c.plantLabel}</p>
              <h3>{c.plantTitle}</h3>
              <p>{c.plantBody}</p>
              <TextLink href={localizedPath(locale, "/plants")}>
                {c.plantCta}
              </TextLink>
            </article>
            <article>
              <div className="story-image tall">
                <Image
                  src="/images/piglets.webp"
                  alt=""
                  fill
                  sizes="(min-width:760px) 33vw,100vw"
                />
              </div>
              <p className="eyebrow">{c.animalLabel}</p>
              <h3>{c.animalTitle}</h3>
              <p>{c.animalBody}</p>
              <TextLink href={localizedPath(locale, "/animals")}>
                {c.animalCta}
              </TextLink>
            </article>
            <article>
              <div className="story-image">
                <Image
                  src="/images/family-field.webp"
                  alt=""
                  fill
                  sizes="(min-width:760px) 33vw,100vw"
                />
              </div>
              <p className="eyebrow">{c.communityLabel}</p>
              <h3>{c.peopleTitle}</h3>
              <p>{c.peopleBody}</p>
              <TextLink href={localizedPath(locale, "/about")}>
                {c.peopleCta}
              </TextLink>
            </article>
          </div>
        </div>
      </section>
      {workshops.length > 0 && (
        <section className="section section-cream home-workshops">
          <div className="shell">
            <div className="home-workshop-heading">
              <div>
                <p className="eyebrow">{workshopText.homeEyebrow}</p>
                <h2 className="section-heading">{workshopText.homeTitle}</h2>
              </div>
              <TextLink href={localizedPath(locale, "/workshops")}>
                {workshopText.homeCta}
              </TextLink>
            </div>
            <div className="workshop-grid">
              {workshops.slice(0, 3).map((workshop) => (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="section section-forest">
        <div className="shell split">
          <div>
            <p className="eyebrow">{c.storeEyebrow}</p>
            <h2 className="section-heading">{c.storeTitle}</h2>
          </div>
          <div>
            <p className="lede store-lede">{c.storeBody}</p>
            <TextLink href={localizedPath(locale, "/store")}>
              {c.storeCta}
            </TextLink>
          </div>
        </div>
      </section>
      <section className="section contact-band">
        <div className="shell split">
          <div className="contact-image">
            <Image
              src="/images/microscope.webp"
              alt=""
              fill
              sizes="(min-width:760px) 45vw,100vw"
            />
          </div>
          <div>
            <p className="eyebrow">{c.contactEyebrow}</p>
            <h2 className="section-heading">{c.contactTitle}</h2>
            <p className="lede">{c.contactBody}</p>
            <ContactLinks dictionary={t} settings={settings} />
          </div>
        </div>
      </section>
    </>
  );
}
