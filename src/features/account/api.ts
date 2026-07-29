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
    const error = new Error(
      payload?.errors?.[0]?.code || payload?.error || "request_failed",
    );
    Object.assign(error, { status: response.status });
    throw error;
  }
  return payload;
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
