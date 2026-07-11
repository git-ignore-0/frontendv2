import { describe, expect, it } from "vitest";
import { isLocale, localizedPath } from "./i18n";
describe("locale routing", () => {
  it("accepts only supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("vi")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
  it("builds locale paths", () => {
    expect(localizedPath("en")).toBe("/en");
    expect(localizedPath("vi", "/animals")).toBe("/vi/animals");
  });
});
