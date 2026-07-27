import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { seal, unseal } from "@/lib/auth/session";

describe("public session encryption", () => {
  beforeEach(() => {
    process.env.PUBLIC_SESSION_SECRET =
      "a-secure-test-secret-that-is-long-enough";
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
});
