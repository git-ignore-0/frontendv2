import { notFound } from "next/navigation";

import { getCSAContractVerificationCopy } from "@/features/membership/csa-contract-verification-copy";
import { CSAContractVerificationPage } from "@/features/membership/csa-contract-verification-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getCSAContractVerificationCopy(locale);
  return { title: copy.title, description: copy.intro };
}

export default async function CSAContractVerificationRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reference?: string | string[] }>;
}) {
  const [{ locale }, { reference }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  return (
    <CSAContractVerificationPage
      initialReference={typeof reference === "string" ? reference : ""}
      locale={locale}
    />
  );
}
