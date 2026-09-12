import { defaultLocale, localizedPath } from "@/lib/i18n";

export type EntrySearchParams = Record<string, string | string[] | undefined>;

export function defaultLocaleEntryPath(
  path: string,
  searchParams: EntrySearchParams,
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.append(key, value);
      continue;
    }
    value?.forEach((entry) => query.append(key, entry));
  }

  const search = query.toString();
  return `${localizedPath(defaultLocale, path)}${search ? `?${search}` : ""}`;
}
