import { NextRequest, NextResponse } from "next/server";

import { publicSiteOrigin } from "@/lib/auth/config";
import { exchangeCode } from "@/lib/auth/oauth";
import {
  clearSession,
  consumeOAuthFlow,
  writeSession,
} from "@/lib/auth/session";
import { localizedPath } from "@/lib/i18n";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const flow = await consumeOAuthFlow();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  if (!flow || !code || state !== flow.state || error) {
    await clearSession();
    const locale = flow?.locale ?? "en";
    return NextResponse.redirect(
      `${publicSiteOrigin()}${localizedPath(locale)}?auth=oauth`,
    );
  }
  try {
    await writeSession(await exchangeCode(code, flow.verifier));
    return NextResponse.redirect(`${publicSiteOrigin()}${flow.returnTo}`);
  } catch {
    await clearSession();
    return NextResponse.redirect(
      `${publicSiteOrigin()}${localizedPath(flow.locale)}?auth=oauth`,
    );
  }
}
