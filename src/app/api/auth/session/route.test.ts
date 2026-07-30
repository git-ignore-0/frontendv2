import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/oauth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/oauth")>();
  return {
    ...actual,
    currentPublicSession: vi.fn(async (session) => ({
      ...session,
      user: { ...session.user, name: "Updated name" },
    })),
  };
});
vi.mock("@/lib/auth/session", () => ({
  clearSession: vi.fn(),
  readSession: vi.fn(async () => ({
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
  })),
  writeSession: vi.fn(),
}));

import { GET } from "@/app/api/auth/session/route";
import {
  AuthServiceUnavailableError,
  currentPublicSession,
} from "@/lib/auth/oauth";
import { clearSession, writeSession } from "@/lib/auth/session";

afterEach(() => {
  vi.clearAllMocks();
});

describe("public session endpoint", () => {
  it("does not rewrite a non-rotated token cookie with a stale response", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect((await response.json()).data.user.name).toBe("Updated name");
    expect(writeSession).not.toHaveBeenCalled();
  });

  it("preserves the cookie when Core Auth is temporarily unavailable", async () => {
    vi.mocked(currentPublicSession).mockRejectedValueOnce(
      new AuthServiceUnavailableError("offline"),
    );

    const response = await GET();

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(clearSession).not.toHaveBeenCalled();
    expect(writeSession).not.toHaveBeenCalled();
  });
});
