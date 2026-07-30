import type { SiteContent } from "@/content/site-content";

export type AccountCopy = SiteContent["account"];

export function formatRewardPoints(copy: AccountCopy, points: number) {
  return copy.rewardPoints.replace("{points}", String(points));
}
