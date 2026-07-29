import { LocaleShell } from "@/components/locale-shell";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LocaleShell locale={locale}>{children}</LocaleShell>;
}
