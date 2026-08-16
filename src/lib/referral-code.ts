const REFERRAL_CODE_PATTERN = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/;

export function normalizeReferralCode(value: string) {
  return value.toUpperCase();
}

export function isReferralCode(value: string) {
  return REFERRAL_CODE_PATTERN.test(value);
}
