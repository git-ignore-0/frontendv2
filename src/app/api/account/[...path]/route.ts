import { NextRequest, NextResponse } from "next/server";

import {
  accountUpstreamTarget,
  uuidPattern,
} from "@/features/account/bff-path";
import { authOrigin, publicSiteOrigin } from "@/lib/auth/config";
import {
  AuthServiceUnavailableError,
  currentPublicSession,
  sessionTokensChanged,
} from "@/lib/auth/oauth";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACKER_COOKIE_NAME = "nfv_csa_tracker";
const TRACKER_BFF_PATH = "/api/account/csa-contract-tracker";

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function trackerCookieHeader(request: NextRequest) {
  const value = request.cookies.get(TRACKER_COOKIE_NAME)?.value;
  if (!value || value.length > 128 || /[;\r\n]/.test(value)) return null;
  return `${TRACKER_COOKIE_NAME}=${value}`;
}

function responseSetCookies(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;
  if (typeof getSetCookie === "function") return getSetCookie.call(headers);
  const combined = headers.get("set-cookie");
  return combined ? combined.split(/,(?=\s*[!#$%&'*+.^_`|~0-9A-Za-z-]+=)/) : [];
}

function rewriteTrackerSetCookie(value: string) {
  if (!value.trimStart().startsWith(`${TRACKER_COOKIE_NAME}=`)) return null;
  if (/;\s*path=/i.test(value))
    return value.replace(/(;\s*path=)[^;]*/i, `$1${TRACKER_BFF_PATH}`);
  return `${value}; Path=${TRACKER_BFF_PATH}`;
}

function invalidTrackerQuery(request: NextRequest, upstreamPath: string) {
  const parameters = request.nextUrl.searchParams;
  if (upstreamPath.endsWith("/pdf")) {
    const locales = parameters.getAll("locale");
    const versions = parameters.getAll("version_id");
    const onlyAllowed = [...parameters.keys()].every(
      (key) => key === "locale" || key === "version_id",
    );
    return (
      !onlyAllowed ||
      locales.length !== 1 ||
      !["vi", "en"].includes(locales[0]) ||
      versions.length > 1 ||
      (versions.length === 1 && !uuidPattern.test(versions[0]))
    );
  }
  return parameters.size > 0;
}

function invalidContractReferenceQuery(request: NextRequest) {
  const parameters = request.nextUrl.searchParams;
  const references = parameters.getAll("reference_code");
  return (
    references.length !== 1 ||
    !references[0].trim() ||
    [...parameters.keys()].some((key) => key !== "reference_code")
  );
}

function invalidMembershipContractQuery(
  request: NextRequest,
  query: "membership-contract" | "contract-pdf",
) {
  const parameters = request.nextUrl.searchParams;
  if (query === "membership-contract") return parameters.size > 0;
  const locales = parameters.getAll("locale");
  const versions = parameters.getAll("version_id");
  return (
    locales.length !== 1 ||
    !["vi", "en"].includes(locales[0]) ||
    versions.length > 1 ||
    (versions.length === 1 && !uuidPattern.test(versions[0])) ||
    [...parameters.keys()].some(
      (key) => key !== "locale" && key !== "version_id",
    )
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
  if (upstream.query === "none" && request.nextUrl.searchParams.size > 0)
    return jsonError("not_found", 404);
  if (
    upstream.query === "contract-reference" &&
    invalidContractReferenceQuery(request)
  )
    return jsonError("not_found", 404);
  if (
    (upstream.query === "membership-contract" ||
      upstream.query === "contract-pdf") &&
    invalidMembershipContractQuery(request, upstream.query)
  )
    return jsonError("not_found", 404);
  if (upstream.trackerCookie && invalidTrackerQuery(request, upstream.path))
    return jsonError(
      upstream.path.endsWith("/pdf") ? "invalid_contract_locale" : "not_found",
      upstream.path.endsWith("/pdf") ? 400 : 404,
    );
  if (
    request.method !== "GET" &&
    (request.headers.get("origin") !== publicSiteOrigin() ||
      request.headers.get("x-nfv-public-request") !== "1")
  ) {
    return jsonError("invalid_origin", 403);
  }

  let session = null;
  if (upstream.session !== "none") {
    const stored = await readSession();
    if (!stored) {
      if (upstream.session === "required")
        return jsonError("unauthorized", 401);
    } else {
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
  }

  const target = new URL(upstream.path, authOrigin());
  target.search = request.nextUrl.search;
  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers: {
        ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...(request.headers.get("accept-language")
          ? {
              "Accept-Language": request.headers.get(
                "accept-language",
              ) as string,
            }
          : {}),
        ...(request.headers.get("content-type")
          ? { "Content-Type": request.headers.get("content-type") as string }
          : {}),
        ...(upstream.trackerCookie && trackerCookieHeader(request)
          ? { Cookie: trackerCookieHeader(request) as string }
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
  if (session && response.status === 401) await clearSession();
  const responseHeaders = new Headers({
    "Content-Type": response.headers.get("content-type") || "application/json",
    "Cache-Control": "private, no-store",
  });
  for (const name of [
    "content-disposition",
    "pragma",
    "x-content-type-options",
  ]) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  if (upstream.trackerCookie) {
    for (const value of responseSetCookies(response.headers)) {
      const rewritten = rewriteTrackerSetCookie(value);
      if (rewritten) responseHeaders.append("Set-Cookie", rewritten);
    }
  }
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
