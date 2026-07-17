import Image from "next/image";
import Link from "next/link";
import { ContactLinks } from "@/components/contact-links";
import { Arrow } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { getDictionary } from "@/content/dictionaries";
import { type Locale, localizedPath } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <footer id="contact" className="footer">
      <div className="shell footer-grid">
        <div>
          <Image src="/images/logo-mark.png" alt="" width={90} height={101} />
          <p>{t.footer}</p>
        </div>
        <div>
          <p className="eyebrow">{t.contact}</p>
          <ContactLinks dictionary={t} />
          <p className="footer-note">{t.footerNote}</p>
        </div>
        <nav className="footer-nav" aria-label={t.footerNavigation}>
          <Link href={localizedPath(locale, "/about")}>{t.nav.about}</Link>
          <Link href={localizedPath(locale, "/plants")}>{t.nav.plants}</Link>
          <Link href={localizedPath(locale, "/animals")}>{t.nav.animals}</Link>
          <Link href={localizedPath(locale, "/privacy-policy")}>
            {t.nav.privacy}
          </Link>
          <Link href={localizedPath(locale, "/term-conditions")}>
            {t.nav.terms}
          </Link>
          <a href={siteConfig.links.store} target="_blank" rel="noreferrer">
            {t.nav.store} <Arrow external />
          </a>
          <a href={siteConfig.links.forum} target="_blank" rel="noreferrer">
            {t.nav.forum} <Arrow external />
          </a>
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
