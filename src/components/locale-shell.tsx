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
  showCommunityActions = true,
}: {
  children: React.ReactNode;
  locale: string;
  showCommunityActions?: boolean;
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
      {showCommunityActions ? (
        <>
          <TestimonialsWidget locale={locale as Locale} />
          <div className="csa-fab-stack">
            <div className="csa-fab-buy-slot" data-csa-fab-buy-slot />
            <ReferralFloatingAction
              locale={locale as Locale}
              label={t.referralFab}
            />
          </div>
        </>
      ) : null}
      <SiteFooter locale={locale as Locale} settings={settings} />
    </div>
  );
}
