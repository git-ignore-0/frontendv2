import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/config", () => ({
  publicSiteOrigin: () => "https://site.example.test",
}));
vi.mock("@/lib/auth/oauth", () => ({ exchangeCode: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  clearSession: vi.fn(),
  consumeOAuthFlow: vi.fn(),
  writeSession: vi.fn(),
}));
import { GET } from "@/app/api/auth/callback/route";
import { exchangeCode } from "@/lib/auth/oauth";
import { consumeOAuthFlow, writeSession } from "@/lib/auth/session";

const baseFlow = {
  state: "state",
  verifier: "verifier",
  returnTo: "/account/en/referral",
  locale: "en" as const,
};

afterEach(() => vi.clearAllMocks());

describe("OAuth callback", () => {
  it("accepts an OAuth flow carrying a referral code", async () => {
    vi.mocked(consumeOAuthFlow).mockResolvedValue({
      ...baseFlow,
      referralCode: "NFV2345678",
    });
    vi.mocked(exchangeCode).mockResolvedValue(sessionPayload);

    const response = await GET(callbackRequest());

    expect(writeSession).toHaveBeenCalledWith(sessionPayload);
    expect(response.headers.get("location")).toBe(
      "https://site.example.test/account/en/referral",
    );
  });

  it("accepts a legacy flow and handles a failed exchange", async () => {
    vi.mocked(consumeOAuthFlow).mockResolvedValueOnce(baseFlow);
    vi.mocked(exchangeCode).mockResolvedValueOnce(sessionPayload);
    await GET(callbackRequest());
    expect(writeSession).toHaveBeenCalledWith(sessionPayload);

    vi.mocked(consumeOAuthFlow).mockResolvedValueOnce({
      ...baseFlow,
      referralCode: "NFV2345678",
    });
    vi.mocked(exchangeCode).mockRejectedValueOnce(new Error("exchange failed"));
    const response = await GET(callbackRequest());
    expect(response.headers.get("location")).toBe(
      "https://site.example.test/en?auth=oauth",
    );
  });
});

const sessionPayload = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: Date.now() + 60_000,
  user: {
    email: "member@example.test",
    email_verified: true as const,
    locale: "en" as const,
    name: "Member",
    roles: ["member"],
    status: "active" as const,
    sub: "member-id",
  },
};

function callbackRequest() {
  return new NextRequest(
    "https://site.example.test/api/auth/callback?code=code&state=state",
  );
}
