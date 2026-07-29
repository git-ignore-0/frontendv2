import { NextRequest, NextResponse } from "next/server";

import { authOrigin, publicSiteOrigin } from "@/lib/auth/config";
import { currentPublicSession } from "@/lib/auth/oauth";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = new Set(["account", "submit-code", "invited-users", "points"]);

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (path.length !== 1 || !allowed.has(path[0])) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (
    request.method !== "GET" &&
    (request.headers.get("origin") !== publicSiteOrigin() ||
      request.headers.get("x-nfv-public-request") !== "1")
  ) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const stored = await readSession();
  if (!stored)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let session;
  try {
    session = await currentPublicSession(stored);
    await writeSession(session);
  } catch {
    await clearSession();
    return NextResponse.json({ error: "session_expired" }, { status: 401 });
  }

  const target = new URL(`/api/v1/referrals/${path[0]}`, authOrigin());
  target.search = request.nextUrl.search;
  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        ...(request.headers.get("content-type")
          ? { "Content-Type": request.headers.get("content-type") as string }
          : {}),
      },
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 502 },
    );
  }
  if (response.status === 401) await clearSession();
  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") || "application/json",
      "Cache-Control": "private, no-store",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
