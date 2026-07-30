import { NextRequest, NextResponse } from "next/server";

import { accountUpstreamTarget } from "@/features/account/bff-path";
import { authOrigin, publicSiteOrigin } from "@/lib/auth/config";
import {
  AuthServiceUnavailableError,
  currentPublicSession,
  sessionTokensChanged,
} from "@/lib/auth/oauth";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const method = request.method === "POST" ? "POST" : "GET";
  const upstream = accountUpstreamTarget(path, method);
  if (!upstream) return jsonError("not_found", 404);
  if (
    request.method !== "GET" &&
    (request.headers.get("origin") !== publicSiteOrigin() ||
      request.headers.get("x-nfv-public-request") !== "1")
  ) {
    return jsonError("invalid_origin", 403);
  }

  let session = null;
  if (upstream.requiresSession) {
    const stored = await readSession();
    if (!stored) return jsonError("unauthorized", 401);
    try {
      session = await currentPublicSession(stored);
      if (sessionTokensChanged(stored, session)) await writeSession(session);
    } catch (error) {
      if (error instanceof AuthServiceUnavailableError) {
        return jsonError("upstream_unavailable", 502);
      }
      await clearSession();
      return jsonError("session_expired", 401);
    }
  }

  const target = new URL(upstream.path, authOrigin());
  target.search = request.nextUrl.search;
  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers: {
        ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...(request.headers.get("content-type")
          ? { "Content-Type": request.headers.get("content-type") as string }
          : {}),
      },
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException &&
      ["AbortError", "TimeoutError"].includes(error.name);
    return jsonError(
      timedOut ? "upstream_timeout" : "upstream_unavailable",
      timedOut ? 504 : 502,
    );
  }
  if (upstream.requiresSession && response.status === 401) await clearSession();
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
