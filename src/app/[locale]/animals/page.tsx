import { redirect } from "next/navigation";
import { localizedPath } from "@/lib/i18n";
import { requireLocale } from "@/lib/require-locale";

export default async function LegacyAnimalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(localizedPath(requireLocale(locale), "/animals"));
}
