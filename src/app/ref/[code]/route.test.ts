import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  readSession: vi.fn(),
  writeOAuthFlow: vi.fn(),
}));

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    readSession: auth.readSession,
    writeOAuthFlow: auth.writeOAuthFlow,
  };
});

import { GET } from "@/app/ref/[code]/route";
import type { OAuthFlow } from "@/lib/auth/session";

const authOrigin = "https://auth.naturalfarmingvietnam.com";
const publicOrigin = "https://www.naturalfarmingvietnam.com";

function request(code: string, locale?: string) {
  const url = new URL(`/ref/${code}`, publicOrigin);
  if (locale !== undefined) url.searchParams.set("locale", locale);
  return GET(new NextRequest(url), { params: Promise.resolve({ code }) });
}

function writtenFlow() {
  return auth.writeOAuthFlow.mock.calls[0][0] as OAuthFlow;
}

describe("public referral capture route", () => {
  beforeEach(() => {
    process.env.AUTH_ORIGIN = authOrigin;
    process.env.PUBLIC_SITE_ORIGIN = publicOrigin;
    process.env.PUBLIC_OAUTH_CLIENT_ID = "public-client";
    auth.readSession.mockReset();
    auth.writeOAuthFlow.mockReset();
  });

  afterEach(() => {
    delete process.env.AUTH_ORIGIN;
    delete process.env.PUBLIC_SITE_ORIGIN;
    delete process.env.PUBLIC_OAUTH_CLIENT_ID;
  });

  it("starts a referred signup OAuth flow directly for an anonymous visitor", async () => {
    auth.readSession.mockResolvedValue(null);

    const response = await request("nfv2345678", "vi");
    const authorize = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(authorize.origin).toBe(authOrigin);
    expect(authorize.pathname).toBe("/oauth/authorize");
    expect(authorize.searchParams.get("screen_hint")).toBe("signup");
    expect(authorize.searchParams.get("referral_code")).toBe("NFV2345678");
    expect(authorize.searchParams.get("ui_locales")).toBe("vi");
    expect(authorize.searchParams.get("scope")).toBe("profile email");
    expect(writtenFlow()).toMatchObject({
      locale: "vi",
      referralCode: "NFV2345678",
      returnTo: "/account/vi/referral",
    });
  });

  it("keeps ref context for a signed-in visitor without starting OAuth", async () => {
    auth.readSession.mockResolvedValue({ accessToken: "sealed-session" });

    const response = await request("nfv2345678", "vi");

    expect(response.headers.get("location")).toBe(
      `${publicOrigin}/account/vi/referral?ref=NFV2345678`,
    );
    expect(auth.writeOAuthFlow).not.toHaveBeenCalled();
  });

  it("redirects invalid input home without creating an OAuth flow", async () => {
    const response = await request("NFV23456I8", "vi");

    expect(response.headers.get("location")).toBe(`${publicOrigin}/vi`);
    expect(auth.readSession).not.toHaveBeenCalled();
    expect(auth.writeOAuthFlow).not.toHaveBeenCalled();
  });

  it.each([
    ["unsupported locale", "fr"],
    ["missing locale", undefined],
  ])("falls back to English for %s", async (_, locale) => {
    auth.readSession.mockResolvedValue(null);

    const response = await request("NFV2345678", locale);
    const authorize = new URL(response.headers.get("location")!);

    expect(authorize.searchParams.get("ui_locales")).toBe("en");
    expect(writtenFlow()).toMatchObject({
      locale: "en",
      referralCode: "NFV2345678",
      returnTo: "/account/en/referral",
    });
  });
});
