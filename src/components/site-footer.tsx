import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import { getDictionary } from "@/content/dictionaries";
import { type Locale, localizedPath, storeUrl } from "@/lib/i18n";

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
          <a
            className="footer-email"
            href="mailto:info@naturalfarmingvietnam.com"
          >
            info@naturalfarmingvietnam.com
          </a>
          <p className="footer-note">
            {locale === "en"
              ? "For learning, collaboration and farm conversations."
              : "Dành cho trao đổi học tập, hợp tác và câu chuyện nông trại."}
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href={localizedPath(locale, "/about")}>{t.nav.about}</Link>
          <Link href={localizedPath(locale, "/plants")}>{t.nav.plants}</Link>
          <Link href={localizedPath(locale, "/animals")}>{t.nav.animals}</Link>
          <a href={storeUrl} target="_blank" rel="noreferrer">
            {t.nav.store} <Arrow external />
          </a>
        </nav>
      </div>
      <div className="shell footer-bottom">
        <span>
          © {new Date().getFullYear()} {t.rights}
        </span>
        <span>Living Soil · Đất sống</span>
      </div>
    </footer>
  );
}
