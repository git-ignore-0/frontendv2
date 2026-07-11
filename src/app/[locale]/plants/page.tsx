import { redirect } from "next/navigation";
import { localizedPath } from "@/lib/i18n";
import { resolveLegalLocale } from "@/features/pages/legal-page";

export default async function LegacyPlantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(localizedPath(resolveLegalLocale(locale), "/plants"));
}
