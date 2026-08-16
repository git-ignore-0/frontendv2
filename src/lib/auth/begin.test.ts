import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authFlow = vi.hoisted(() => ({ write: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({
  writeOAuthFlow: authFlow.write,
}));

import { GET as login } from "@/app/api/auth/login/route";
import { GET as register } from "@/app/api/auth/register/route";
import { pkceChallenge, PUBLIC_SCOPES } from "@/lib/auth/oauth";
import type { OAuthFlow } from "@/lib/auth/session";

const authOrigin = "https://auth.naturalfarmingvietnam.com";
const publicOrigin = "https://www.naturalfarmingvietnam.com";

function request(path: string) {
  return new NextRequest(`${publicOrigin}${path}`);
}

function writtenFlow() {
  return authFlow.write.mock.calls[0][0] as OAuthFlow;
}

function authorizeUrl(response: Response) {
  return new URL(response.headers.get("location")!);
}

describe("begin public OAuth", () => {
  beforeEach(() => {
    process.env.AUTH_ORIGIN = authOrigin;
    process.env.PUBLIC_SITE_ORIGIN = publicOrigin;
    process.env.PUBLIC_OAUTH_CLIENT_ID = "public-client";
    authFlow.write.mockReset();
  });

  afterEach(() => {
    delete process.env.AUTH_ORIGIN;
    delete process.env.PUBLIC_SITE_ORIGIN;
    delete process.env.PUBLIC_OAUTH_CLIENT_ID;
  });

  it("starts a clean signup and ignores forged referral query parameters", async () => {
    const response = await register(
      request(
        "/api/auth/register?locale=vi&returnTo=%2Faccount%2Fvi%2Freferral&ref=FORGED2345&referral_code=FORGED6789&code=FORGED9999",
      ),
    );
    const authorize = authorizeUrl(response);
    const flow = writtenFlow();

    expect(response.status).toBe(307);
    expect(authorize.origin).toBe(authOrigin);
    expect(authorize.pathname).toBe("/oauth/authorize");
    expect(authorize.searchParams.has("referral_code")).toBe(false);
    expect(authorize.searchParams.get("screen_hint")).toBe("signup");
    expect(authorize.searchParams.get("scope")).toBe(PUBLIC_SCOPES);
    expect(authorize.searchParams.get("response_type")).toBe("code");
    expect(authorize.searchParams.get("client_id")).toBe("public-client");
    expect(authorize.searchParams.get("redirect_uri")).toBe(
      `${publicOrigin}/api/auth/callback`,
    );
    expect(authorize.searchParams.get("state")).toBe(flow.state);
    expect(authorize.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authorize.searchParams.get("code_challenge")).toBe(
      pkceChallenge(flow.verifier),
    );
    expect(flow).toMatchObject({
      locale: "vi",
      returnTo: "/account/vi/referral",
    });
    expect(flow).not.toHaveProperty("referralCode");
    expect(authorize.href).not.toContain("FORGED");
  });

  it("never sends a referral code during login", async () => {
    const response = await login(
      request(
        "/api/auth/login?locale=vi&returnTo=%2Fvi&referral_code=FORGED6789",
      ),
    );
    const authorize = authorizeUrl(response);
    const flow = writtenFlow();

    expect(authorize.searchParams.has("referral_code")).toBe(false);
    expect(authorize.searchParams.has("screen_hint")).toBe(false);
    expect(flow).not.toHaveProperty("referralCode");
    expect(flow).toMatchObject({ locale: "vi", returnTo: "/vi" });
  });
});
