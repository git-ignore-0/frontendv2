import { describe, expect, it } from "vitest";

import { workshopCopy } from "./copy";

describe("workshop list copy", () => {
  it("uses the compact localized hero title", () => {
    expect(workshopCopy.vi.title).toBe("Workshop");
    expect(workshopCopy.en.title).toBe("Workshops");
  });

  it("pluralizes the English workshop count", () => {
    expect(workshopCopy.en.workshopCount(1)).toBe("1 workshop");
    expect(workshopCopy.en.workshopCount(2)).toBe("2 workshops");
    expect(workshopCopy.vi.workshopCount(2)).toBe("2 buổi");
  });
});
