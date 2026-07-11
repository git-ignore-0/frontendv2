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
    expect(localizedPath("vi", "/animals")).toBe("/vi/animals");
  });
  it("switches locale without losing the current route", () => {
    expect(replacePathLocale("/en/plants", "vi")).toBe("/vi/plants");
  });
  it("builds metadata alternatives from the locale registry", () => {
    expect(languageAlternates("/about")).toEqual({
      en: "/en/about",
      vi: "/vi/about",
      "x-default": "/en/about",
    });
  });
});
