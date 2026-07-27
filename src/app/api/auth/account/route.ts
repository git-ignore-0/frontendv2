import { NextRequest, NextResponse } from "next/server";

import { authOrigin, publicSiteOrigin } from "@/lib/auth/config";
import { safeReturnTo } from "@/lib/auth/oauth";

export function GET(request: NextRequest) {
  const returnPath = safeReturnTo(
    request.nextUrl.searchParams.get("returnTo"),
    "/",
  );
  const accountUrl = new URL("/account", authOrigin());
  accountUrl.searchParams.set(
    "return_to",
    new URL(returnPath, publicSiteOrigin()).href,
  );
  return NextResponse.redirect(accountUrl);
}
