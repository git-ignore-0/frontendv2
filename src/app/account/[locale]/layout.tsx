import { LocaleShell } from "@/components/locale-shell";
import { AccountScrollReset } from "@/features/account/account-scroll-reset";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <LocaleShell locale={locale}>
      <AccountScrollReset>{children}</AccountScrollReset>
    </LocaleShell>
  );
}
