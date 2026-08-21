import { describe, expect, it } from "vitest";

import {
  getNextTrackerMilestone,
  getRemainingTrackerSignups,
  getTrackerFieldIconSize,
  getTrackerMilestoneIcon,
  getTrackerMilestoneKey,
  getTrackerProgressPercentage,
  normalizeTrackerSignupCount,
} from "./milestones";

describe("tracker milestones", () => {
  it.each([
    [0, "seedPlanted"],
    [9, "seedPlanted"],
    [10, "gettingStarted"],
    [19, "gettingStarted"],
    [20, "providingForFamily"],
    [29, "providingForFamily"],
    [30, "communityLeader"],
  ] as const)("maps %i signups to %s", (count, milestone) => {
    expect(getTrackerMilestoneKey(count)).toBe(milestone);
  });

  it("returns the next milestone and remaining signup count", () => {
    expect(getNextTrackerMilestone(0)).toBe("gettingStarted");
    expect(getRemainingTrackerSignups(0)).toBe(10);
    expect(getNextTrackerMilestone(14)).toBe("providingForFamily");
    expect(getRemainingTrackerSignups(14)).toBe(6);
    expect(getNextTrackerMilestone(29)).toBe("communityLeader");
    expect(getRemainingTrackerSignups(29)).toBe(1);
    expect(getNextTrackerMilestone(30)).toBeNull();
    expect(getRemainingTrackerSignups(30)).toBe(0);
  });

  it("caps overall progress at the Community Leader threshold", () => {
    expect(getTrackerProgressPercentage(0)).toBe(0);
    expect(getTrackerProgressPercentage(15)).toBe(50);
    expect(getTrackerProgressPercentage(30)).toBe(100);
    expect(getTrackerProgressPercentage(300)).toBe(100);
  });

  it("normalizes negative, fractional, and non-finite counts", () => {
    expect(normalizeTrackerSignupCount(-1)).toBe(0);
    expect(normalizeTrackerSignupCount(9.9)).toBe(9);
    expect(normalizeTrackerSignupCount(Number.NaN)).toBe(0);
    expect(normalizeTrackerSignupCount(Number.POSITIVE_INFINITY)).toBe(0);
    expect(getTrackerMilestoneKey(-10)).toBe("seedPlanted");
    expect(getRemainingTrackerSignups(Number.NaN)).toBe(10);
    expect(getTrackerProgressPercentage(-10)).toBe(0);
  });

  it("provides a typed icon key for the current milestone", () => {
    expect(getTrackerMilestoneIcon(0)).toBe("seed");
    expect(getTrackerMilestoneIcon(10)).toBe("sprout");
    expect(getTrackerMilestoneIcon(20)).toBe("harvest");
    expect(getTrackerMilestoneIcon(30)).toBe("people");
  });

  it("scales field icons with signup count and caps their size", () => {
    expect(getTrackerFieldIconSize(0)).toBe(20);
    expect(getTrackerFieldIconSize(10)).toBeGreaterThan(
      getTrackerFieldIconSize(9),
    );
    expect(getTrackerFieldIconSize(100)).toBe(64);
    expect(getTrackerFieldIconSize(-1)).toBe(20);
  });
});
