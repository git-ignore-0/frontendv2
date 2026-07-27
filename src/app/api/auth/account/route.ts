import { NextResponse } from "next/server";

import { authOrigin } from "@/lib/auth/config";

export function GET() {
  return NextResponse.redirect(`${authOrigin()}/account`);
}
