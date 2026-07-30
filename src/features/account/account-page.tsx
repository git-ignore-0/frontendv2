"use client";

import Link from "next/link";

import type { SiteContent } from "@/content/site-content";
import { AccountArrowIcon } from "@/features/account/account-icons";
import { ReferralCodeButton } from "@/features/account/referral-code-button";
import { useAccountSummary } from "@/features/account/use-account-summary";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];

export function AccountPage({ locale, copy }: { locale: Locale; copy: Copy }) {
  const { load, state, summary } = useAccountSummary();

  if (state === "signed-out")
    return <SignedOutAccount locale={locale} copy={copy} />;
  if (state === "loading")
    return <div className="account-state shell">{copy.loading}</div>;
  if (state === "error" || !summary) {
    return (
      <div className="account-state shell">
        <p>{copy.error}</p>
        <button onClick={() => void load()}>{copy.retry}</button>
      </div>
    );
  }

  const accountPath = `/account/${locale}`;
  return (
    <div className="account-page shell">
      <header className="account-overview-header">
        <h1>{copy.title}</h1>
        <a
          className="account-profile-action"
          href={`/api/auth/account?returnTo=${encodeURIComponent(accountPath)}`}
        >
          {copy.editProfile}
          <AccountArrowIcon />
        </a>
      </header>

      <section className="account-metrics" aria-label={copy.overview}>
        <article className="account-metric">
          <p>{copy.balance}</p>
          <strong>
            {summary.points_balance} <small>{copy.pointsUnit}</small>
          </strong>
          <Link
            aria-label={copy.viewHistory}
            className="account-detail-link"
            href={`${accountPath}/points`}
          >
            {copy.viewDetails}
            <AccountArrowIcon />
          </Link>
        </article>
        <article className="account-metric">
          <p>{copy.invited}</p>
          <strong>{summary.invited_count}</strong>
          <Link
            aria-label={copy.viewInvited}
            className="account-detail-link"
            href={`${accountPath}/invited`}
          >
            {copy.viewDetails}
            <AccountArrowIcon />
          </Link>
        </article>
      </section>

      <section className="account-referral" aria-labelledby="referral-title">
        <div className="account-referral-heading">
          <h2 id="referral-title">{copy.codeLabel}</h2>
        </div>
        <ReferralCodeButton code={summary.referral_code} copy={copy} />
      </section>

      <Link className="account-program-link" href={`${accountPath}/referral`}>
        <span>
          <small>{copy.referral}</small>
          <strong>{copy.referralProgramTitle}</strong>
        </span>
        <span className="account-program-link-action">
          {copy.viewDetails}
          <AccountArrowIcon />
        </span>
      </Link>
    </div>
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
