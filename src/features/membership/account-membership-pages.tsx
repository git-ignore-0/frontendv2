"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { SiteContent } from "@/content/site-content";
import {
  buildAccountLevelOnePath,
  resolveAccountLevelOneBackHref,
} from "@/features/account/account-level-one-back";
import { AccountArrowIcon } from "@/features/account/account-icons";
import {
  accountApi,
  accountDateLocale,
  isAccountSessionError,
} from "@/features/account/api";
import { AccountPagination } from "@/features/account/account-pagination";
import {
  AccountDetailHeader,
  AccountEmptyState,
  AccountErrorState,
  AccountLoadingState,
  AccountPageShell,
  AccountSignedOutState,
  accountBackFallbacks,
} from "@/features/account/account-presentation";
import type {
  CurrentMembership,
  MembershipQuota,
  MembershipUsage,
  PaginationMeta,
} from "@/features/account/types";
import {
  formatMembershipMoney,
  formatMembershipUnits,
  membershipUnitLabel,
} from "@/features/membership/format";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function membershipStatusLabel(
  status: CurrentMembership["status"],
  copy: Copy,
) {
  if (status === "scheduled") return copy.membershipScheduled;
  if (status === "ended") return copy.membershipEnded;
  return copy.membershipActive;
}

export function AccountMembershipPage({
  locale,
  copy,
  returnTo,
}: {
  locale: Locale;
  copy: Copy;
  returnTo?: string | string[] | null;
}) {
  const [membership, setMembership] = useState<CurrentMembership | null>(null);
  const [quota, setQuota] = useState<MembershipQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const requestSequence = useRef(0);
  const activeRequest = useRef<{
    controller: AbortController;
    sequence: number;
  } | null>(null);

  const load = useCallback(async () => {
    activeRequest.current?.controller.abort();
    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    activeRequest.current = { controller, sequence };
    const isCurrentRequest = () =>
      activeRequest.current?.sequence === sequence &&
      !controller.signal.aborted;

    setLoading(true);
    setError("");
    try {
      const current = await accountApi<CurrentMembership | null>(
        `memberships/current?locale=${locale}`,
        { signal: controller.signal },
      );
      if (!isCurrentRequest()) return;
      setMembership(current.data);
      setQuota(null);
      if (current.data?.status === "active") {
        const available = await accountApi<MembershipQuota | null>(
          `memberships/quota?locale=${locale}`,
          { signal: controller.signal },
        );
        if (!isCurrentRequest()) return;
        setQuota(available.data);
      }
    } catch (caught) {
      if (!isCurrentRequest() || isAbortError(caught)) return;
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.membershipError);
    } finally {
      if (!isCurrentRequest()) return;
      activeRequest.current = null;
      setLoading(false);
    }
  }, [copy.membershipError, locale]);

  useEffect(() => {
    void load();
    return () => {
      requestSequence.current += 1;
      activeRequest.current?.controller.abort();
      activeRequest.current = null;
    };
  }, [load]);

  const returnPath = `/account/${locale}/membership`;
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

  if (sessionExpired)
    return (
      <AccountSignedOutState
        copy={copy}
        locale={locale}
        returnPath={currentLevelOnePath}
      />
    );

  const date = new Intl.DateTimeFormat(accountDateLocale(locale), {
    dateStyle: "long",
  });
  return (
    <AccountPageShell className="account-detail-page membership-account-page">
      <AccountDetailHeader
        action={
          membership ? (
            <span className={`membership-status is-${membership.status}`}>
              {membershipStatusLabel(membership.status, copy)}
            </span>
          ) : null
        }
        backLabel={copy.back}
        backReplaceHref={backHref}
        subtitle={copy.membershipSubtitle}
        title={copy.membershipTitle}
      />
      {error ? (
        <AccountErrorState
          message={error}
          onRetry={() => void load()}
          retryLabel={copy.retry}
        />
      ) : loading ? (
        <AccountLoadingState message={copy.membershipLoading} />
      ) : !membership ? (
        <div className="membership-account-empty">
          <AccountEmptyState message={copy.membershipEmpty} />
          <Link className="membership-inline-link" href={`/${locale}/csa`}>
            {copy.viewCsa}
            <AccountArrowIcon />
          </Link>
        </div>
      ) : (
        <>
          <article className="membership-current-section">
            <header>
              <h2>{membership.package_name}</h2>
              {membership.package_description ? (
                <p>{membership.package_description}</p>
              ) : null}
            </header>
            <dl>
              <div>
                <dt>{copy.membershipDuration}</dt>
                <dd>
                  {(membership.duration_months === 1
                    ? copy.membershipMonth
                    : copy.membershipMonths
                  ).replace("{count}", String(membership.duration_months))}
                </dd>
              </div>
              <div>
                <dt>{copy.membershipMonthlyPrice}</dt>
                <dd>
                  {formatMembershipMoney(membership.monthly_price_vnd, locale)}
                </dd>
              </div>
              <div>
                <dt>{copy.membershipTotalPrice}</dt>
                <dd>
                  {formatMembershipMoney(membership.total_price_vnd, locale)}
                </dd>
              </div>
              <div>
                <dt>{copy.membershipStartDate}</dt>
                <dd>
                  {date.format(new Date(`${membership.start_date}T00:00:00`))}
                </dd>
              </div>
              <div>
                <dt>{copy.membershipEndDate}</dt>
                <dd>
                  {date.format(new Date(`${membership.end_date}T00:00:00`))}
                </dd>
              </div>
              <div>
                <dt>{copy.membershipQuotaPolicy}</dt>
                <dd>
                  {membership.quota_policy === "expire"
                    ? copy.membershipExpire
                    : copy.membershipRollover}
                </dd>
              </div>
            </dl>
          </article>

          {membership.status === "scheduled" ? (
            <p className="membership-scheduled-notice">
              {copy.membershipScheduledNotice.replace(
                "{date}",
                date.format(new Date(`${membership.start_date}T00:00:00`)),
              )}
            </p>
          ) : membership.status === "active" ? (
            <section
              className="membership-products-section"
              aria-labelledby="membership-products-title"
            >
              <div className="membership-section-heading">
                <h2 id="membership-products-title">
                  {copy.membershipQuotaTitle}
                </h2>
                <Link href={`/account/${locale}/membership/usage`}>
                  {copy.membershipUsageHistory}
                  <AccountArrowIcon />
                </Link>
              </div>
              {!quota?.products.length ? (
                <AccountEmptyState message={copy.membershipQuotaEmpty} />
              ) : (
                <ul className="membership-product-list">
                  {quota.products.map((product) => (
                    <li key={product.product_id}>
                      <span className="membership-product-content">
                        <strong>{product.product_name}</strong>
                        <span>
                          {copy.membershipQuotaPerCycle}:{" "}
                          {formatMembershipUnits(
                            product.unit_size,
                            product.quota_units_per_cycle,
                            locale,
                          )}{" "}
                          {membershipUnitLabel(locale, product)}
                        </span>
                      </span>
                      <span className="membership-product-remaining">
                        <span>{copy.membershipRemaining}</span>
                        <strong>
                          {formatMembershipUnits(
                            product.unit_size,
                            product.remaining_units,
                            locale,
                          )}{" "}
                          {membershipUnitLabel(locale, product)}
                        </strong>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </>
      )}
    </AccountPageShell>
  );
}

export function MembershipUsagePage({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Copy;
}) {
  const [items, setItems] = useState<MembershipUsage[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const requestSequence = useRef(0);
  const activeRequest = useRef<{
    controller: AbortController;
    sequence: number;
  } | null>(null);

  const load = useCallback(async () => {
    activeRequest.current?.controller.abort();
    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    activeRequest.current = { controller, sequence };
    const isCurrentRequest = () =>
      activeRequest.current?.sequence === sequence &&
      !controller.signal.aborted;

    setLoading(true);
    setError("");
    try {
      const payload = await accountApi<MembershipUsage[], PaginationMeta>(
        `memberships/usage?page=${page}&locale=${locale}`,
        { signal: controller.signal },
      );
      if (!isCurrentRequest()) return;
      setItems(payload.data);
      setMeta(payload.meta ?? null);
    } catch (caught) {
      if (!isCurrentRequest() || isAbortError(caught)) return;
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.membershipUsageError);
    } finally {
      if (!isCurrentRequest()) return;
      activeRequest.current = null;
      setLoading(false);
    }
  }, [copy.membershipUsageError, locale, page]);

  useEffect(() => {
    void load();
    return () => {
      requestSequence.current += 1;
      activeRequest.current?.controller.abort();
      activeRequest.current = null;
    };
  }, [load]);

  if (sessionExpired)
    return (
      <AccountSignedOutState
        copy={copy}
        locale={locale}
        returnPath={`/account/${locale}/membership/usage`}
      />
    );

  const date = new Intl.DateTimeFormat(accountDateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <AccountPageShell className="account-detail-page membership-usage-page">
      <AccountDetailHeader
        backFallbackHref={accountBackFallbacks(locale).membershipUsage}
        backLabel={copy.backToMembership}
        subtitle={copy.membershipUsageSubtitle}
        title={copy.membershipUsageTitle}
      />
      {error ? (
        <AccountErrorState
          message={error}
          onRetry={() => void load()}
          retryLabel={copy.retry}
        />
      ) : loading && !meta ? (
        <AccountLoadingState message={copy.membershipUsageLoading} />
      ) : items.length === 0 ? (
        <AccountEmptyState message={copy.membershipUsageEmpty} />
      ) : (
        <ol
          aria-busy={loading}
          className="account-record-list membership-usage-list"
        >
          {items.map((item) => (
            <li className="membership-usage-record" key={item.id}>
              <header className="membership-usage-record-header">
                <time dateTime={item.created_at}>
                  {date.format(new Date(item.created_at))}
                </time>
                <span className={`membership-usage-status is-${item.status}`}>
                  {item.status === "reversed"
                    ? copy.membershipUsageReversed
                    : copy.membershipUsageApplied}
                </span>
              </header>
              <div className="membership-usage-products">
                <span className="membership-usage-label">
                  {copy.membershipUsageProducts}
                </span>
                <ul className="membership-usage-product-list">
                  {item.lines.map((line) => (
                    <li key={line.product_id}>
                      <span className="membership-usage-product-name">
                        {line.product_name}
                      </span>
                      <strong className="membership-usage-product-quantity">
                        {formatMembershipUnits(
                          line.unit_size,
                          line.units,
                          locale,
                        )}{" "}
                        {membershipUnitLabel(locale, line)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
              {item.note ||
              (item.status === "reversed" && item.reversal?.reason) ? (
                <div className="membership-usage-callouts">
                  {item.note ? (
                    <div className="membership-usage-note">
                      <span>{copy.membershipUsageNote}</span>
                      <p>{item.note}</p>
                    </div>
                  ) : null}
                  {item.status === "reversed" && item.reversal?.reason ? (
                    <div className="membership-usage-note is-reversal">
                      <span>{copy.membershipUsageReversalReason}</span>
                      <p>{item.reversal.reason}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {meta ? (
        <AccountPagination
          copy={copy}
          loading={loading}
          meta={meta}
          onPage={setPage}
        />
      ) : null}
    </AccountPageShell>
  );
}
