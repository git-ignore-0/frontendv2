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
  const membershipId = "44444444-4444-4444-8444-444444444444";
  const versionId = "77777777-7777-4777-8777-777777777777";

  it("forwards owned Membership contract detail with the server-side bearer token", async () => {
    const upstream = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        expect(String(input)).toBe(
          `https://auth.example.test/api/v1/memberships/${membershipId}/contract`,
        );
        expect(new Headers(init?.headers).get("authorization")).toBe(
          "Bearer access-token",
        );
        return Response.json({ data: { reference_code: "CSA-202609-8F3K2M" } });
      },
    );
    vi.stubGlobal("fetch", upstream);
    const response = await GET(
      new NextRequest(
        `https://site.example.test/api/account/memberships/${membershipId}/contract`,
      ),
      {
        params: Promise.resolve({
          path: ["memberships", membershipId, "contract"],
        }),
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(upstream).toHaveBeenCalledOnce();
  });

  it("preserves ownership 404s without exposing a fallback contract route", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "not_found" }, { status: 404 }),
        ),
    );
    const response = await GET(
      new NextRequest(
        `https://site.example.test/api/account/memberships/${membershipId}/contract`,
      ),
      {
        params: Promise.resolve({
          path: ["memberships", membershipId, "contract"],
        }),
      },
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });

  it("requires an authenticated owner before forwarding Membership contract access", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    vi.mocked(readSession).mockResolvedValueOnce(null);
    const response = await GET(
      new NextRequest(
        `https://site.example.test/api/account/memberships/${membershipId}/contract`,
      ),
      {
        params: Promise.resolve({
          path: ["memberships", membershipId, "contract"],
        }),
      },
    );
    expect(response.status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects query parameters on Membership contract detail", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await GET(
      new NextRequest(
        `https://site.example.test/api/account/memberships/${membershipId}/contract?guest_token=secret`,
      ),
      {
        params: Promise.resolve({
          path: ["memberships", membershipId, "contract"],
        }),
      },
    );
    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each(["vi", "en"])(
    "streams the owned %s contract PDF with safe headers",
    async (locale) => {
      const bytes = new Uint8Array([37, 80, 68, 70]);
      const upstream = vi.fn(
        async (input: string | URL | Request, init?: RequestInit) => {
          expect(String(input)).toBe(
            `https://auth.example.test/api/v1/memberships/${membershipId}/contract/pdf?locale=${locale}`,
          );
          expect(new Headers(init?.headers).get("authorization")).toBe(
            "Bearer access-token",
          );
          return new Response(bytes, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="contract.${locale}.pdf"`,
              "X-Content-Type-Options": "nosniff",
            },
          });
        },
      );
      vi.stubGlobal("fetch", upstream);
      const response = await GET(
        new NextRequest(
          `https://site.example.test/api/account/memberships/${membershipId}/contract/pdf?locale=${locale}`,
        ),
        {
          params: Promise.resolve({
            path: ["memberships", membershipId, "contract", "pdf"],
          }),
        },
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/pdf");
      expect(response.headers.get("content-disposition")).toContain(
        `contract.${locale}.pdf`,
      );
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([
        37, 80, 68, 70,
      ]);
    },
  );

  it("forwards an owned version PDF with only the server-side bearer token", async () => {
    const upstream = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        expect(String(input)).toBe(
          `https://auth.example.test/api/v1/memberships/${membershipId}/contract/pdf?locale=en&version_id=${versionId}`,
        );
        expect(new Headers(init?.headers).get("authorization")).toBe(
          "Bearer access-token",
        );
        return new Response(new Uint8Array([37, 80, 68, 70]), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="CSA-CODE.v1.en.pdf"',
          },
        });
      },
    );
    vi.stubGlobal("fetch", upstream);
    const response = await GET(
      new NextRequest(
        `https://site.example.test/api/account/memberships/${membershipId}/contract/pdf?locale=en&version_id=${versionId}`,
      ),
      {
        params: Promise.resolve({
          path: ["memberships", membershipId, "contract", "pdf"],
        }),
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(
      "CSA-CODE.v1.en.pdf",
    );
    expect(response.headers.get("authorization")).toBeNull();

    upstream.mockResolvedValueOnce(
      Response.json({ error: "not_found" }, { status: 404 }),
    );
    const denied = await GET(
      new NextRequest(
        `https://site.example.test/api/account/memberships/${membershipId}/contract/pdf?locale=en&version_id=${versionId}`,
      ),
      {
        params: Promise.resolve({
          path: ["memberships", membershipId, "contract", "pdf"],
        }),
      },
    );
    expect(denied.status).toBe(404);
  });

  it.each([
    "",
    "?locale=fr",
    "?locale=vi&original=true",
    "?locale=vi&locale=en",
    "?locale=vi&version_id=bad",
    `?locale=vi&version_id=${versionId}&original=true`,
    `?locale=vi&version_id=${versionId}&version_id=${versionId}`,
  ])("rejects an unsafe owned contract PDF query: %s", async (query) => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await GET(
      new NextRequest(
        `https://site.example.test/api/account/memberships/${membershipId}/contract/pdf${query}`,
      ),
      {
        params: Promise.resolve({
          path: ["memberships", membershipId, "contract", "pdf"],
        }),
      },
    );
    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("forwards only the contract reference query without OAuth or cookies", async () => {
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        expect(String(input)).toBe(
          "https://auth.example.test/api/v1/public/csa-contracts/verify?reference_code=CSA-202609-8F3K2M",
        );
        const headers = new Headers(init?.headers);
        expect(headers.has("authorization")).toBe(false);
        expect(headers.has("cookie")).toBe(false);
        return Response.json({
          data: { reference_code: "CSA-202609-8F3K2M", status: "active" },
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new NextRequest(
        "https://site.example.test/api/account/csa-contracts/verify?reference_code=CSA-202609-8F3K2M",
        { headers: { Cookie: "oauth_cookie=do-not-forward" } },
      ),
      { params: Promise.resolve({ path: ["csa-contracts", "verify"] }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(readSession).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    "",
    "?reference_code=",
    "?reference_code=CSA-202609-8F3K2M&phone=0901234567",
    "?reference_code=CSA-202609-8F3K2M&reference_code=CSA-202609-AAAAAA",
    "?reference=CSA-202609-8F3K2M",
  ])(
    "rejects a verification query outside the exact contract: %s",
    async (query) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const response = await GET(
        new NextRequest(
          `https://site.example.test/api/account/csa-contracts/verify${query}`,
        ),
        { params: Promise.resolve({ path: ["csa-contracts", "verify"] }) },
      );

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("forwards only the tracker cookie and rewrites its HttpOnly cookie path", async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("cookie")).toBe("nfv_csa_tracker=opaque-value");
        expect(headers.has("authorization")).toBe(false);
        const upstream = Response.json({ data: { status: "pending" } });
        upstream.headers.append(
          "Set-Cookie",
          "nfv_csa_tracker=replaced; Path=/api/v1/public/csa-contract-tracker; Max-Age=600; HttpOnly; Secure; SameSite=Lax",
        );
        upstream.headers.append(
          "Set-Cookie",
          "unrelated_cookie=secret; Path=/; HttpOnly",
        );
        return upstream;
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new NextRequest(
        "https://site.example.test/api/account/csa-contract-tracker/lookup",
        {
          method: "POST",
          headers: {
            Cookie: "nfv_csa_tracker=opaque-value; oauth_cookie=do-not-forward",
            "Content-Type": "application/json",
            Origin: "https://site.example.test",
            "X-NFV-Public-Request": "1",
          },
          body: JSON.stringify({
            reference_code: "CSA-ABC123",
            phone: "+84901234567",
          }),
        },
      ),
      {
        params: Promise.resolve({
          path: ["csa-contract-tracker", "lookup"],
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(readSession).not.toHaveBeenCalled();
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("Path=/api/account/csa-contract-tracker");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).not.toContain("unrelated_cookie");
    expect(await response.json()).toEqual({ data: { status: "pending" } });
  });

  it("streams tracker PDFs with download and no-store headers", async () => {
    const bytes = new Uint8Array([37, 80, 68, 70]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        expect(new Headers(init?.headers).get("cookie")).toBe(
          "nfv_csa_tracker=opaque-value",
        );
        return new Response(bytes, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="CSA-ABC.vi.pdf"',
            "Cache-Control": "private, no-store",
            Pragma: "no-cache",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }),
    );

    const response = await GET(
      new NextRequest(
        "https://site.example.test/api/account/csa-contract-tracker/contract/pdf?locale=vi",
        { headers: { Cookie: "nfv_csa_tracker=opaque-value" } },
      ),
      {
        params: Promise.resolve({
          path: ["csa-contract-tracker", "contract", "pdf"],
        }),
      },
    );

    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(
      "CSA-ABC.vi.pdf",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([
      37, 80, 68, 70,
    ]);
    expect(readSession).not.toHaveBeenCalled();
  });

  it("forwards only the tracker cookie for a version PDF", async () => {
    const upstream = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        expect(String(input)).toBe(
          `https://auth.example.test/api/v1/public/csa-contract-tracker/contract/pdf?locale=vi&version_id=${versionId}`,
        );
        const headers = new Headers(init?.headers);
        expect(headers.get("cookie")).toBe("nfv_csa_tracker=opaque-value");
        expect(headers.has("authorization")).toBe(false);
        return new Response(new Uint8Array([37, 80, 68, 70]), {
          headers: { "Content-Type": "application/pdf" },
        });
      },
    );
    vi.stubGlobal("fetch", upstream);
    const response = await GET(
      new NextRequest(
        `https://site.example.test/api/account/csa-contract-tracker/contract/pdf?locale=vi&version_id=${versionId}`,
        { headers: { Cookie: "nfv_csa_tracker=opaque-value" } },
      ),
      {
        params: Promise.resolve({
          path: ["csa-contract-tracker", "contract", "pdf"],
        }),
      },
    );
    expect(response.status).toBe(200);
    expect(readSession).not.toHaveBeenCalled();
    expect(response.headers.get("authorization")).toBeNull();
  });

  it("rejects tracker query parameters outside the fixed contract", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const invalidLocale = await GET(
      new NextRequest(
        "https://site.example.test/api/account/csa-contract-tracker/contract/pdf?locale=fr",
      ),
      {
        params: Promise.resolve({
          path: ["csa-contract-tracker", "contract", "pdf"],
        }),
      },
    );
    expect(invalidLocale.status).toBe(400);
    expect(await invalidLocale.json()).toEqual({
      error: "invalid_contract_locale",
    });

    for (const query of [
      "?locale=vi&version_id=bad",
      `?locale=vi&version_id=${versionId}&original=true`,
      `?locale=vi&version_id=${versionId}&version_id=${versionId}`,
    ]) {
      const blocked = await GET(
        new NextRequest(
          `https://site.example.test/api/account/csa-contract-tracker/contract/pdf${query}`,
        ),
        {
          params: Promise.resolve({
            path: ["csa-contract-tracker", "contract", "pdf"],
          }),
        },
      );
      expect(blocked.status).toBe(400);
    }

    const arbitraryContractQuery = await GET(
      new NextRequest(
        "https://site.example.test/api/account/csa-contract-tracker/contract?request_id=secret",
      ),
      {
        params: Promise.resolve({
          path: ["csa-contract-tracker", "contract"],
        }),
      },
    );
    expect(arbitraryContractQuery.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

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

  it("supports guest purchase requests while forwarding administrative-unit locale", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        async (_input: string | URL | Request, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          expect(headers.get("accept-language")).toBe("vi");
          expect(headers.has("authorization")).toBe(false);
          return Response.json({ data: [] });
        },
      )
      .mockImplementationOnce(
        async (_input: string | URL | Request, init?: RequestInit) => {
          expect(new Headers(init?.headers).has("authorization")).toBe(false);
          return Response.json({ data: { id: "request-id" } }, { status: 201 });
        },
      );
    vi.stubGlobal("fetch", fetchMock);

    const provinces = await GET(
      new NextRequest(
        "https://site.example.test/api/account/administrative-provinces",
        { headers: { "Accept-Language": "vi" } },
      ),
      { params: Promise.resolve({ path: ["administrative-provinces"] }) },
    );
    expect(provinces.status).toBe(200);

    vi.mocked(readSession).mockResolvedValueOnce(null);
    const purchase = await POST(
      new NextRequest(
        "https://site.example.test/api/account/csa-purchase-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://site.example.test",
            "X-NFV-Public-Request": "1",
          },
          body: JSON.stringify({ package_id: "package-id" }),
        },
      ),
      { params: Promise.resolve({ path: ["csa-purchase-requests"] }) },
    );
    expect(purchase.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("adds the server-side bearer token to authenticated purchase requests", async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        expect(new Headers(init?.headers).get("authorization")).toBe(
          "Bearer access-token",
        );
        return Response.json({ data: { id: "request-id" } }, { status: 201 });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new NextRequest(
        "https://site.example.test/api/account/csa-purchase-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://site.example.test",
            "X-NFV-Public-Request": "1",
          },
          body: JSON.stringify({ package_id: "package-id" }),
        },
      ),
      { params: Promise.resolve({ path: ["csa-purchase-requests"] }) },
    );

    expect(response.status).toBe(201);
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
