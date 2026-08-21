import { NextResponse } from "next/server";

import { getTrackerFarmsResult } from "@/lib/content-api";
import { isLocale } from "@/lib/i18n";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };
const retryNoncePattern = /^[A-Za-z0-9_-]{1,128}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  const retryNonce = searchParams.get("retry");
  if (
    !locale ||
    !isLocale(locale) ||
    !retryNonce ||
    !retryNoncePattern.test(retryNonce)
  ) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const result = await getTrackerFarmsResult(locale, { bypassCache: true });
  if (!result.ok) {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 502, headers: noStoreHeaders },
    );
  }
  return NextResponse.json({ data: result.farms }, { headers: noStoreHeaders });
}
