import { Arrow } from "@/components/icons";
import { contactEmailHref, siteConfig } from "@/config/site";
import type { CommonDictionary } from "@/content/site-content";
import { phoneHref as phoneHrefFromDisplay } from "@/lib/contact";
import type { PublicSiteSettings } from "@/lib/content-api";

export function ContactLinks({
  dictionary: t,
  showSocials = true,
  settings,
}: {
  dictionary: CommonDictionary;
  showSocials?: boolean;
  settings?: PublicSiteSettings;
}) {
  const email = settings
    ? settings.is_email_enabled
      ? settings.email
      : ""
    : siteConfig.contact.email;
  const phone = settings
    ? settings.is_phone_enabled
      ? settings.phone_display
      : ""
    : siteConfig.contact.phone;
  const phoneHref = phoneHrefFromDisplay(phone);
  const facebook = settings
    ? settings.links.find((item) => item.kind === "facebook")?.url
    : siteConfig.links.facebook;
  const youtube = settings
    ? settings.links.find((item) => item.kind === "youtube")?.url
    : siteConfig.links.youtube;
  return (
    <address className="contact-links">
      <div className="contact-methods">
        {email && (
          <a
            className="contact-method"
            href={settings ? `mailto:${email}` : contactEmailHref}
          >
            <span>{t.email}</span>
            <strong>{email}</strong>
          </a>
        )}
        {phone && phoneHref && (
          <a className="contact-method" href={phoneHref}>
            <span>{t.phone}</span>
            <strong>{phone}</strong>
          </a>
        )}
      </div>
      {showSocials && (facebook || youtube) && (
        <nav className="social-links" aria-label={t.socialLinks}>
          {facebook && (
            <a href={facebook} target="_blank" rel="noreferrer">
              {t.facebook} <Arrow external />
              <span className="sr-only"> ({t.external})</span>
            </a>
          )}
          {youtube && (
            <a href={youtube} target="_blank" rel="noreferrer">
              {t.youtube} <Arrow external />
              <span className="sr-only"> ({t.external})</span>
            </a>
          )}
        </nav>
      )}
    </address>
  );
}
