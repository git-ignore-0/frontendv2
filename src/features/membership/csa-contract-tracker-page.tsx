"use client";

import { useEffect, useRef, useState } from "react";

import type {
  CSATrackerContract,
  CSATrackerRefundStatus,
  CSATrackerResult,
  CSATrackerStatus,
} from "@/features/account/types";
import {
  CSATrackerApiError,
  downloadTrackedCSAContract,
  getTrackedCSAContract,
  isTrackerSessionExpired,
  lookupCSAContract,
} from "@/features/membership/csa-contract-tracker-api";
import { getCSAContractTrackerCopy } from "@/features/membership/csa-contract-tracker-copy";
import {
  type CSATrackerErrorKey,
  useCSAFlowState,
} from "@/features/membership/csa-flow-state";
import {
  formatMembershipDate,
  formatMembershipDateTime,
  formatMembershipExclusiveEndDate,
  formatMembershipMoney,
  formatMembershipTimestampDate,
} from "@/features/membership/format";
import { normalizeVietnamPhone } from "@/lib/contact";
import type { Locale } from "@/lib/i18n";

const referenceErrorId = "csa-tracker-reference-error";
const phoneErrorId = "csa-tracker-phone-error";

function trackerErrorKey(error: unknown): CSATrackerErrorKey {
  if (!(error instanceof CSATrackerApiError)) return "genericError";
  const keys = {
    csa_tracker_lookup_unavailable: "lookupUnavailable",
    csa_tracker_session_expired: "sessionExpired",
    csa_tracker_contract_unavailable: "contractUnavailable",
    csa_contract_pdf_unavailable: "pdfUnavailable",
    invalid_contract_locale: "invalidLocale",
    rate_limited: "rateLimited",
    request_failed: "genericError",
  } as const;
  return keys[error.code] ?? "genericError";
}

export function trackerErrorMessage(error: unknown, locale: Locale) {
  return getCSAContractTrackerCopy(locale)[trackerErrorKey(error)];
}

function statusLabel(
  status: CSATrackerStatus,
  copy: ReturnType<typeof getCSAContractTrackerCopy>,
) {
  return {
    pending: copy.pending,
    payment_confirmed: copy.paymentConfirmed,
    approved: copy.approved,
    rejected: copy.rejected,
    expired: copy.expired,
  }[status];
}

function statusNotice(
  status: CSATrackerStatus,
  copy: ReturnType<typeof getCSAContractTrackerCopy>,
) {
  return {
    pending: copy.pendingNotice,
    payment_confirmed: copy.paymentConfirmedNotice,
    approved: copy.approvedNotice,
    rejected: copy.rejectedNotice,
    expired: copy.expiredNotice,
  }[status];
}

function statusIcon(status: CSATrackerStatus) {
  return {
    pending: "…",
    payment_confirmed: "✓",
    approved: "✓",
    rejected: "×",
    expired: "!",
  }[status];
}

const statusDotClasses: Record<CSATrackerStatus, string> = {
  pending: "status-dot warn",
  payment_confirmed: "status-dot",
  approved: "status-dot",
  rejected: "status-dot bad",
  expired: "status-dot bad",
};

const statusBadgeClasses: Record<CSATrackerStatus, string> = {
  pending: "status-badge",
  payment_confirmed: "status-badge",
  approved: "status-badge approved",
  rejected: "status-badge rejected",
  expired: "status-badge rejected",
};

function refundLabel(
  status: CSATrackerRefundStatus | undefined,
  copy: ReturnType<typeof getCSAContractTrackerCopy>,
) {
  return {
    not_applicable: copy.refundNotApplicable,
    pending: copy.refundPending,
    completed: copy.refundCompleted,
  }[status ?? "not_applicable"];
}

function TrackerDetails({
  result,
  contract,
  locale,
  downloading,
  contractLoading,
  error,
  onDownload,
  onRetryContract,
  onReset,
}: {
  result: CSATrackerResult;
  contract: CSATrackerContract | null;
  locale: Locale;
  downloading: "vi" | "en" | null;
  contractLoading: boolean;
  error: string;
  onDownload: (locale: "vi" | "en") => void;
  onRetryContract: () => void;
  onReset: () => void;
}) {
  const copy = getCSAContractTrackerCopy(locale);
  const approved = result.status === "approved" && contract;
  const status = statusLabel(result.status, copy);

  return (
    <section
      className="result-card"
      aria-labelledby="csa-tracker-result-title"
      aria-live="polite"
      aria-busy={downloading !== null || contractLoading}
    >
      <div className="result-shell">
        <header className="result-head">
          <span className={statusDotClasses[result.status]} aria-hidden="true">
            {statusIcon(result.status)}
          </span>
          <div>
            <h2 id="csa-tracker-result-title">{status}</h2>
          </div>
          <span
            className={statusBadgeClasses[result.status]}
            aria-label={`${copy.statusBadge}: ${status}`}
          >
            {copy.statusBadge}
          </span>
        </header>

        <dl className="result-data">
          <div className="kv">
            <dt>{approved ? copy.contractCode : copy.requestCode}</dt>
            <dd className="code">
              {approved ? contract.reference_code : result.reference_code}
            </dd>
          </div>
          {result.status !== "rejected" ? (
            <>
              <div className="kv">
                <dt>{copy.package}</dt>
                <dd>
                  {approved
                    ? contract.package_name_snapshot
                    : result.package_snapshot.name}
                </dd>
              </div>
              <div className="kv">
                <dt>{copy.duration}</dt>
                <dd>
                  {copy.durationValue.replace(
                    "{count}",
                    String(
                      approved
                        ? contract.duration_months_snapshot
                        : result.duration_months,
                    ),
                  )}
                </dd>
              </div>
              <div className="kv">
                <dt>{copy.amount}</dt>
                <dd>
                  {formatMembershipMoney(
                    approved ? contract.amount_snapshot : result.amount,
                    locale,
                  )}
                </dd>
              </div>
            </>
          ) : null}
          {result.status === "pending" ||
          result.status === "payment_confirmed" ||
          result.status === "expired" ? (
            <div className="kv">
              <dt>{copy.submittedAt}</dt>
              <dd>{formatMembershipDateTime(result.created_at)}</dd>
            </div>
          ) : null}
          {(result.status === "pending" ||
            result.status === "payment_confirmed" ||
            result.status === "expired") &&
          result.expires_at ? (
            <div className="kv">
              <dt>{copy.expiredAt}</dt>
              <dd>{formatMembershipDateTime(result.expires_at)}</dd>
            </div>
          ) : null}
          {approved ? (
            <>
              <div className="kv">
                <dt>{copy.issuedAt}</dt>
                <dd>{formatMembershipTimestampDate(contract.issued_at)}</dd>
              </div>
              <div className="kv">
                <dt>{copy.startDate}</dt>
                <dd>{formatMembershipDate(contract.start_date)}</dd>
              </div>
              <div className="kv">
                <dt>{copy.endDate}</dt>
                <dd>{formatMembershipExclusiveEndDate(contract.end_date)}</dd>
              </div>
              <div className="kv">
                <dt>{copy.contractStatus}</dt>
                <dd>
                  {contract.status === "active" ? copy.active : copy.revoked}
                </dd>
              </div>
            </>
          ) : null}
          {result.status === "rejected" ? (
            <>
              <div className="kv">
                <dt>{copy.rejectionReason}</dt>
                <dd>{result.rejection_reason || "—"}</dd>
              </div>
              <div className="kv">
                <dt>{copy.refundStatus}</dt>
                <dd>{refundLabel(result.refund_status, copy)}</dd>
              </div>
              <div className="kv">
                <dt>{copy.rejectedAt}</dt>
                <dd>{formatMembershipDateTime(result.rejected_at)}</dd>
              </div>
            </>
          ) : null}
        </dl>

        <p
          className={[
            "notice",
            (result.status === "rejected" || result.status === "expired") &&
              "error",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {statusNotice(result.status, copy)}
        </p>

        {approved && contract.pdf_available ? (
          <div className="download-row">
            {contract.available_pdf_locales.includes("vi") ? (
              <button
                className="ghost-link primary"
                type="button"
                disabled={downloading !== null}
                onClick={() => onDownload("vi")}
              >
                {downloading === "vi" ? copy.downloading : copy.downloadVi}
              </button>
            ) : null}
            {contract.available_pdf_locales.includes("en") ? (
              <button
                className="ghost-link"
                type="button"
                disabled={downloading !== null}
                onClick={() => onDownload("en")}
              >
                {downloading === "en" ? copy.downloading : copy.downloadEn}
              </button>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="notice error" role="alert">
            {error}
          </p>
        ) : null}

        {result.status === "approved" && !contract ? (
          <div className="btn-row">
            {contractLoading ? (
              <p role="status">{copy.loadingContract}</p>
            ) : (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={onRetryContract}
              >
                {copy.retryContract}
              </button>
            )}
          </div>
        ) : null}

        <div className="btn-row">
          <button className="btn btn-secondary" type="button" onClick={onReset}>
            {copy.newLookup}
          </button>
        </div>
      </div>
    </section>
  );
}

export function CSAContractTrackerPage({ locale }: { locale: Locale }) {
  const copy = getCSAContractTrackerCopy(locale);
  const {
    tracker: trackerMemory,
    setTracker: saveTracker,
    clearTracker,
  } = useCSAFlowState();
  const initialMemory = useRef(trackerMemory).current;
  const restoredFromMemory = initialMemory !== null;
  const [referenceCode, setReferenceCode] = useState(
    initialMemory?.referenceCode ?? "",
  );
  const [phone, setPhone] = useState(initialMemory?.phone ?? "");
  const [submitted, setSubmitted] = useState(initialMemory?.submitted ?? false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CSATrackerResult | null>(
    initialMemory?.result ?? null,
  );
  const [contract, setContract] = useState<CSATrackerContract | null>(
    initialMemory?.contract ?? null,
  );
  const [sessionExpired, setSessionExpired] = useState(
    initialMemory?.sessionExpired ?? false,
  );
  const [errorKey, setErrorKey] = useState<CSATrackerErrorKey | null>(
    initialMemory?.errorKey ?? null,
  );
  const error = errorKey ? copy[errorKey] : "";
  const [downloading, setDownloading] = useState<"vi" | "en" | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const contractAttempt = useRef(0);
  const lookupInFlight = useRef(false);
  const referenceInput = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const normalizedPhone = normalizeVietnamPhone(phone);
  const validReference = Boolean(referenceCode.trim());
  const canLookup = validReference && Boolean(normalizedPhone) && !loading;

  useEffect(() => {
    if (
      !referenceCode &&
      !phone &&
      !submitted &&
      !result &&
      !contract &&
      !sessionExpired &&
      !errorKey
    ) {
      clearTracker();
      return;
    }
    saveTracker({
      referenceCode,
      phone,
      submitted,
      result,
      contract,
      sessionExpired,
      errorKey,
    });
  }, [
    clearTracker,
    contract,
    errorKey,
    phone,
    referenceCode,
    result,
    saveTracker,
    sessionExpired,
    submitted,
  ]);

  function focusReference() {
    window.setTimeout(() => referenceInput.current?.focus(), 0);
  }

  function resetResult(nextErrorKey: CSATrackerErrorKey | null = null) {
    contractAttempt.current += 1;
    setContractLoading(false);
    setResult(null);
    setContract(null);
    setErrorKey(nextErrorKey);
  }

  function resetLookup(
    nextErrorKey: CSATrackerErrorKey | null = null,
    expired = false,
  ) {
    setReferenceCode("");
    setPhone("");
    setSubmitted(false);
    setSessionExpired(expired);
    resetResult(nextErrorKey);
    focusReference();
  }

  async function loadApprovedContract() {
    const attempt = ++contractAttempt.current;
    setContractLoading(true);
    setErrorKey(null);
    try {
      const trackedContract = await getTrackedCSAContract();
      if (contractAttempt.current === attempt) setContract(trackedContract);
    } catch (caught) {
      if (contractAttempt.current !== attempt) return;
      if (isTrackerSessionExpired(caught)) {
        resetLookup("sessionExpired", true);
      } else {
        setErrorKey(
          trackerErrorKey(caught) === "rateLimited"
            ? "rateLimited"
            : "contractUnavailable",
        );
      }
    } finally {
      if (contractAttempt.current === attempt) setContractLoading(false);
    }
  }

  async function submitLookup(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setSessionExpired(false);
    setErrorKey(null);
    if (!validReference || !normalizedPhone || lookupInFlight.current) return;
    lookupInFlight.current = true;
    setLoading(true);
    setResult(null);
    setContract(null);
    try {
      const tracked = await lookupCSAContract({
        referenceCode: referenceCode.trim().toUpperCase(),
        phone: normalizedPhone,
      });
      setResult(tracked);
      if (tracked.status === "approved") await loadApprovedContract();
    } catch (caught) {
      const key = trackerErrorKey(caught);
      if (isTrackerSessionExpired(caught)) resetLookup(key, true);
      else resetResult(key);
    } finally {
      lookupInFlight.current = false;
      setLoading(false);
    }
  }

  async function download(localeToDownload: "vi" | "en") {
    if (downloading) return;
    setDownloading(localeToDownload);
    setErrorKey(null);
    try {
      const { blob, filename } =
        await downloadTrackedCSAContract(localeToDownload);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      const revokeObjectURL = URL.revokeObjectURL.bind(URL);
      window.setTimeout(() => revokeObjectURL(url), 1000);
    } catch (caught) {
      const key = trackerErrorKey(caught);
      if (isTrackerSessionExpired(caught)) resetLookup(key, true);
      else setErrorKey(key);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <main
      className={[
        "csa-ui",
        "csa-tracker-ui",
        restoredFromMemory && "csa-flow-restored",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="shell">
        <div className="app-card">
          <div className="content">
            <div className="lookup-wrap">
              {!result ? (
                <form
                  ref={form}
                  className="lookup-card"
                  onSubmit={submitLookup}
                  noValidate
                  aria-busy={loading}
                >
                  <section className="section-head">
                    <div>
                      <h1>{copy.title}</h1>
                      <p className="lead">{copy.intro}</p>
                    </div>
                  </section>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="csa-tracker-reference">
                        {copy.referenceCode}
                      </label>
                      <input
                        ref={referenceInput}
                        id="csa-tracker-reference"
                        value={referenceCode}
                        onChange={(event) =>
                          setReferenceCode(
                            event.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9-]/g, ""),
                          )
                        }
                        placeholder={copy.referencePlaceholder}
                        maxLength={20}
                        autoComplete="off"
                        spellCheck={false}
                        disabled={loading}
                        aria-invalid={submitted && !validReference}
                        aria-describedby={
                          submitted && !validReference
                            ? referenceErrorId
                            : undefined
                        }
                        required
                      />
                      {submitted && !validReference ? (
                        <small
                          className="helper"
                          id={referenceErrorId}
                          role="alert"
                        >
                          {copy.required}
                        </small>
                      ) : null}
                    </div>
                    <div className="field">
                      <label htmlFor="csa-tracker-phone">{copy.phone}</label>
                      <input
                        id="csa-tracker-phone"
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(event.target.value.replace(/(?!^\+)\D/g, ""))
                        }
                        placeholder={copy.phonePlaceholder}
                        maxLength={32}
                        inputMode="tel"
                        autoComplete="tel"
                        disabled={loading}
                        aria-invalid={submitted && !normalizedPhone}
                        aria-describedby={
                          submitted && !normalizedPhone
                            ? phoneErrorId
                            : undefined
                        }
                        required
                      />
                      {submitted && !normalizedPhone ? (
                        <small
                          className="helper"
                          id={phoneErrorId}
                          role="alert"
                        >
                          {copy.invalidPhone}
                        </small>
                      ) : null}
                    </div>
                  </div>
                  <div className="lookup-actions">
                    <span />
                    <button
                      className={[
                        "btn",
                        "btn-primary",
                        loading && "lookup-btn-loading",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      type="submit"
                      disabled={!canLookup}
                    >
                      {loading ? (
                        <span className="lookup-spinner" aria-hidden="true" />
                      ) : null}
                      {loading ? copy.lookingUp : copy.lookup}
                    </button>
                  </div>
                  <div aria-live="polite">
                    {loading ? (
                      <p className="helper" role="status">
                        {copy.lookingUp}
                      </p>
                    ) : null}
                    {error && !result ? (
                      <div
                        className={[
                          "notice",
                          "error",
                          sessionExpired && "is-session-expired",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        role="alert"
                      >
                        <p>{error}</p>
                        {!sessionExpired ? (
                          <div className="btn-row">
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => form.current?.requestSubmit()}
                            >
                              {copy.tryAgain}
                            </button>
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={focusReference}
                            >
                              {copy.returnToForm}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </form>
              ) : null}

              {result ? (
                <TrackerDetails
                  result={result}
                  contract={contract}
                  locale={locale}
                  downloading={downloading}
                  contractLoading={contractLoading}
                  error={error}
                  onDownload={(pdfLocale) => void download(pdfLocale)}
                  onRetryContract={() => void loadApprovedContract()}
                  onReset={() => {
                    clearTracker();
                    resetLookup();
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
