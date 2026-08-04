import "server-only";

import { getSiteContent } from "@/content/site-content";
import { AccountSignedOutState } from "@/features/account/account-presentation";
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
    <AccountSignedOutState
      locale={locale}
      copy={getSiteContent(locale).account}
      returnPath={returnPath}
    />
  );
}
