"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import type { SiteContent } from "@/content/site-content";
import { accountApi, referralErrorKey } from "@/features/account/api";
import type { AccountSummary } from "@/features/account/types";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function AccountPage({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await accountApi<AccountSummary>("account");
      setSummary(payload.data);
    } catch {
      setError(copy.error);
    } finally {
      setLoading(false);
    }
  }, [copy.error]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (copyStatus !== "copied") return;
    const timeout = window.setTimeout(() => setCopyStatus(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyCode() {
    if (!summary) return;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard is unavailable");
      await navigator.clipboard.writeText(summary.referral_code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setCodeError("");
    try {
      const payload = await accountApi<AccountSummary>("submit-code", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setSummary(payload.data);
      setCode("");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setCodeError(copy[referralErrorKey(message)]);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="account-state shell">{copy.loading}</div>;
  if (error || !summary) {
    return (
      <div className="account-state shell">
        <p>{error || copy.error}</p>
        <button onClick={() => void load()}>{copy.retry}</button>
      </div>
    );
  }

  const accountPath = `/account/${locale}`;
  return (
    <main className="account-page shell">
      <header className="account-overview-header">
        <h1>{copy.title}</h1>
        <a
          className="account-profile-action"
          href={`/api/auth/account?returnTo=${encodeURIComponent(accountPath)}`}
        >
          {copy.editProfile}
          <ArrowIcon />
        </a>
      </header>

      <section className="account-metrics" aria-label={copy.overview}>
        <article className="account-metric">
          <p>{copy.balance}</p>
          <strong>
            {summary.points_balance} <small>{copy.pointsUnit}</small>
          </strong>
          <Link className="account-detail-link" href={`${accountPath}/points`}>
            {copy.viewHistory}
            <ArrowIcon />
          </Link>
        </article>
        <article className="account-metric">
          <p>{copy.invited}</p>
          <strong>{summary.invited_count}</strong>
          <Link className="account-detail-link" href={`${accountPath}/invited`}>
            {copy.viewInvited}
            <ArrowIcon />
          </Link>
        </article>
      </section>

      <section className="account-referral" aria-labelledby="referral-title">
        <div className="account-referral-heading">
          <p className="eyebrow">{copy.referral}</p>
          <h2 id="referral-title">{copy.codeLabel}</h2>
        </div>
        <div className="referral-code">
          <code>{summary.referral_code}</code>
          <button
            className={copyStatus === "copied" ? "is-copied" : undefined}
            onClick={() => void copyCode()}
          >
            {copyStatus === "copied" ? (
              <>
                <CheckIcon />
                {copy.copiedButton}
              </>
            ) : (
              copy.copy
            )}
          </button>
        </div>
        <p
          className={copyStatus === "failed" ? "copy-status-error" : "sr-only"}
          aria-live="polite"
          role={copyStatus === "failed" ? "alert" : undefined}
        >
          {copyStatus === "copied"
            ? copy.copied
            : copyStatus === "failed"
              ? copy.copyFailed
              : ""}
        </p>
        {summary.referrer ? (
          <p className="referrer-status">
            {copy.referredBy.replace("{name}", summary.referrer.name)}
          </p>
        ) : summary.can_submit_referral_code ? (
          <form className="referral-entry" onSubmit={submitCode}>
            <label>
              <span>{copy.enterCode}</span>
              <input
                required
                maxLength={12}
                value={code}
                placeholder={copy.codePlaceholder}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            <button disabled={submitting}>
              {submitting ? copy.submitting : copy.submitCode}
            </button>
            {codeError && <p role="alert">{codeError}</p>}
          </form>
        ) : null}
      </section>
    </main>
  );
}

export function SignedOutAccount({
  locale,
  copy,
  returnPath = `/account/${locale}`,
}: {
  locale: Locale;
  copy: Copy;
  returnPath?: string;
}) {
  return (
    <section className="account-state shell">
      <h1>{copy.signedOutTitle}</h1>
      <p>{copy.signedOutBody}</p>
      <Link
        className="text-link"
        href={`/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(returnPath)}`}
      >
        {copy.signIn}
      </Link>
    </section>
  );
}
