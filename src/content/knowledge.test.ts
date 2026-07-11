import { describe, expect, it } from "vitest";
import { plantInputs } from "./knowledge";
describe("knowledge inventory", () => {
  it("retains all eight plant inputs in both languages", () => {
    expect(plantInputs).toHaveLength(8);
    for (const item of plantInputs) {
      expect(item.en.name).toBeTruthy();
      expect(item.vi.name).toBeTruthy();
    }
  });
});
