"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import type { SiteContent } from "@/content/site-content";
import { AccountArrowIcon } from "@/features/account/account-icons";
import {
  accountApi,
  isAccountSessionError,
  referralErrorKey,
} from "@/features/account/api";
import { ReferralCodeButton } from "@/features/account/referral-code-button";
import type { AccountSummary } from "@/features/account/types";
import { useAccountSummary } from "@/features/account/use-account-summary";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];

export function ReferralProgramPage({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Copy;
}) {
  const { load, setSummary, state, summary } = useAccountSummary();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const returnPath = `/account/${locale}/referral`;

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setCodeError("");
    try {
      const payload = await accountApi<AccountSummary>("submit-code", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setSummary(payload.data);
      setCode("");
    } catch (error) {
      if (isAccountSessionError(error)) {
        setSessionExpired(true);
        return;
      }
      const message = error instanceof Error ? error.message : "";
      setCodeError(copy[referralErrorKey(message)]);
    } finally {
      setSubmitting(false);
    }
  }

  const accountPath = `/account/${locale}`;
  const signedOut = state === "signed-out" || sessionExpired;
  return (
    <div className="referral-program-page">
      <header className="referral-program-hero">
        <div className="shell">
          <p className="eyebrow">{copy.referralProgramEyebrow}</p>
          <h1>{copy.referralProgramTitle}</h1>
          <strong>{copy.referralProgramTagline}</strong>
          <p>{copy.referralProgramIntro}</p>
        </div>
      </header>

      <div className="referral-program-layout shell">
        <section
          aria-labelledby="personal-referral-title"
          className="referral-program-personal"
        >
          <p className="eyebrow">{copy.personalReferralTitle}</p>
          {signedOut ? (
            <div className="referral-personal-state">
              <h2 id="personal-referral-title">{copy.getCodeTitle}</h2>
              <p>{copy.getCodeBody}</p>
              <Link
                className="referral-sign-in"
                href={`/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(returnPath)}`}
              >
                {copy.signInForCode}
                <AccountArrowIcon />
              </Link>
            </div>
          ) : state === "loading" ? (
            <div className="referral-personal-state" aria-live="polite">
              <h2 id="personal-referral-title">{copy.getCodeTitle}</h2>
              <p>{copy.personalCodeLoading}</p>
            </div>
          ) : state === "error" || !summary ? (
            <div className="referral-personal-state" role="alert">
              <h2 id="personal-referral-title">{copy.getCodeTitle}</h2>
              <p>{copy.personalCodeError}</p>
              <button onClick={() => void load()}>{copy.retry}</button>
            </div>
          ) : (
            <>
              <h2 id="personal-referral-title">{copy.codeLabel}</h2>
              <ReferralCodeButton code={summary.referral_code} copy={copy} />
              {summary.referrer ? (
                <p className="referrer-status">
                  {copy.referredBy.replace("{name}", summary.referrer.name)}
                </p>
              ) : summary.can_submit_referral_code ? (
                <div className="referral-entry-panel">
                  <h3>{copy.enterCodeTitle}</h3>
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
                    <button disabled={submitting}>
                      {submitting ? copy.submitting : copy.submitCode}
                    </button>
                    {codeError ? <p role="alert">{codeError}</p> : null}
                  </form>
                </div>
              ) : null}
            </>
          )}

          <div className="referral-personal-actions">
            <h3>{copy.programActionsTitle}</h3>
            <nav aria-label={copy.navigation}>
              <Link href={`${accountPath}/rewards`}>
                <span>{copy.redeemRewards}</span>
                <AccountArrowIcon />
              </Link>
              <Link href={`${accountPath}/redemptions`}>
                <span>{copy.redemptionHistory}</span>
                <AccountArrowIcon />
              </Link>
            </nav>
          </div>
        </section>

        <div className="referral-program-guide">
          <section aria-labelledby="referral-program-title">
            <header className="referral-section-heading">
              <h2 id="referral-program-title">{copy.programTitle}</h2>
              <p>{copy.programSubtitle}</p>
            </header>
            <ol className="referral-program-steps">
              {copy.programSteps.map((step, index) => (
                <li key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
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
            className="referral-program-earnings"
          >
            <header className="referral-section-heading">
              <h2 id="referral-rewards-title">{copy.programRewardsTitle}</h2>
              <p>{copy.programRewardsIntro}</p>
            </header>
            <div>
              <article>
                <strong>{copy.successfulReferralPoints}</strong>
                <p>{copy.successfulReferralLabel}</p>
              </article>
              <article>
                <strong>{copy.secondOrderBonus}</strong>
                <p>{copy.secondOrderBonusLabel}</p>
              </article>
            </div>
          </section>

          <section
            aria-labelledby="referral-eligibility-title"
            className="referral-program-eligibility"
          >
            <h2 id="referral-eligibility-title">{copy.eligibilityTitle}</h2>
            <ul>
              {copy.eligibilityItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
