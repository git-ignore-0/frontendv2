"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CSAContractVerification } from "@/features/account/types";
import {
  CSAContractVerificationApiError,
  isContractReference,
  normalizeContractReference,
  verifyCSAContract,
} from "@/features/membership/csa-contract-verification-api";
import { getCSAContractVerificationCopy } from "@/features/membership/csa-contract-verification-copy";
import {
  formatMembershipDate,
  formatMembershipDateTime,
  formatMembershipExclusiveEndDate,
  formatMembershipTimestampDate,
} from "@/features/membership/format";
import { localizedPath, type Locale } from "@/lib/i18n";

type VerificationError = "unavailable" | "rate_limited" | "network";
const verificationErrorId = "csa-contract-verification-error";

function verificationError(error: unknown): VerificationError {
  if (!(error instanceof CSAContractVerificationApiError)) return "network";
  if (error.code === "rate_limited") return "rate_limited";
  if (error.code === "csa_contract_verification_unavailable")
    return "unavailable";
  return "network";
}

function VerificationResult({
  contract,
  locale,
  onReset,
}: {
  contract: CSAContractVerification;
  locale: Locale;
  onReset: () => void;
}) {
  const copy = getCSAContractVerificationCopy(locale);
  const status = contract.status === "active" ? copy.active : copy.revoked;
  return (
    <section
      className="csa-purchase-panel csa-tracker-result csa-verification-result"
      aria-live="polite"
    >
      <header>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{status}</h1>
        <span className={`csa-tracker-status is-${contract.status}`}>
          {status}
        </span>
      </header>
      <dl className="csa-payment-details csa-tracker-details">
        <div>
          <dt>{copy.contractReference}</dt>
          <dd className="csa-tracker-code">{contract.reference_code}</dd>
        </div>
        <div>
          <dt>{copy.contractStatus}</dt>
          <dd>{status}</dd>
        </div>
        <div>
          <dt>{copy.issuedAt}</dt>
          <dd>{formatMembershipTimestampDate(contract.issued_at)}</dd>
        </div>
        <div>
          <dt>{copy.startDate}</dt>
          <dd>{formatMembershipDate(contract.start_date)}</dd>
        </div>
        <div>
          <dt>{copy.endDate}</dt>
          <dd>{formatMembershipExclusiveEndDate(contract.end_date)}</dd>
        </div>
        {contract.status === "revoked" ? (
          <>
            <div>
              <dt>{copy.revokedAt}</dt>
              <dd>{formatMembershipDateTime(contract.revoked_at)}</dd>
            </div>
            {contract.revocation_reason ? (
              <div>
                <dt>{copy.revocationReason}</dt>
                <dd>{contract.revocation_reason}</dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>
      <button className="csa-tracker-reset" type="button" onClick={onReset}>
        {copy.verifyAnother}
      </button>
    </section>
  );
}

export function CSAContractVerificationPage({
  initialReference = "",
  locale,
}: {
  initialReference?: string;
  locale: Locale;
}) {
  const copy = getCSAContractVerificationCopy(locale);
  const normalizedInitialReference =
    normalizeContractReference(initialReference);
  const [reference, setReference] = useState(normalizedInitialReference);
  const [contract, setContract] = useState<CSAContractVerification | null>(
    null,
  );
  const [error, setError] = useState<VerificationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(initialReference));
  const requestInFlight = useRef(false);
  const initialVerificationStarted = useRef(false);

  const runVerification = useCallback(async (candidate: string) => {
    const normalized = normalizeContractReference(candidate);
    setReference(normalized);
    setSubmitted(true);
    setContract(null);
    setError(null);
    if (!isContractReference(normalized)) {
      setError("unavailable");
      return;
    }
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true);
    try {
      setContract(await verifyCSAContract(normalized));
    } catch (caught) {
      setError(verificationError(caught));
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!normalizedInitialReference || initialVerificationStarted.current)
      return;
    initialVerificationStarted.current = true;
    void runVerification(normalizedInitialReference);
  }, [normalizedInitialReference, runVerification]);

  function reset() {
    setReference("");
    setContract(null);
    setError(null);
    setSubmitted(false);
  }

  if (contract)
    return (
      <main className="csa-purchase-page csa-tracker-page">
        <VerificationResult
          contract={contract}
          locale={locale}
          onReset={reset}
        />
      </main>
    );

  const errorMessage =
    error === "rate_limited"
      ? copy.rateLimited
      : error === "network"
        ? copy.networkError
        : error === "unavailable"
          ? copy.unavailable
          : null;

  return (
    <main className="csa-purchase-page csa-tracker-page">
      <form
        className="csa-purchase-panel"
        onSubmit={(event) => {
          event.preventDefault();
          void runVerification(reference);
        }}
        noValidate
      >
        <Link
          className="csa-purchase-back"
          href={localizedPath(locale, "/csa")}
        >
          ← {copy.back}
        </Link>
        <header>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="csa-purchase-intro">{copy.intro}</p>
        </header>
        <div className="csa-purchase-fields csa-tracker-fields">
          <div className="csa-purchase-field">
            <label htmlFor="csa-contract-reference">{copy.reference}</label>
            <input
              id="csa-contract-reference"
              value={reference}
              onChange={(event) =>
                setReference(
                  event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                )
              }
              placeholder={copy.referencePlaceholder}
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? verificationErrorId : undefined}
              required
            />
          </div>
        </div>
        {!submitted && !normalizedInitialReference ? (
          <p className="csa-purchase-intro csa-verification-missing">
            {copy.missing}
          </p>
        ) : null}
        {errorMessage ? (
          <div
            className="csa-purchase-error"
            id={verificationErrorId}
            role="alert"
          >
            <p>{errorMessage}</p>
          </div>
        ) : null}
        <button
          className="csa-purchase-primary"
          type="submit"
          disabled={loading}
        >
          {loading
            ? copy.verifying
            : error === "rate_limited" || error === "network"
              ? copy.retry
              : copy.verify}
        </button>
        {loading ? (
          <p className="sr-only" role="status">
            {copy.verifying}
          </p>
        ) : null}
      </form>
    </main>
  );
}
