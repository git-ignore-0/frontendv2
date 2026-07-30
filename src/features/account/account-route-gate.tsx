import "server-only";

import { getSiteContent } from "@/content/site-content";
import { SignedOutAccount } from "@/features/account/account-page";
import { readSession } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n";

export async function AccountRouteGate({
  children,
  locale,
  returnPath,
}: {
  children: React.ReactNode;
  locale: Locale;
  returnPath: string;
}) {
  const session = await readSession();
  return session ? (
    children
  ) : (
    <SignedOutAccount
      locale={locale}
      copy={getSiteContent(locale).account}
      returnPath={returnPath}
    />
  );
}
