import type { Metadata } from "next";

import { LocaleShell } from "@/components/locale-shell";
import WorkshopListPage, {
  generateMetadata as generateWorkshopListMetadata,
} from "@/features/workshops/workshop-list-page";
import { locales } from "@/lib/i18n";
import { requireLocale } from "@/lib/require-locale";

type RouteParams = Promise<{ segment: string }>;

export function generateStaticParams() {
  return locales.map((segment) => ({ segment }));
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { segment } = await params;
  return generateWorkshopListMetadata({
    params: Promise.resolve({ locale: segment }),
  });
}

export default async function WorkshopListRoute({
  params,
}: {
  params: RouteParams;
}) {
  const { segment } = await params;
  const locale = requireLocale(segment);

  return (
    <LocaleShell locale={locale}>
      <WorkshopListPage params={Promise.resolve({ locale })} />
    </LocaleShell>
  );
}
