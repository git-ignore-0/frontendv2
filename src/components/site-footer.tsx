import Image from "next/image";
import Link from "next/link";
import { ContactLinks } from "@/components/contact-links";
import { Arrow } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { type Locale, localizedPath } from "@/lib/i18n";
import { linkFromSettings, type PublicSiteSettings } from "@/lib/content-api";
import { getSiteContent } from "@/content/site-content";

export function SiteFooter({
  locale,
  settings,
}: {
  locale: Locale;
  settings: PublicSiteSettings;
}) {
  const content = getSiteContent(locale);
  const t = content.common;
  const tTestimonials = content.testimonials;
  const forum = linkFromSettings(settings, "forum");
  return (
    <footer id="contact" className="footer">
      <div className="shell footer-grid">
        <div>
          <Image src="/images/logo-mark.png" alt="" width={90} height={101} />
          <strong className="footer-organization">{siteConfig.name}</strong>
          <p>{t.footer}</p>
        </div>
        <div>
          <p className="eyebrow">{t.contact}</p>
          <ContactLinks dictionary={t} settings={settings} />
          <p className="footer-note">{t.footerNote}</p>
        </div>
        <nav className="footer-nav" aria-label={t.footerNavigation}>
          <Link href={localizedPath(locale, "/about")}>{t.nav.about}</Link>
          <Link href={localizedPath(locale, "/plants")}>{t.nav.plants}</Link>
          <Link href={localizedPath(locale, "/animals")}>{t.nav.animals}</Link>
          <Link href={localizedPath(locale, "/workshops")}>
            {t.nav.workshops}
          </Link>
          <Link href={localizedPath(locale, "/testimonials")}>
            {tTestimonials.launcher}
          </Link>
          <Link href={localizedPath(locale, "/csa")}>{t.nav.csa}</Link>
          <Link href={localizedPath(locale, "/privacy-policy")}>
            {t.nav.privacy}
          </Link>
          <Link href={localizedPath(locale, "/term-conditions")}>
            {t.nav.terms}
          </Link>
          <Link href={localizedPath(locale, "/store")}>{t.nav.store}</Link>
          {forum && (
            <a href={forum} target="_blank" rel="noreferrer">
              {t.nav.forum} <Arrow external />
            </a>
          )}
        </nav>
      </div>
      <div className="shell footer-bottom">
        <span>
          © {new Date().getFullYear()} {t.rights}
        </span>
        <span>{t.brandTagline}</span>
      </div>
    </footer>
  );
}
