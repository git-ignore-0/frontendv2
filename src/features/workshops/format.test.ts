import { describe, expect, it } from "vitest";

import {
  formatWorkshopDate,
  formatWorkshopDateTile,
  formatWorkshopMonthGroup,
} from "./format";

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

describe("formatWorkshopDateTile", () => {
  it("uses the event timezone for the local day and month", () => {
    const result = formatWorkshopDateTile(
      "2026-08-09T18:30:00.000Z",
      "Asia/Ho_Chi_Minh",
      "vi",
    );

    expect(result.day).toBe("10");
    expect(result.month).toContain("8");
    expect(result.label).toContain("10");
  });
});

describe("formatWorkshopMonthGroup", () => {
  it("formats the Vietnamese month group in the event timezone", () => {
    expect(
      formatWorkshopMonthGroup(
        "2026-08-31T18:30:00.000Z",
        "Asia/Ho_Chi_Minh",
        "vi",
      ),
    ).toEqual({ key: "2026-09", label: "Tháng 09, 2026" });
  });

  it("formats an English month group with the correct year", () => {
    expect(
      formatWorkshopMonthGroup(
        "2026-08-10T02:00:00.000Z",
        "Asia/Ho_Chi_Minh",
        "en",
      ),
    ).toEqual({ key: "2026-08", label: "AUGUST 2026" });
  });
});
