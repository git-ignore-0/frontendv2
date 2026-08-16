import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { authOrigin, oauthClientId, publicSiteOrigin } from "@/lib/auth/config";
import {
  pkceChallenge,
  PUBLIC_SCOPES,
  randomUrlSafe,
  safeReturnTo,
} from "@/lib/auth/oauth";
import { writeOAuthFlow } from "@/lib/auth/session";
import { defaultLocale, isLocale, localizedPath } from "@/lib/i18n";
import { isReferralCode } from "@/lib/referral-code";

export async function beginOAuth(
  request: NextRequest,
  options: {
    referralCode?: string;
    returnTo?: string;
    signup?: boolean;
  } = {},
) {
  const requestedLocale = request.nextUrl.searchParams.get("locale");
  const locale =
    requestedLocale && isLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;
  const fallback = localizedPath(locale);
  const returnTo = safeReturnTo(
    options.returnTo ?? request.nextUrl.searchParams.get("returnTo"),
    fallback,
  );
  const state = randomUrlSafe();
  const verifier = randomUrlSafe(48);
  const referralCode =
    options.signup &&
    options.referralCode &&
    isReferralCode(options.referralCode)
      ? options.referralCode
      : undefined;
  await writeOAuthFlow({
    state,
    verifier,
    returnTo,
    locale,
    ...(referralCode ? { referralCode } : {}),
  });

  const authorize = new URL(`${authOrigin()}/oauth/authorize`);
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: oauthClientId(),
    redirect_uri: `${publicSiteOrigin()}/api/auth/callback`,
    scope: PUBLIC_SCOPES,
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
    ui_locales: locale,
    ...(options.signup ? { screen_hint: "signup" } : {}),
    ...(referralCode ? { referral_code: referralCode } : {}),
  }).toString();
  return NextResponse.redirect(authorize);
}
