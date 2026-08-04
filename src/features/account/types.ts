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

export type MembershipPackageItem = {
  product_id: string;
  product_name: string;
  short_description?: string;
  unit_size: string;
  unit_label_vi: string;
  unit_label_en: string;
  quota_units: number;
  requested_locale?: "vi" | "en";
  content_locale?: "vi" | "en";
  is_fallback?: boolean;
};

export type MembershipPackage = {
  id: string;
  name: string;
  description: string;
  price_options: MembershipPackagePriceOption[];
  quota_policy: "expire" | "rollover";
  items: MembershipPackageItem[];
  requested_locale?: "vi" | "en";
  content_locale?: "vi" | "en";
  is_fallback?: boolean;
};

export type MembershipPackagePriceOption = {
  id: string;
  duration_months: number;
  monthly_price_vnd: string;
  total_price_vnd: string;
  sort_order?: number;
};

export type CurrentMembership = {
  id: string;
  user_id: string;
  package_id: string;
  price_option_id: string;
  status: "scheduled" | "active" | "ended";
  package_name: string;
  package_description: string;
  requested_locale?: "vi" | "en";
  content_locale?: "vi" | "en";
  is_fallback?: boolean;
  duration_months: number;
  monthly_price_vnd: string;
  total_price_vnd: string;
  price_option: {
    duration_months: number;
    monthly_price_vnd: string;
    total_price_vnd: string;
  };
  quota_policy: "expire" | "rollover";
  start_date: string;
  end_date: string;
  activated_at: string;
};

export type MembershipQuotaProduct = {
  product_id: string;
  product_name: string;
  requested_locale?: "vi" | "en";
  content_locale?: "vi" | "en";
  is_fallback?: boolean;
  unit_size: string;
  unit_label_vi: string;
  unit_label_en: string;
  quota_units_per_cycle: number;
  remaining_units: number;
};

export type MembershipQuota = {
  membership_id: string;
  requested_locale?: "vi" | "en";
  products: MembershipQuotaProduct[];
};

export type MembershipUsage = {
  id: string;
  membership_id: string;
  status: "applied" | "reversed";
  note: string;
  created_at: string;
  reversed_at: string | null;
  lines: Array<{
    product_id: string;
    product_name: string;
    requested_locale?: "vi" | "en";
    content_locale?: "vi" | "en";
    is_fallback?: boolean;
    unit_size: string;
    unit_label_vi: string;
    unit_label_en: string;
    units: number;
  }>;
  reversal?: { reason: string; created_at: string };
};
