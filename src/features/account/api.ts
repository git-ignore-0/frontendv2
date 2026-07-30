export class AccountApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "AccountApiError";
  }
}

export async function accountApi<T, M = Record<string, unknown>>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta?: M }> {
  const response = await fetch(`/api/account/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body
        ? { "Content-Type": "application/json", "X-NFV-Public-Request": "1" }
        : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AccountApiError(
      payload?.errors?.[0]?.code || payload?.error || "request_failed",
      response.status,
    );
  }
  return payload;
}

export function isAccountSessionError(error: unknown) {
  return error instanceof AccountApiError && error.status === 401;
}

export function accountDateLocale(locale: "vi" | "en") {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function referralErrorKey(message: string) {
  if (message === "invalid_referral_code") return "invalidCode";
  if (message === "self_referral") return "selfReferral";
  if (message === "referrer_already_assigned") return "alreadyReferred";
  return "error";
}

export function redemptionErrorKey(message: string) {
  if (message === "insufficient_points") return "redemptionInsufficient";
  if (message === "reward_inactive") return "redemptionInactive";
  if (message === "reward_not_found") return "redemptionUnavailable";
  if (message === "idempotency_conflict") return "redemptionConflict";
  return "redemptionError";
}
