import { NextRequest, NextResponse } from "next/server";

import { publicSiteOrigin } from "@/lib/auth/config";
import { beginOAuth } from "@/lib/auth/begin";
import { readSession } from "@/lib/auth/session";
import { isReferralCode, normalizeReferralCode } from "@/lib/referral-code";
import { defaultLocale, isLocale, localizedPath } from "@/lib/i18n";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const requestedLocale = request.nextUrl.searchParams.get("locale");
  const locale =
    requestedLocale && isLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;
  const code = normalizeReferralCode((await params).code);
  const origin = publicSiteOrigin();

  if (!isReferralCode(code)) {
    return NextResponse.redirect(`${origin}${localizedPath(locale)}`);
  }

  if (!(await readSession())) {
    return beginOAuth(request, {
      signup: true,
      referralCode: code,
      returnTo: `/account/${locale}/referral`,
    });
  }

  const referralPage = new URL(`/account/${locale}/referral`, origin);
  referralPage.searchParams.set("ref", code);
  return NextResponse.redirect(referralPage);
}
