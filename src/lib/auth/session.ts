import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

import { sessionSecret } from "@/lib/auth/config";
import type { CoreUser } from "@/lib/auth/schemas";
import type { Locale } from "@/lib/i18n";

export const SESSION_COOKIE = "nfv_public_session";
export const OAUTH_FLOW_COOKIE = "nfv_public_oauth_flow";

export type PublicSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: CoreUser;
};

export type OAuthFlow = {
  state: string;
  verifier: string;
  returnTo: string;
  locale: Locale;
};

function key() {
  return crypto.createHash("sha256").update(sessionSecret()).digest();
}

export function seal(value: object) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function unseal<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    const payload = Buffer.from(value, "base64url");
    if (payload.length < 29) return null;
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
        "utf8",
      ),
    ) as T;
  } catch {
    return null;
  }
}

const secureCookie = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: secureCookie,
  sameSite: "lax" as const,
  path: "/",
};

export async function readSession() {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return value ? unseal<PublicSession>(value) : null;
}

export async function writeSession(session: PublicSession) {
  const store = await cookies();
  store.set(SESSION_COOKIE, seal(session), {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(OAUTH_FLOW_COOKIE);
}

export async function writeOAuthFlow(flow: OAuthFlow) {
  const store = await cookies();
  store.set(OAUTH_FLOW_COOKIE, seal(flow), {
    ...cookieOptions,
    maxAge: 600,
  });
}

export async function consumeOAuthFlow() {
  const store = await cookies();
  const value = store.get(OAUTH_FLOW_COOKIE)?.value;
  const flow = value ? unseal<OAuthFlow>(value) : null;
  store.delete(OAUTH_FLOW_COOKIE);
  return flow;
}
