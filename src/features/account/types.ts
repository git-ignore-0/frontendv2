export type AccountSummary = {
  referral_code: string;
  referrer: { id: string; name: string } | null;
  can_submit_referral_code: boolean;
  points_balance: number;
  invited_count: number;
};

export type InvitedUser = {
  id: string;
  name: string;
  status: "joined";
  referred_at: string;
};

export type PointTransaction = {
  id: string;
  direction: "credit" | "debit";
  amount: number;
  message: string;
  created_at: string;
};

export type PaginationMeta = { page: number; page_size: number; total: number };
export type PointMeta = PaginationMeta & { balance: number };

export type RewardMedia = {
  id: string;
  url: string;
  width: number;
  height: number;
  variants: Array<{
    url: string;
    width: number;
    height: number;
    [key: string]: unknown;
  }>;
};

export type Reward = {
  id: string;
  point_cost: number;
  image: RewardMedia;
  position: number;
  requested_locale: "vi" | "en";
  content_locale: "vi" | "en";
  is_fallback: boolean;
  name: string;
  short_description: string;
};

export type RedemptionStatus =
  "pending" | "contacted" | "completed" | "rejected";

export type Redemption = {
  id: string;
  reward_id: string;
  reward_name_vi_snapshot: string;
  reward_name_en_snapshot: string;
  reward_name: string;
  point_cost_snapshot: number;
  status: RedemptionStatus;
  rejection_message: string;
  created_at: string;
  contacted_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  updated_at: string;
};

export type RedemptionCreated = {
  redemption: Redemption;
  balance: number;
  idempotent_replay: boolean;
};
