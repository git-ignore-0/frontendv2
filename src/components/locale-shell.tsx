import { notFound } from "next/navigation";
import { ReferralFloatingAction } from "@/components/referral-floating-action";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary } from "@/content/dictionaries";
import { readSession } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n";
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
      <ReferralFloatingAction locale={locale} label={t.referralFab} />
      <SiteFooter locale={locale} settings={settings} />
    </div>
  );
}
