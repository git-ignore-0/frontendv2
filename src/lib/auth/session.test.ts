import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import {
  consumeOAuthFlow,
  OAUTH_FLOW_COOKIE,
  seal,
  unseal,
  writeOAuthFlow,
} from "@/lib/auth/session";

describe("public session encryption", () => {
  beforeEach(() => {
    process.env.PUBLIC_SESSION_SECRET =
      "a-secure-test-secret-that-is-long-enough";
    cookieStore.delete.mockReset();
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
  });

  afterEach(() => {
    delete process.env.PUBLIC_SESSION_SECRET;
  });

  it("round-trips authenticated ciphertext", () => {
    const encrypted = seal({ user: "member", accessToken: "secret" });
    expect(encrypted).not.toContain("secret");
    expect(unseal(encrypted)).toEqual({
      user: "member",
      accessToken: "secret",
    });
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = seal({ user: "member" });
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("a") ? "b" : "a"}`;
    expect(unseal(tampered)).toBeNull();
  });

  it("seals the referral code into a signup OAuth flow", async () => {
    const flow = {
      state: "state",
      verifier: "verifier",
      returnTo: "/account/en/referral",
      locale: "en" as const,
      referralCode: "NFV2345678",
    };

    await writeOAuthFlow(flow);

    const [name, value] = cookieStore.set.mock.calls[0];
    expect(name).toBe(OAUTH_FLOW_COOKIE);
    expect(value).not.toContain(flow.referralCode);
    expect(unseal(value)).toEqual(flow);
  });

  it("consumes an OAuth flow sealed before referralCode was added", async () => {
    const legacyFlow = {
      state: "legacy-state",
      verifier: "legacy-verifier",
      returnTo: "/en",
      locale: "en" as const,
    };
    cookieStore.get.mockReturnValue({ value: seal(legacyFlow) });

    await expect(consumeOAuthFlow()).resolves.toEqual(legacyFlow);
    expect(cookieStore.delete).toHaveBeenCalledWith(OAUTH_FLOW_COOKIE);
  });
});
