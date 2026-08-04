"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { SiteContent } from "@/content/site-content";
import {
  AccountArrowIcon,
  AccountBackIcon,
  AccountChevronLeftIcon,
} from "@/features/account/account-icons";
import type { Locale } from "@/lib/i18n";

export function AccountPageShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`account-page-shell shell ${className}`.trim()}>
      {children}
    </div>
  );
}

export function accountBackFallbacks(locale: Locale) {
  const accountPath = `/account/${locale}`;
  return {
    invited: `${accountPath}/referral`,
    membershipUsage: `${accountPath}/membership`,
    redemptions: `${accountPath}/rewards`,
  };
}

function hasSafeSameOriginHistory() {
  if (typeof window === "undefined" || window.history.length <= 1) return false;
  const navigation = performance.getEntriesByType?.("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  if (navigation?.type === "reload") return false;

  if (navigation?.name) {
    const initialUrl = new URL(navigation.name, window.location.href);
    const currentUrl = new URL(window.location.href);
    if (
      initialUrl.origin === currentUrl.origin &&
      `${initialUrl.pathname}${initialUrl.search}${initialUrl.hash}` !==
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
    ) {
      return true;
    }
  }

  if (!document.referrer) return false;
  return new URL(document.referrer).origin === window.location.origin;
}

export function AccountBackButton({
  chevron = false,
  fallbackHref,
  label,
  showLabel = false,
}: {
  chevron?: boolean;
  fallbackHref: string;
  label: string;
  showLabel?: boolean;
}) {
  const router = useRouter();
  return (
    <button
      aria-label={label}
      className="account-back-button"
      onClick={() => {
        if (hasSafeSameOriginHistory()) {
          router.back();
          return;
        }
        router.replace(fallbackHref);
      }}
      type="button"
    >
      {chevron ? <AccountChevronLeftIcon /> : <AccountBackIcon />}
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

function AccountReplaceBackButton({
  chevron = false,
  href,
  label,
  showLabel = false,
}: {
  chevron?: boolean;
  href: string;
  label: string;
  showLabel?: boolean;
}) {
  const router = useRouter();
  return (
    <button
      aria-label={label}
      className="account-back-button"
      onClick={() => router.replace(href)}
      type="button"
    >
      {chevron ? <AccountChevronLeftIcon /> : <AccountBackIcon />}
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

export function AccountBalanceSummary({
  action,
  label,
  live = false,
  value,
}: {
  action?: React.ReactNode;
  label: string;
  live?: boolean;
  value: React.ReactNode;
}) {
  let liveMode: "polite" | undefined;
  if (live) liveMode = "polite";
  return (
    <div className="account-balance-summary">
      <div className="account-balance-summary-value" aria-live={liveMode}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {action ? (
        <div className="account-balance-summary-action">{action}</div>
      ) : null}
    </div>
  );
}

export function AccountDetailHeader({
  action,
  backFallbackHref,
  backLabel,
  backReplaceHref,
  subtitle,
  title,
}: {
  action?: React.ReactNode;
  backFallbackHref?: string;
  backLabel: string;
  backReplaceHref?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <>
      <div className="account-detail-back">
        {backReplaceHref ? (
          <AccountReplaceBackButton
            chevron
            href={backReplaceHref}
            label={backLabel}
            showLabel
          />
        ) : backFallbackHref ? (
          <AccountBackButton
            chevron
            fallbackHref={backFallbackHref}
            label={backLabel}
            showLabel
          />
        ) : null}
      </div>
      <header className="account-detail-header">
        <div className="account-detail-heading">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? (
          <div className="account-detail-header-side">{action}</div>
        ) : null}
      </header>
    </>
  );
}

export function AccountNavigationRow({
  description,
  href,
  title,
}: {
  description?: string;
  href: string;
  title: string;
}) {
  return (
    <Link className="account-navigation-row" href={href}>
      <span>
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </span>
      <AccountArrowIcon />
    </Link>
  );
}

export function AccountLoadingState({ message }: { message: string }) {
  return (
    <p aria-live="polite" className="account-request-state">
      {message}
    </p>
  );
}

export function AccountEmptyState({ message }: { message: string }) {
  return <p className="account-request-state is-empty">{message}</p>;
}

export function AccountErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div className="account-request-state is-error" role="alert">
      <p>{message}</p>
      <button onClick={onRetry} type="button">
        {retryLabel}
      </button>
    </div>
  );
}

export function AccountSignedOutState({
  locale,
  copy,
  returnPath = `/${locale}`,
}: {
  locale: Locale;
  copy: SiteContent["account"];
  returnPath?: string;
}) {
  return (
    <AccountPageShell className="account-page-shell-centered">
      <section className="account-signed-out-state">
        <h1>{copy.signedOutTitle}</h1>
        <p>{copy.signedOutBody}</p>
        <Link
          className="text-link"
          href={`/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(returnPath)}`}
        >
          {copy.signIn}
        </Link>
      </section>
    </AccountPageShell>
  );
}
