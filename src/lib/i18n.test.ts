import { describe, expect, it } from "vitest";
import {
  isCSASectionPath,
  isLocale,
  languageAlternates,
  localizedPath,
  replacePathLocale,
} from "./i18n";
describe("locale routing", () => {
  it("accepts only supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("vi")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
  it("builds locale paths", () => {
    expect(localizedPath("en")).toBe("/en");
    expect(localizedPath("vi", "/animals")).toBe("/animals/vi");
  });
  it("switches locale without losing the current route", () => {
    expect(replacePathLocale("/en/plants", "vi")).toBe("/plants/vi");
    expect(replacePathLocale("/plants/en", "vi")).toBe("/plants/vi");
    expect(replacePathLocale("/store/en", "vi")).toBe("/store/vi");
    expect(replacePathLocale("/csa/en", "vi")).toBe("/csa/vi");
    expect(replacePathLocale("/en/csa", "vi")).toBe("/csa/vi");
  });
  it.each([
    ["/csa/purchase/vi", "/csa/purchase/en"],
    ["/csa/purchase/vi/", "/csa/purchase/en"],
    ["/csa/track/vi", "/csa/track/en"],
    ["/csa/track/vi/", "/csa/track/en"],
    [
      "/csa/verify/vi?reference=CSA-202609-8F3K2M",
      "/csa/verify/en?reference=CSA-202609-8F3K2M",
    ],
    [
      "/csa/verify/vi/?reference=CSA-202609-8F3K2M",
      "/csa/verify/en?reference=CSA-202609-8F3K2M",
    ],
    ["/store/vi/", "/store/en"],
    ["/account/vi/rewards/", "/account/en/rewards"],
  ])(
    "normalizes trailing slashes and preserves route suffix in %s",
    (from, to) => {
      expect(replacePathLocale(from, "en")).toBe(to);
      expect(replacePathLocale(from, "en")).not.toContain("//");
    },
  );
  it("recognizes only the supported localized CSA section routes", () => {
    for (const route of [
      "/csa/en",
      "/csa/vi/",
      "/csa/purchase/en",
      "/csa/track/vi/",
      "/csa/verify/en?reference=CSA-202609-8F3K2M",
    ]) {
      expect(isCSASectionPath(route)).toBe(true);
    }
    for (const route of [
      "/csa/purchase/en/extra",
      "/csa/other/en",
      "/csa-other/en",
      "/csa/purchase/french",
    ]) {
      expect(isCSASectionPath(route)).toBe(false);
    }
  });
  it("switches the embedded locale in nested account routes", () => {
    expect(replacePathLocale("/account/vi/rewards", "en")).toBe(
      "/account/en/rewards",
    );
    expect(replacePathLocale("/account/vi/referral", "en")).toBe(
      "/account/en/referral",
    );
    expect(
      replacePathLocale(
        "/account/vi/redemptions/22222222-2222-4222-8222-222222222222",
        "en",
      ),
    ).toBe("/account/en/redemptions/22222222-2222-4222-8222-222222222222");
  });
  it("builds metadata alternatives from the locale registry", () => {
    expect(languageAlternates("/about")).toEqual({
      en: "/about/en",
      vi: "/about/vi",
      "x-default": "/about/en",
    });
  });
});
