import { describe, expect, it } from "vitest";

import { normalizePhoneNumber, phoneHref } from "./contact";

describe("public phone number", () => {
  it("creates a call link directly from the formatted display number", () => {
    expect(normalizePhoneNumber("+84 97 151 91 85")).toBe("+84971519185");
    expect(phoneHref("+84 97 151 91 85")).toBe("tel:+84971519185");
  });

  it("does not create a call link from incomplete text", () => {
    expect(phoneHref("call us")).toBe("");
  });
});
