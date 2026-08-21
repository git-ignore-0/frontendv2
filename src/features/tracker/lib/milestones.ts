export const TRACKER_MILESTONE_KEYS = [
  "seedPlanted",
  "gettingStarted",
  "providingForFamily",
  "communityLeader",
] as const;

export type TrackerMilestoneKey = (typeof TRACKER_MILESTONE_KEYS)[number];

export type TrackerMilestoneIcon = "seed" | "sprout" | "harvest" | "people";

export type TrackerMilestone = {
  key: TrackerMilestoneKey;
  minimum: number;
  icon: TrackerMilestoneIcon;
};

export const TRACKER_SIGNUP_GOAL = 30;

export const TRACKER_MILESTONES: readonly TrackerMilestone[] = [
  { key: "seedPlanted", minimum: 0, icon: "seed" },
  { key: "gettingStarted", minimum: 10, icon: "sprout" },
  { key: "providingForFamily", minimum: 20, icon: "harvest" },
  {
    key: "communityLeader",
    minimum: TRACKER_SIGNUP_GOAL,
    icon: "people",
  },
];

export const TRACKER_LEGEND_MILESTONES = TRACKER_MILESTONES.slice(1);

export function normalizeTrackerSignupCount(signupCount: number): number {
  if (!Number.isFinite(signupCount)) return 0;
  return Math.max(0, Math.floor(signupCount));
}

export function getTrackerMilestoneKey(
  signupCount: number,
): TrackerMilestoneKey {
  const count = normalizeTrackerSignupCount(signupCount);
  return [...TRACKER_MILESTONES]
    .reverse()
    .find((milestone) => count >= milestone.minimum)!.key;
}

export function getNextTrackerMilestone(
  signupCount: number,
): TrackerMilestoneKey | null {
  const count = normalizeTrackerSignupCount(signupCount);
  return (
    TRACKER_MILESTONES.find((milestone) => milestone.minimum > count)?.key ??
    null
  );
}

export function getRemainingTrackerSignups(signupCount: number): number {
  const count = normalizeTrackerSignupCount(signupCount);
  const next = TRACKER_MILESTONES.find(
    (milestone) => milestone.minimum > count,
  );
  return next ? next.minimum - count : 0;
}

export function getTrackerProgressPercentage(signupCount: number): number {
  const count = normalizeTrackerSignupCount(signupCount);
  return Math.min(100, (count / TRACKER_SIGNUP_GOAL) * 100);
}

export function getTrackerMilestoneIcon(
  signupCount: number,
): TrackerMilestoneIcon {
  const key = getTrackerMilestoneKey(signupCount);
  return TRACKER_MILESTONES.find((milestone) => milestone.key === key)!.icon;
}

export function getTrackerFieldIconSize(signupCount: number): number {
  const count = normalizeTrackerSignupCount(signupCount);
  return count >= TRACKER_SIGNUP_GOAL
    ? 26 + Math.min(count, 40) * 0.95
    : 20 + Math.min(count, TRACKER_SIGNUP_GOAL) * 1.2;
}
