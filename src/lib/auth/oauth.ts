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
  const response = await fetch(`${authOrigin()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: parameters,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`OAuth token request failed (${response.status})`);
  }
  return tokenResponseSchema.parse(await response.json());
}

async function fetchCoreUser(accessToken: string) {
  const response = await fetch(`${authOrigin()}/api/v1/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Core profile request failed (${response.status})`);
  }
  return meResponseSchema.parse(await response.json()).data;
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
  const accessToken = token.access_token;
  const user = await fetchCoreUser(accessToken);
  return {
    accessToken,
    refreshToken: token.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + token.expires_in * 1000,
    user,
  } satisfies PublicSession;
}

export async function currentPublicSession(session: PublicSession) {
  if (session.expiresAt < Date.now() + 30_000) {
    return refreshPublicSession(session);
  }
  return { ...session, user: await fetchCoreUser(session.accessToken) };
}
