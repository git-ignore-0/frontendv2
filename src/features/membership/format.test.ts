import { describe, expect, it } from "vitest";
import { formatMembershipUnits } from "./format";

describe("fractional CSA units", () => {
  it("multiplies decimal quota balances exactly without falling back to an expression", () => {
    expect(formatMembershipUnits("1.000", 9.75, "en")).toBe("9.75");
    expect(formatMembershipUnits("0.250", 0.5, "vi")).toBe("0,125");
    expect(formatMembershipUnits("0.100", 0.1, "en")).toBe("0.01");
    expect(formatMembershipUnits("1.000", 10, "en")).toBe("10");
  });
  it("does not silently round malformed quota values", () => {
    for (const value of [0.001, NaN, Infinity])
      expect(formatMembershipUnits("1.000", value, "en")).toBe(
        `${value} × 1.000`,
      );
  });
});
