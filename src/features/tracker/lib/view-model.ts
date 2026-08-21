import type { PublicTrackerFarm } from "@/lib/content-api";

import {
  getNextTrackerMilestone,
  getRemainingTrackerSignups,
  getTrackerFieldIconSize,
  getTrackerMilestoneIcon,
  getTrackerMilestoneKey,
  getTrackerProgressPercentage,
  normalizeTrackerSignupCount,
  TRACKER_MILESTONES,
  type TrackerMilestoneKey,
} from "./milestones";

export type TrackerStatsModel = {
  farms: number;
  totalSignups: number;
  leaders: number;
};

export type TrackerFarmViewModel = PublicTrackerFarm & {
  count: number;
  milestoneKey: TrackerMilestoneKey;
  nextMilestoneKey: TrackerMilestoneKey | null;
  remainingSignups: number;
  progressPercentage: number;
  icon: ReturnType<typeof getTrackerMilestoneIcon>;
  fieldIconSize: number;
  isLeader: boolean;
  ticks: Array<{ value: number; reached: boolean }>;
};

export function calculateTrackerStats(
  farms: PublicTrackerFarm[],
): TrackerStatsModel {
  const models = farms.map(createTrackerFarmViewModel);
  return {
    farms: models.length,
    totalSignups: models.reduce((total, farm) => total + farm.count, 0),
    leaders: models.filter((farm) => farm.isLeader).length,
  };
}

export function createTrackerFarmViewModel(
  farm: PublicTrackerFarm,
): TrackerFarmViewModel {
  const count = normalizeTrackerSignupCount(farm.signup_count);
  const milestoneKey = getTrackerMilestoneKey(count);
  return {
    ...farm,
    count,
    milestoneKey,
    nextMilestoneKey: getNextTrackerMilestone(count),
    remainingSignups: getRemainingTrackerSignups(count),
    progressPercentage: getTrackerProgressPercentage(count),
    icon: getTrackerMilestoneIcon(count),
    fieldIconSize: getTrackerFieldIconSize(count),
    isLeader: milestoneKey === "communityLeader",
    ticks: TRACKER_MILESTONES.map((milestone) => ({
      value: milestone.minimum,
      reached: count >= milestone.minimum,
    })),
  };
}
