import { NextRequest } from "next/server";

import { beginOAuth } from "@/lib/auth/begin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return beginOAuth(request);
}
