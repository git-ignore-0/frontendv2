import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/config", () => ({
  authOrigin: () => "https://auth.example.test",
  publicSiteOrigin: () => "https://site.example.test",
}));
vi.mock("@/lib/auth/oauth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/oauth")>();
  return {
    ...actual,
    currentPublicSession: vi.fn(async (session) => session),
  };
});
vi.mock("@/lib/auth/session", () => ({
  clearSession: vi.fn(),
  readSession: vi.fn(async () => ({
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60_000,
    user: {},
  })),
  writeSession: vi.fn(),
}));
import { GET, POST } from "@/app/api/account/[...path]/route";
import { readSession, writeSession } from "@/lib/auth/session";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("account BFF proxy", () => {
  it("returns a retryable timeout instead of leaving requests pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")),
    );

    const response = await GET(
      new NextRequest("https://site.example.test/api/account/account"),
      { params: Promise.resolve({ path: ["account"] }) },
    );

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: "upstream_timeout" });
    expect(writeSession).not.toHaveBeenCalled();
  });

  it("proxies the public reward catalog without reading an OAuth session", async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        expect(new Headers(init?.headers).has("authorization")).toBe(false);
        return Response.json({
          data: [],
          meta: { page: 1, page_size: 30, total: 0 },
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new NextRequest(
        "https://site.example.test/api/account/rewards?locale=vi&page=1",
      ),
      { params: Promise.resolve({ path: ["rewards"] }) },
    );

    expect(response.status).toBe(200);
    expect(readSession).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("keeps package discovery public but requires a session for Membership data", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [],
        meta: { page: 1, page_size: 30, total: 0 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const packages = await GET(
      new NextRequest(
        "https://site.example.test/api/account/membership-packages?page=1",
      ),
      { params: Promise.resolve({ path: ["membership-packages"] }) },
    );
    expect(packages.status).toBe(200);
    expect(readSession).not.toHaveBeenCalled();

    vi.mocked(readSession).mockResolvedValueOnce(null);
    const current = await GET(
      new NextRequest(
        "https://site.example.test/api/account/memberships/current",
      ),
      { params: Promise.resolve({ path: ["memberships", "current"] }) },
    );
    expect(current.status).toBe(401);
    expect(await current.json()).toEqual({ error: "unauthorized" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("proxies successful and rejected submit-code responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ data: summaryResponse }))
        .mockResolvedValueOnce(
          Response.json({ error: "invalid_referral_code" }, { status: 400 }),
        ),
    );
    const context = {
      params: Promise.resolve({ path: ["submit-code"] }),
    };

    const successful = await POST(submitCodeRequest(), context);
    expect(successful.status).toBe(200);

    const failed = await POST(submitCodeRequest(), context);
    expect(failed.status).toBe(400);
  });
});

const summaryResponse = {
  referral_code: "NFV2345678",
  referrer: { id: "2", name: "Referrer" },
  can_submit_referral_code: false,
  points_balance: 0,
  invited_count: 0,
};

function submitCodeRequest() {
  return new NextRequest("https://site.example.test/api/account/submit-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://site.example.test",
      "X-NFV-Public-Request": "1",
    },
    body: JSON.stringify({ code: "NFV2345678" }),
  });
}
