import { describe, expect, it } from "vitest";

import { formatWorkshopDate } from "./format";

describe("formatWorkshopDate", () => {
  it("shows one date for a same-day workshop", () => {
    const result = formatWorkshopDate(
      "2026-07-20T02:00:00.000Z",
      "2026-07-20T07:00:00.000Z",
      "Asia/Ho_Chi_Minh",
      "vi",
    );

    expect(result).not.toContain(" – ");
  });

  it("shows both dates when a workshop spans multiple local days", () => {
    const result = formatWorkshopDate(
      "2026-07-20T02:00:00.000Z",
      "2026-07-22T10:00:00.000Z",
      "Asia/Ho_Chi_Minh",
      "vi",
    );

    expect(result).toContain("20");
    expect(result).toContain("22");
    expect(result).toContain(" – ");
  });
});
