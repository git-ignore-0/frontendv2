import { describe, expect, it } from "vitest";

import { getSiteContent } from "./site-content";

function copyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) =>
    copyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("tracker dictionary", () => {
  it("keeps English and Vietnamese tracker copy complete and synchronized", () => {
    const en = getSiteContent("en").tracker;
    const vi = getSiteContent("vi").tracker;

    expect(copyPaths(en).sort()).toEqual(copyPaths(vi).sort());
    expect(copyPaths(en)).toContain("accessibility.field");
    expect(copyPaths(en)).toContain("accessibility.farm");
    expect(copyPaths(en)).toContain("accessibility.progress");
    expect(copyPaths(en)).toContain("milestones.communityLeader.description");
    expect(copyPaths(en)).toContain("stats.totalSignups");
    expect(copyPaths(en)).toContain("liveNoteTitle");
    expect(copyPaths(en)).toContain("liveNoteBody");
  });

  it("keeps the reference six-month intro and stats labels", () => {
    const en = getSiteContent("en").tracker;
    const vi = getSiteContent("vi").tracker;

    expect(en.intro).toContain(
      "Every 6-month CSA signup grows a farmer's story forward.",
    );
    expect(vi.intro).toContain(
      "Mỗi lượt đăng ký CSA 6 tháng giúp câu chuyện của người nông dân tiến về phía trước.",
    );
    expect(en.stats).toEqual({
      farms: "FARMERS IN THE GROUP",
      totalSignups: "TOTAL 6-MONTH SIGNUPS",
      leaders: "COMMUNITY LEADERS REACHED",
    });
  });

  it("uses production-safe localized live-data copy", () => {
    const en = getSiteContent("en").tracker;
    const vi = getSiteContent("vi").tracker;

    expect(`${en.liveNoteTitle} ${en.liveNoteBody}`).toMatch(
      /live CSA signup data/i,
    );
    expect(`${vi.liveNoteTitle} ${vi.liveNoteBody}`).toMatch(
      /dữ liệu đăng ký CSA/i,
    );
    expect(
      `${en.liveNoteTitle} ${en.liveNoteBody} ${vi.liveNoteTitle} ${vi.liveNoteBody}`,
    ).not.toMatch(/prototype|placeholder|fake farmer|số liệu mẫu/i);
  });
});
