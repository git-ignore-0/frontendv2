import { NextRequest, NextResponse } from "next/server";

import { publicSiteOrigin } from "@/lib/auth/config";
import { clearSession } from "@/lib/auth/session";
import { defaultLocale, isLocale, localizedPath } from "@/lib/i18n";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== publicSiteOrigin()) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const localeValue = request.nextUrl.searchParams.get("locale");
  const locale =
    localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
  await clearSession();
  return NextResponse.redirect(
    `${publicSiteOrigin()}${localizedPath(locale)}`,
    303,
  );
}
