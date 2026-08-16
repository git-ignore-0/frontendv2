import { NextRequest, NextResponse } from "next/server";

import { authOrigin, publicSiteOrigin } from "@/lib/auth/config";
import { clearSession } from "@/lib/auth/session";
import { defaultLocale, isLocale, localizedPath } from "@/lib/i18n";

export async function POST(request: NextRequest) {
  const siteOrigin = publicSiteOrigin();
  if (request.headers.get("origin") !== siteOrigin) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const localeValue = request.nextUrl.searchParams.get("locale");
  const locale =
    localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
  await clearSession();
  const returnTo = `${siteOrigin}${localizedPath(locale)}`;
  const coreLogout = new URL("/logout/public/", authOrigin());
  coreLogout.searchParams.set("locale", locale);
  coreLogout.searchParams.set("return_to", returnTo);
  return NextResponse.redirect(coreLogout, 303);
}
