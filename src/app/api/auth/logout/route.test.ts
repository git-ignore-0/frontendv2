import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/config", () => ({
  authOrigin: () => "https://auth.example.test",
  publicSiteOrigin: () => "https://site.example.test",
}));
vi.mock("@/lib/auth/session", () => ({ clearSession: vi.fn() }));

import { POST } from "@/app/api/auth/logout/route";
import { clearSession } from "@/lib/auth/session";

afterEach(() => vi.clearAllMocks());

describe("public logout", () => {
  it("clears the public session before handing logout to Core Auth", async () => {
    const response = await POST(
      logoutRequest("https://site.example.test", "vi"),
    );

    expect(clearSession).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    const location = new URL(response.headers.get("location")!);
    expect(location.origin + location.pathname).toBe(
      "https://auth.example.test/logout/public/",
    );
    expect(location.searchParams.get("locale")).toBe("vi");
    expect(location.searchParams.get("return_to")).toBe(
      "https://site.example.test/vi",
    );
  });

  it("rejects an invalid origin without clearing the session", async () => {
    const response = await POST(
      logoutRequest("https://attacker.example", "en"),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "invalid_origin" });
    expect(clearSession).not.toHaveBeenCalled();
  });
});

function logoutRequest(origin: string, locale: string) {
  return new NextRequest(
    `https://site.example.test/api/auth/logout?locale=${locale}`,
    { method: "POST", headers: { Origin: origin } },
  );
}
