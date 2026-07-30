import "server-only";

import crypto from "node:crypto";

import {
  authOrigin,
  oauthClientId,
  oauthClientSecret,
  publicSiteOrigin,
} from "@/lib/auth/config";
import { meResponseSchema, tokenResponseSchema } from "@/lib/auth/schemas";
import type { PublicSession } from "@/lib/auth/session";

export const PUBLIC_SCOPES = "profile email";
const AUTH_REQUEST_TIMEOUT_MS = 10_000;
const refreshes = new Map<string, Promise<PublicSession>>();

export class PublicSessionInvalidError extends Error {}
export class AuthServiceUnavailableError extends Error {}

async function authFetch(input: string, init: RequestInit = {}) {
  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new AuthServiceUnavailableError("Core Auth is unavailable", {
      cause: error,
    });
  }
}

export function randomUrlSafe(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function safeReturnTo(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  try {
    const target = new URL(value, publicSiteOrigin());
    return target.origin === publicSiteOrigin()
      ? `${target.pathname}${target.search}${target.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

async function tokenRequest(parameters: URLSearchParams) {
  parameters.set("client_id", oauthClientId());
  parameters.set("client_secret", oauthClientSecret());
  const response = await authFetch(`${authOrigin()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: parameters,
    cache: "no-store",
  });
  if (!response.ok) {
    const ErrorType = [400, 401].includes(response.status)
      ? PublicSessionInvalidError
      : AuthServiceUnavailableError;
    throw new ErrorType(`OAuth token request failed (${response.status})`);
  }
  try {
    return tokenResponseSchema.parse(await response.json());
  } catch (error) {
    throw new AuthServiceUnavailableError(
      "Core Auth returned an invalid token response",
      { cause: error },
    );
  }
}

async function fetchCoreUser(accessToken: string) {
  const response = await authFetch(`${authOrigin()}/api/v1/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new PublicSessionInvalidError(
        `Core profile request failed (${response.status})`,
      );
    }
    throw new AuthServiceUnavailableError(
      `Core profile request failed (${response.status})`,
    );
  }
  try {
    return meResponseSchema.parse(await response.json()).data;
  } catch (error) {
    throw new AuthServiceUnavailableError(
      "Core Auth returned an invalid profile response",
      { cause: error },
    );
  }
}

export async function exchangeCode(code: string, verifier: string) {
  const token = await tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: `${publicSiteOrigin()}/api/auth/callback`,
    }),
  );
  const user = await fetchCoreUser(token.access_token);
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? "",
    expiresAt: Date.now() + token.expires_in * 1000,
    user,
  } satisfies PublicSession;
}

export async function refreshPublicSession(session: PublicSession) {
  if (!session.refreshToken) throw new Error("Session cannot be refreshed");
  const token = await tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
      scope: PUBLIC_SCOPES,
    }),
  );
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + token.expires_in * 1000,
    user: session.user,
  } satisfies PublicSession;
}

export function sessionTokensChanged(
  previous: PublicSession,
  current: PublicSession,
) {
  return (
    previous.accessToken !== current.accessToken ||
    previous.refreshToken !== current.refreshToken ||
    previous.expiresAt !== current.expiresAt
  );
}

export async function currentPublicSession(session: PublicSession) {
  if (session.expiresAt < Date.now() + 30_000) {
    const fingerprint = crypto
      .createHash("sha256")
      .update(session.refreshToken)
      .digest("base64url");
    const active = refreshes.get(fingerprint);
    if (active) return active;
    const refresh = refreshPublicSession(session).finally(() => {
      if (refreshes.get(fingerprint) === refresh) refreshes.delete(fingerprint);
    });
    refreshes.set(fingerprint, refresh);
    return refresh;
  }
  return { ...session, user: await fetchCoreUser(session.accessToken) };
}
