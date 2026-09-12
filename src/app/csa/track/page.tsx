import { redirect } from "next/navigation";

import {
  defaultLocaleEntryPath,
  type EntrySearchParams,
} from "@/app/csa/default-locale-entry";

export default async function CSAContractTrackerEntry({
  searchParams,
}: {
  searchParams: Promise<EntrySearchParams>;
}) {
  redirect(defaultLocaleEntryPath("/csa/track", await searchParams));
}
