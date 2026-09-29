import { LocaleShell } from "@/components/locale-shell";
import { locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function TrackerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <LocaleShell locale={locale} showCommunityActions={false}>
      <div className="tracker-standalone">{children}</div>
    </LocaleShell>
  );
}
