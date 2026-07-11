import { describe, expect, it } from "vitest";
import { plantInputs } from "./knowledge";
import { locales } from "@/lib/i18n";
describe("knowledge inventory", () => {
  it("retains all eight plant inputs in every configured locale", () => {
    expect(plantInputs).toHaveLength(8);
    for (const item of plantInputs) {
      for (const locale of locales) {
        expect(item[locale].name).toBeTruthy();
        expect(item[locale].summary).toBeTruthy();
      }
    }
  });
});
