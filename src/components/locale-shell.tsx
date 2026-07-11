import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary } from "@/content/dictionaries";
import { isLocale } from "@/lib/i18n";

export async function LocaleShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div lang={locale} data-locale-shell>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <SiteHeader locale={locale} dictionary={t} />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} />
    </div>
  );
}
