import type {
  CSATrackerContract,
  CSATrackerResult,
} from "@/features/account/types";

export type CSATrackerErrorCode =
  | "csa_tracker_lookup_unavailable"
  | "csa_tracker_session_expired"
  | "csa_tracker_contract_unavailable"
  | "csa_contract_pdf_unavailable"
  | "invalid_contract_locale"
  | "rate_limited"
  | "request_failed";

export class CSATrackerApiError extends Error {
  constructor(
    readonly code: CSATrackerErrorCode,
    readonly status: number,
  ) {
    super(code);
    this.name = "CSATrackerApiError";
  }
}

const basePath = "/api/account/csa-contract-tracker";

async function trackerError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  const rawCode =
    payload?.errors?.[0]?.code || payload?.error || "request_failed";
  return new CSATrackerApiError(
    response.status === 429 ? "rate_limited" : rawCode,
    response.status,
  );
}

async function trackerJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${basePath}/${path}`, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(init?.body
        ? {
            "Content-Type": "application/json",
            "X-NFV-Public-Request": "1",
          }
        : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) throw await trackerError(response);
  return (await response.json()) as { data: T };
}

export async function lookupCSAContract(input: {
  referenceCode: string;
  phone: string;
}) {
  return (
    await trackerJson<CSATrackerResult>("lookup", {
      method: "POST",
      body: JSON.stringify({
        reference_code: input.referenceCode,
        phone: input.phone,
      }),
    })
  ).data;
}

export async function getTrackedCSAContract() {
  return (await trackerJson<CSATrackerContract>("contract")).data;
}

export async function downloadTrackedCSAContract(locale: "vi" | "en") {
  const response = await fetch(`${basePath}/contract/pdf?locale=${locale}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw await trackerError(response);
  if (!response.headers.get("content-type")?.startsWith("application/pdf"))
    throw new CSATrackerApiError("csa_contract_pdf_unavailable", 502);
  return {
    blob: await response.blob(),
    filename:
      response.headers
        .get("content-disposition")
        ?.match(/filename="?([^";]+)"?/i)?.[1] ?? `csa-contract.${locale}.pdf`,
  };
}

export function isTrackerSessionExpired(error: unknown) {
  return (
    error instanceof CSATrackerApiError &&
    error.code === "csa_tracker_session_expired"
  );
}
