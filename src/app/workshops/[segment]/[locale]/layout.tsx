import { LocaleShell } from "@/components/locale-shell";

export default async function WorkshopDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ segment: string; locale: string }>;
}) {
  const { locale } = await params;
  return <LocaleShell locale={locale}>{children}</LocaleShell>;
}
