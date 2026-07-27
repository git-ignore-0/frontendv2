import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { pkceChallenge, safeReturnTo } from "@/lib/auth/oauth";

describe("public OAuth helpers", () => {
  beforeEach(() => {
    process.env.PUBLIC_SITE_ORIGIN = "https://naturalfarmingvietnam.com";
  });

  afterEach(() => {
    delete process.env.PUBLIC_SITE_ORIGIN;
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
});
