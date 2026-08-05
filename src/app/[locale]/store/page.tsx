import { permanentRedirect } from "next/navigation";
import { localizedPath } from "@/lib/i18n";
import { requireLocale } from "@/lib/require-locale";

export default async function LegacyStorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(localizedPath(requireLocale(locale), "/store"));
}
