import { AccountApiError, accountApi } from "@/features/account/api";
import type { MembershipContract } from "@/features/account/types";

export async function getMembershipContract(
  membershipId: string,
  signal?: AbortSignal,
) {
  return accountApi<MembershipContract>(
    `memberships/${membershipId}/contract`,
    { signal },
  );
}

export async function downloadMembershipContract(
  membershipId: string,
  locale: "vi" | "en",
  versionId?: string,
) {
  let response: Response;
  try {
    response = await fetch(
      `/api/account/memberships/${membershipId}/contract/pdf?locale=${locale}${versionId ? `&version_id=${encodeURIComponent(versionId)}` : ""}`,
      {
        cache: "no-store",
      },
    );
  } catch {
    throw new AccountApiError("network_error", 0);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new AccountApiError(
      payload?.errors?.[0]?.code || payload?.error || "request_failed",
      response.status,
    );
  }
  if (!response.headers.get("content-type")?.startsWith("application/pdf")) {
    throw new AccountApiError("csa_contract_pdf_unavailable", 502);
  }
  return {
    blob: await response.blob(),
    filename:
      response.headers
        .get("content-disposition")
        ?.match(/filename="?([^";]+)"?/i)?.[1] ?? "csa-contract.pdf",
  };
}
