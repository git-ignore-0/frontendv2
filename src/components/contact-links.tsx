import { Arrow } from "@/components/icons";
import { contactEmailHref, contactPhoneHref, siteConfig } from "@/config/site";
import type { CommonDictionary } from "@/content/site-content";

export function ContactLinks({
  dictionary: t,
  showSocials = true,
}: {
  dictionary: CommonDictionary;
  showSocials?: boolean;
}) {
  return (
    <address className="contact-links">
      <div className="contact-methods">
        <a className="contact-method" href={contactEmailHref}>
          <span>{t.email}</span>
          <strong>{siteConfig.contact.email}</strong>
        </a>
        <a className="contact-method" href={contactPhoneHref}>
          <span>{t.phone}</span>
          <strong>{siteConfig.contact.phone}</strong>
        </a>
      </div>
      {showSocials && (
        <nav className="social-links" aria-label={t.socialLinks}>
          <a href={siteConfig.links.facebook} target="_blank" rel="noreferrer">
            {t.facebook} <Arrow external />
            <span className="sr-only"> ({t.external})</span>
          </a>
          <a href={siteConfig.links.youtube} target="_blank" rel="noreferrer">
            {t.youtube} <Arrow external />
            <span className="sr-only"> ({t.external})</span>
          </a>
        </nav>
      )}
    </address>
  );
}
