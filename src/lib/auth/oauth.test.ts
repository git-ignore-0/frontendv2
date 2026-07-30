import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AuthServiceUnavailableError,
  currentPublicSession,
  pkceChallenge,
  safeReturnTo,
  sessionTokensChanged,
} from "@/lib/auth/oauth";
import type { PublicSession } from "@/lib/auth/session";

describe("public OAuth helpers", () => {
  beforeEach(() => {
    process.env.PUBLIC_SITE_ORIGIN = "https://naturalfarmingvietnam.com";
    process.env.AUTH_ORIGIN = "https://auth.naturalfarmingvietnam.com";
    process.env.PUBLIC_OAUTH_CLIENT_ID = "public-client";
    process.env.PUBLIC_OAUTH_CLIENT_SECRET = "public-secret";
  });

  afterEach(() => {
    delete process.env.PUBLIC_SITE_ORIGIN;
    delete process.env.AUTH_ORIGIN;
    delete process.env.PUBLIC_OAUTH_CLIENT_ID;
    delete process.env.PUBLIC_OAUTH_CLIENT_SECRET;
    vi.unstubAllGlobals();
  });

  it("creates an RFC 7636 S256 challenge", () => {
    expect(pkceChallenge("a".repeat(64))).toBe(
      "_-BU_nrgy23GXDr5th1SCfQ5hR20PQulmXM33xVGaOs",
    );
  });

  it("accepts only local return paths", () => {
    expect(safeReturnTo("/plants/vi?tab=inputs", "/vi")).toBe(
      "/plants/vi?tab=inputs",
    );
    expect(safeReturnTo("//attacker.example/path", "/vi")).toBe("/vi");
    expect(safeReturnTo("https://attacker.example/path", "/vi")).toBe("/vi");
  });
  it("coalesces concurrent rotation of the same refresh token", async () => {
    let releaseTokenRequest: (() => void) | undefined;
    const tokenGate = new Promise<void>((resolve) => {
      releaseTokenRequest = resolve;
    });
    let tokenRequests = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/oauth/token")) {
          tokenRequests += 1;
          await tokenGate;
          return new Response(
            JSON.stringify({
              access_token: "next-access-token",
              refresh_token: "next-refresh-token",
              expires_in: 3600,
              token_type: "Bearer",
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            data: {
              sub: "11111111-1111-4111-8111-111111111111",
              name: "Member",
              email: "member@example.com",
              email_verified: true,
              locale: "vi",
              status: "active",
              roles: [],
            },
          }),
          { status: 200 },
        );
      }),
    );
    const session: PublicSession = {
      accessToken: "old-access-token",
      refreshToken: "one-use-refresh-token",
      expiresAt: Date.now() - 1,
      user: {
        sub: "11111111-1111-4111-8111-111111111111",
        name: "Member",
        email: "member@example.com",
        email_verified: true,
        locale: "vi",
        status: "active",
        roles: [],
      },
    };

    const first = currentPublicSession(session);
    const second = currentPublicSession(session);
    expect(tokenRequests).toBe(1);
    releaseTokenRequest?.();

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult.refreshToken).toBe("next-refresh-token");
    expect(secondResult).toEqual(firstResult);
    expect(tokenRequests).toBe(1);
  });

  it("commits a rotated token without coupling it to a second profile request", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/oauth/token")) {
        return new Response(
          JSON.stringify({
            access_token: "next-access-token",
            refresh_token: "next-refresh-token",
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200 },
        );
      }
      throw new Error("profile endpoint should not be called during rotation");
    });
    vi.stubGlobal("fetch", fetchMock);
    const session: PublicSession = {
      accessToken: "old-access-token",
      refreshToken: "one-use-refresh-token",
      expiresAt: Date.now() - 1,
      user: {
        sub: "11111111-1111-4111-8111-111111111111",
        name: "Member",
        email: "member@example.com",
        email_verified: true,
        locale: "vi",
        status: "active",
        roles: [],
      },
    };

    const current = await currentPublicSession(session);

    expect(current.refreshToken).toBe("next-refresh-token");
    expect(current.user).toEqual(session.user);
    expect(sessionTokensChanged(session, current)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not mark a profile-only refresh as a token rotation", () => {
    const session: PublicSession = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: 123,
      user: {
        sub: "11111111-1111-4111-8111-111111111111",
        name: "Old name",
        email: "member@example.com",
        email_verified: true,
        locale: "vi",
        status: "active",
        roles: [],
      },
    };

    expect(
      sessionTokensChanged(session, {
        ...session,
        user: { ...session.user, name: "Updated name" },
      }),
    ).toBe(false);
  });

  it("classifies Core Auth network failures as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const session: PublicSession = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60_000,
      user: {
        sub: "11111111-1111-4111-8111-111111111111",
        name: "Member",
        email: "member@example.com",
        email_verified: true,
        locale: "vi",
        status: "active",
        roles: [],
      },
    };

    await expect(currentPublicSession(session)).rejects.toBeInstanceOf(
      AuthServiceUnavailableError,
    );
  });
});
