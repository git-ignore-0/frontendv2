import { redirect } from "next/navigation";

import { defaultLocale, localizedPath } from "@/lib/i18n";

export default async function CSAContractVerificationEntry({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string | string[] }>;
}) {
  const { reference } = await searchParams;
  const query = new URLSearchParams();
  if (typeof reference === "string") query.set("reference", reference);
  const search = query.toString();
  redirect(
    `${localizedPath(defaultLocale, "/csa/verify")}${search ? `?${search}` : ""}`,
  );
}
