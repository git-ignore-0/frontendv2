import { redirect } from "next/navigation";

import {
  defaultLocaleEntryPath,
  type EntrySearchParams,
} from "@/app/csa/default-locale-entry";

export default async function CSAPurchaseEntry({
  searchParams,
}: {
  searchParams: Promise<EntrySearchParams>;
}) {
  redirect(defaultLocaleEntryPath("/csa/purchase", await searchParams));
}
