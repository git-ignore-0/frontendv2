import { describe, expect, it } from "vitest";
import { animalSections, plantInputs } from "./knowledge";

describe("typed knowledge content", () => {
  it("keeps all eight core plant inputs with unique anchors", () => {
    expect(plantInputs).toHaveLength(8);
    expect(new Set(plantInputs.map((item) => item.id)).size).toBe(8);
    expect(plantInputs.map((item) => item.shortName)).toEqual([
      "IMO",
      "LAB",
      "OHN",
      "FPJ",
      "FFJ",
      "FAA",
      "WCA",
      "WCAP",
    ]);
  });

  it("provides actionable animal sections without empty guidance", () => {
    expect(animalSections.length).toBeGreaterThanOrEqual(5);
    for (const section of animalSections) {
      expect(section.points.length).toBeGreaterThanOrEqual(2);
    }
  });
});
