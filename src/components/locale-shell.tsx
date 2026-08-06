import { notFound } from "next/navigation";
import { ReferralFloatingAction } from "@/components/referral-floating-action";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary } from "@/content/dictionaries";
import { readSession } from "@/lib/auth/session";
import { TestimonialsWidget } from "@/components/testimonials/testimonials-widget";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSiteSettings, linkFromSettings } from "@/lib/content-api";

export async function LocaleShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [settings, session] = await Promise.all([
    getSiteSettings(locale),
    readSession(),
  ]);
  const externalLinks = {
    forum: linkFromSettings(settings, "forum"),
  };
  return (
    <div lang={locale} data-locale-shell>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <SiteHeader
        locale={locale}
        dictionary={t}
        externalLinks={externalLinks}
        initialUser={session?.user ?? null}
      />
      <main id="main">{children}</main>
      <TestimonialsWidget locale={locale as Locale} />
      <ReferralFloatingAction locale={locale as Locale} label={t.referralFab} />
      <SiteFooter locale={locale as Locale} settings={settings} />
    </div>
  );
}
