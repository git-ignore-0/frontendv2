"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { SiteContent } from "@/content/site-content";
import {
  buildAccountLevelOnePath,
  resolveAccountLevelOneBackHref,
} from "@/features/account/account-level-one-back";
import {
  accountApi,
  isAccountSessionError,
  referralErrorKey,
} from "@/features/account/api";
import { ReferralCodeButton } from "@/features/account/referral-code-button";
import { ReferralShareDialog } from "@/features/account/referral-share-dialog";
import {
  AccountDetailHeader,
  AccountEmptyState,
  AccountErrorState,
  AccountLoadingState,
  AccountNavigationRow,
  AccountPageShell,
  AccountSignedOutState,
} from "@/features/account/account-presentation";
import type { AccountSummary } from "@/features/account/types";
import { useAccountSummary } from "@/features/account/use-account-summary";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];

export function ReferralProgramPage({
  locale,
  copy,
  pendingReferralCode,
  publicSiteOrigin,
  returnTo,
}: {
  locale: Locale;
  copy: Copy;
  pendingReferralCode?: string;
  publicSiteOrigin: string;
  returnTo?: string | string[] | null;
}) {
  const router = useRouter();
  const { load, setSummary, state, summary } = useAccountSummary();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [confirmationDismissed, setConfirmationDismissed] = useState(false);
  const returnPath = `/account/${locale}/referral`;
  const currentLevelOnePath = buildAccountLevelOnePath({
    locale,
    returnTo,
    currentPath: returnPath,
  });
  const backHref = resolveAccountLevelOneBackHref({
    locale,
    returnTo,
    currentPath: returnPath,
  });

  async function submitReferralCode(
    submittedCode: string,
    removePendingReferral: boolean,
  ) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setCodeError("");
    try {
      const payload = await accountApi<AccountSummary>("submit-code", {
        method: "POST",
        body: JSON.stringify({ code: submittedCode }),
      });
      setSummary(payload.data);
      setCode("");
      if (removePendingReferral) router.replace(currentLevelOnePath);
    } catch (error) {
      if (isAccountSessionError(error)) {
        setSessionExpired(true);
        return;
      }
      const message = error instanceof Error ? error.message : "";
      setCodeError(copy[referralErrorKey(message)]);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function submitCode(event: FormEvent) {
    event.preventDefault();
    void submitReferralCode(code, false);
  }

  function dismissConfirmation() {
    setConfirmationDismissed(true);
    setCodeError("");
    router.replace(currentLevelOnePath);
  }

  const showConfirmation = Boolean(
    pendingReferralCode &&
    !confirmationDismissed &&
    summary &&
    !summary.referrer &&
    summary.can_submit_referral_code,
  );

  if (state === "signed-out" || sessionExpired) {
    return (
      <AccountSignedOutState
        locale={locale}
        copy={copy}
        returnPath={currentLevelOnePath}
      />
    );
  }

  return (
    <AccountPageShell className="account-detail-page referral-detail-page">
      <AccountDetailHeader
        backLabel={copy.back}
        backReplaceHref={backHref}
        subtitle={copy.referralProgramIntro}
        title={copy.referralProgramTitle}
      />

      {state === "loading" ? (
        <AccountLoadingState message={copy.personalCodeLoading} />
      ) : state === "error" || !summary ? (
        <AccountErrorState
          message={copy.personalCodeError}
          onRetry={() => void load()}
          retryLabel={copy.retry}
        />
      ) : !summary.referral_code ? (
        <AccountEmptyState message={copy.personalCodeError} />
      ) : (
        <>
          <section
            aria-labelledby="personal-referral-title"
            className="referral-detail-section referral-code-section"
          >
            <p className="referral-section-label" id="personal-referral-title">
              {copy.codeLabel}
            </p>
            <ReferralCodeButton code={summary.referral_code} copy={copy} />
            <ReferralShareDialog
              code={summary.referral_code}
              copy={copy}
              locale={locale}
              origin={publicSiteOrigin}
            />
            <div className="referral-invited-summary">
              <span>
                {copy.invitedCount.replace(
                  "{count}",
                  String(summary.invited_count),
                )}
              </span>
              <AccountNavigationRow
                href={`/account/${locale}/invited`}
                title={copy.invited}
              />
            </div>
          </section>

          {summary.referrer || summary.can_submit_referral_code ? (
            <section
              aria-labelledby="referral-entry-title"
              className="referral-detail-section referral-entry-section"
            >
              <h2 id="referral-entry-title">
                {showConfirmation
                  ? copy.applyReferralTitle
                  : copy.enterCodeTitle}
              </h2>
              {summary.referrer ? (
                <p className="referrer-status">
                  {copy.referredBy.replace("{name}", summary.referrer.name)}
                </p>
              ) : showConfirmation && pendingReferralCode ? (
                <div className="referral-confirmation">
                  <p>{copy.applyReferralDescription}</p>
                  <label>
                    <span>{copy.invitationReferralCode}</span>
                    <input readOnly value={pendingReferralCode} />
                  </label>
                  <div className="referral-confirmation-actions">
                    <button
                      disabled={submitting}
                      onClick={() =>
                        void submitReferralCode(pendingReferralCode, true)
                      }
                      type="button"
                    >
                      {submitting ? copy.submitting : copy.applyReferralCode}
                    </button>
                    <button
                      disabled={submitting}
                      onClick={dismissConfirmation}
                      type="button"
                    >
                      {copy.notNow}
                    </button>
                  </div>
                  {codeError ? <p role="alert">{codeError}</p> : null}
                </div>
              ) : (
                <form className="referral-entry" onSubmit={submitCode}>
                  <label>
                    <span>{copy.enterCode}</span>
                    <input
                      maxLength={12}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder={copy.codePlaceholder}
                      required
                      value={code}
                    />
                  </label>
                  <button disabled={submitting} type="submit">
                    {submitting ? copy.submitting : copy.submitCode}
                  </button>
                  {codeError ? <p role="alert">{codeError}</p> : null}
                </form>
              )}
            </section>
          ) : null}
        </>
      )}

      <section
        aria-labelledby="referral-program-title"
        className="referral-detail-section referral-rules-section"
      >
        <header className="referral-section-heading">
          <h2 id="referral-program-title">{copy.programTitle}</h2>
          <p>{copy.programSubtitle}</p>
        </header>
        <ol className="referral-program-steps">
          {copy.programSteps.map((step, index) => (
            <li key={step.title}>
              <span aria-hidden="true">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="referral-rewards-title"
        className="referral-detail-section referral-earnings-section"
      >
        <header className="referral-section-heading">
          <h2 id="referral-rewards-title">{copy.programRewardsTitle}</h2>
          <p>{copy.programRewardsIntro}</p>
        </header>
        <dl className="referral-earnings-list">
          <div>
            <dt>{copy.successfulReferralLabel}</dt>
            <dd>{copy.successfulReferralPoints}</dd>
          </div>
          <div>
            <dt>{copy.secondOrderBonusLabel}</dt>
            <dd>{copy.secondOrderBonus}</dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="referral-eligibility-title"
        className="referral-detail-section referral-eligibility-section"
      >
        <h2 id="referral-eligibility-title">{copy.eligibilityTitle}</h2>
        <ul>
          {copy.eligibilityItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </AccountPageShell>
  );
}
