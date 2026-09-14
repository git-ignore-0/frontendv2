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
  is_active?: boolean;
};

export type MembershipPackagePriceOption = {
  id: string;
  duration_months: number;
  monthly_price_vnd: string;
  total_price_vnd: string;
  sort_order?: number;
  is_active?: boolean;
  payment_plans?: CSAPaymentPlan[];
};

export type CSAPaymentInstallment = {
  sequence: number;
  amount: string;
  cycle_count: number;
};

export type CSAPaymentPlan = {
  id: string;
  name: string;
  payment_type: "full" | "installment";
  total_amount: string;
  installment_count: number;
  initial_payment_amount: string | null;
  installments: CSAPaymentInstallment[];
};

export type CSAPaymentSummary = {
  total_amount: string;
  paid_amount: string;
  remaining_amount: string;
  confirmed_installments: number;
  installment_count: number;
  paid_cycles: number;
  total_cycles: number;
};

export type CSAPaymentRecord = {
  installment_sequence: number;
  amount_due: string;
  amount_paid: string | null;
  cycle_count: number;
  status: "pending" | "reported" | "confirmed" | "rejected" | "overdue";
  due_at: string | null;
  confirmed_at: string | null;
  rejected_at: string | null;
};

export type AdministrativeUnit = { code: string; name: string };

export type CSAPurchaseRequestCreated = {
  id: string;
  request_code: string;
  status: "pending";
  expires_at: string | null;
  package_snapshot: { id: string; name: string };
  price_option_snapshot: {
    id: string;
    name: string;
    duration_months: number;
  };
  payment_plan?: CSAPaymentPlan | null;
  amount: string;
  initial_payment_amount: string;
  currency: string;
  transfer_content: string;
  bank_bin: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  qr_payload: {
    acqId: string;
    accountNo: string;
    accountName: string;
    amount: string;
    addInfo: string;
    format: string;
    template: string;
  };
  guest_confirmation_token?: string;
};

/** A short-lived, server-signed payment snapshot. It never leaves CSA flow memory. */
export type CSAPaymentQuote = {
  quote_token: string;
  expires_at: string;
  request_code: string;
  payment: {
    amount: string;
    bank_code: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    transfer_content: string;
  };
  payment_summary: {
    payment_type: "full" | "installment";
    total_amount: string;
    initial_payment_amount: string;
    installment_count: number;
    installments: CSAPaymentInstallment[];
  };
  terms: { version: string; locale: "vi" | "en"; hash: string };
  qr_payload: {
    acqId: string;
    accountNo: string;
    accountName: string;
    amount: string;
    addInfo: string;
    format: string;
    template: string;
  };
};

export type CSATrackerStatus =
  "pending" | "payment_confirmed" | "approved" | "rejected" | "expired";

export type CSATrackerRefundStatus = "not_applicable" | "pending" | "completed";

export type CSAContractVersion = {
  id: string;
  version_number: number;
  version_reason: "issued" | "payment_confirmed" | "membership_revoked";
  contract_status: "active" | "revoked";
  created_at: string;
  available_locales: Array<"vi" | "en">;
  paid_amount?: string;
  remaining_amount?: string;
  paid_cycles?: number;
  total_cycles?: number;
};

export type CSATrackerResult = {
  reference_code: string;
  reference_type: "request" | "contract";
  status: CSATrackerStatus;
  package_snapshot: { name: string };
  price_option_snapshot: { name: string };
  duration_months: number;
  amount: string;
  currency: string;
  created_at: string;
  expires_at: string | null;
  payment_confirmed_at: string | null;
  contract: {
    id: string;
    reference_code: string;
    status: "active" | "revoked";
  } | null;
  contract_status?: "active" | "revoked";
  membership_start_date?: string;
  membership_end_date?: string;
  available_pdf_locales?: Array<"vi" | "en">;
  versions?: CSAContractVersion[];
  pdf_available: boolean;
  rejection_reason?: string;
  rejected_at?: string | null;
  refund_status?: CSATrackerRefundStatus;
};

export type CSATrackerContract = {
  id: string;
  reference_code: string;
  source: string;
  status: "active" | "revoked";
  package_name_snapshot: string;
  price_option_name_snapshot: string;
  amount_snapshot: string;
  currency_snapshot: string;
  duration_months_snapshot: number;
  start_date: string;
  end_date: string;
  issued_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
  available_pdf_locales: Array<"vi" | "en">;
  pdf_available: boolean;
  current_version?: CSAContractVersion | null;
  versions?: CSAContractVersion[];
  payment_plan?: CSAPaymentPlan | null;
  payment_summary?: CSAPaymentSummary | null;
  payments?: CSAPaymentRecord[];
};

export type CSAContractVerification = {
  reference_code: string;
  status: "active" | "revoked";
  issued_at: string;
  start_date: string;
  end_date: string;
  revoked_at: string | null;
  revocation_reason: string | null;
};

export type MembershipContract = {
  id: string;
  reference_code: string;
  status: "active" | "revoked";
  issued_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
  available_locales: Array<"vi" | "en">;
  current_version?: CSAContractVersion | null;
  versions?: CSAContractVersion[];
  payment_plan?: CSAPaymentPlan | null;
  payment_summary?: CSAPaymentSummary | null;
  payments?: CSAPaymentRecord[];
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
