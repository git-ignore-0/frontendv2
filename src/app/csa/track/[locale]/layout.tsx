import { LocaleShell } from "@/components/locale-shell";
import { locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CSAContractTrackerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LocaleShell locale={locale}>{children}</LocaleShell>;
}
