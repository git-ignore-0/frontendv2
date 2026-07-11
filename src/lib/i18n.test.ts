import { describe, expect, it } from "vitest";
import {
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
  });
  it("builds metadata alternatives from the locale registry", () => {
    expect(languageAlternates("/about")).toEqual({
      en: "/about/en",
      vi: "/about/vi",
      "x-default": "/about/en",
    });
  });
});
