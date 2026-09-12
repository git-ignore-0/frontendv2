import type { CSAContractVerification } from "@/features/account/types";

export type CSAContractVerificationErrorCode =
  "csa_contract_verification_unavailable" | "rate_limited" | "request_failed";

export class CSAContractVerificationApiError extends Error {
  constructor(
    readonly code: CSAContractVerificationErrorCode,
    readonly status: number,
  ) {
    super(code);
    this.name = "CSAContractVerificationApiError";
  }
}

export function normalizeContractReference(value: string) {
  return value.trim().toUpperCase();
}

export function isContractReference(value: string) {
  return /^CSA-(?:[A-F0-9]{12}|\d{6}-[A-HJ-NP-Z2-9]{6})$/.test(value);
}

export async function verifyCSAContract(reference: string) {
  const normalized = normalizeContractReference(reference);
  const query = new URLSearchParams({ reference_code: normalized });
  const response = await fetch(`/api/account/csa-contracts/verify?${query}`, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const rawCode =
      payload?.errors?.[0]?.code || payload?.error || "request_failed";
    throw new CSAContractVerificationApiError(
      response.status === 429 ? "rate_limited" : rawCode,
      response.status,
    );
  }
  return ((await response.json()) as { data: CSAContractVerification }).data;
}
