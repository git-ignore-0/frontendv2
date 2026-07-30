"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { SiteContent } from "@/content/site-content";
import {
  AccountArrowIcon,
  AccountBackIcon,
} from "@/features/account/account-icons";
import { SignedOutAccount } from "@/features/account/account-page";
import {
  accountApi,
  accountDateLocale,
  isAccountSessionError,
} from "@/features/account/api";
import {
  AccountListHeading,
  Pager,
} from "@/features/account/account-list-pages";
import type {
  PaginationMeta,
  Redemption,
  RedemptionStatus,
} from "@/features/account/types";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];

function statusLabel(copy: Copy, status: RedemptionStatus) {
  const labels = {
    pending: copy.statusPending,
    contacted: copy.statusContacted,
    completed: copy.statusCompleted,
    rejected: copy.statusRejected,
  };
  return labels[status];
}

export function RedemptionsPage({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Copy;
}) {
  const [items, setItems] = useState<Redemption[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await accountApi<Redemption[], PaginationMeta>(
        `redemptions?locale=${locale}&page=${page}`,
      );
      setItems(payload.data);
      setMeta(payload.meta ?? null);
    } catch (caught) {
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.redemptionsError);
    } finally {
      setLoading(false);
    }
  }, [copy.redemptionsError, locale, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const format = new Intl.DateTimeFormat(accountDateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (sessionExpired)
    return (
      <SignedOutAccount
        locale={locale}
        copy={copy}
        returnPath={`/account/${locale}/redemptions`}
      />
    );

  return (
    <div className="account-list-page redemption-list-page shell">
      <AccountListHeading
        locale={locale}
        copy={copy}
        title={copy.redemptionsTitle}
      />
      <div className="redemption-list-actions">
        <Link href={`/account/${locale}/rewards`}>
          {copy.redeemRewards}
          <AccountArrowIcon />
        </Link>
      </div>
      {error ? (
        <div className="account-inline-state" role="alert">
          <p>{error}</p>
          <button onClick={() => void load()}>{copy.retry}</button>
        </div>
      ) : loading && !meta ? (
        <p aria-live="polite" className="account-inline-state">
          {copy.redemptionsLoading}
        </p>
      ) : items.length === 0 ? (
        <p className="account-empty">{copy.redemptionsEmpty}</p>
      ) : (
        <ol aria-busy={loading} className="account-record-list redemption-list">
          {items.map((item) => (
            <li key={item.id}>
              <div className="redemption-list-main">
                <span className={`redemption-status is-${item.status}`}>
                  {statusLabel(copy, item.status)}
                </span>
                <h2>{item.reward_name}</h2>
                <p>
                  {copy.pointsUsed}: <strong>{item.point_cost_snapshot}</strong>{" "}
                  {copy.pointsUnit}
                </p>
                <time dateTime={item.created_at}>
                  {format.format(new Date(item.created_at))}
                </time>
                {item.status === "rejected" && item.rejection_message ? (
                  <p className="redemption-rejection">
                    {item.rejection_message}
                  </p>
                ) : null}
              </div>
              <Link
                aria-label={`${copy.viewDetails}: ${item.reward_name}`}
                href={`/account/${locale}/redemptions/${item.id}`}
              >
                {copy.viewDetails}
                <AccountArrowIcon />
              </Link>
            </li>
          ))}
        </ol>
      )}
      {meta ? (
        <Pager meta={meta} loading={loading} onPage={setPage} copy={copy} />
      ) : null}
    </div>
  );
}

export function RedemptionDetailPage({
  locale,
  redemptionId,
  copy,
}: {
  locale: Locale;
  redemptionId: string;
  copy: Copy;
}) {
  const [item, setItem] = useState<Redemption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await accountApi<Redemption>(
        `redemptions/${encodeURIComponent(redemptionId)}?locale=${locale}`,
      );
      setItem(payload.data);
    } catch (caught) {
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.redemptionDetailError);
    } finally {
      setLoading(false);
    }
  }, [copy.redemptionDetailError, locale, redemptionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const format = new Intl.DateTimeFormat(accountDateLocale(locale), {
    dateStyle: "long",
    timeStyle: "short",
  });

  if (sessionExpired)
    return (
      <SignedOutAccount
        locale={locale}
        copy={copy}
        returnPath={`/account/${locale}/redemptions/${redemptionId}`}
      />
    );

  return (
    <div className="account-list-page redemption-detail-page shell">
      <header className="account-list-heading">
        <Link
          aria-label={copy.backToRedemptions}
          className="account-back-link"
          href={`/account/${locale}/redemptions`}
        >
          <AccountBackIcon />
        </Link>
        <h1>{copy.redemptionDetailTitle}</h1>
      </header>
      {error ? (
        <div className="account-inline-state" role="alert">
          <p>{error}</p>
          <button onClick={() => void load()}>{copy.retry}</button>
        </div>
      ) : loading || !item ? (
        <p aria-live="polite" className="account-inline-state">
          {copy.redemptionsLoading}
        </p>
      ) : (
        <article className="redemption-detail-card">
          <div className="redemption-detail-heading">
            <span className={`redemption-status is-${item.status}`}>
              {statusLabel(copy, item.status)}
            </span>
            <h2>{item.reward_name}</h2>
          </div>
          <dl>
            <div>
              <dt>{copy.requestStatus}</dt>
              <dd>{statusLabel(copy, item.status)}</dd>
            </div>
            <div>
              <dt>{copy.pointsUsed}</dt>
              <dd>
                {item.point_cost_snapshot} {copy.pointsUnit}
              </dd>
            </div>
            <div>
              <dt>{copy.requestedOn}</dt>
              <dd>
                <time dateTime={item.created_at}>
                  {format.format(new Date(item.created_at))}
                </time>
              </dd>
            </div>
            <div>
              <dt>{copy.updatedOn}</dt>
              <dd>
                <time dateTime={item.updated_at}>
                  {format.format(new Date(item.updated_at))}
                </time>
              </dd>
            </div>
          </dl>
          {item.status === "rejected" && item.rejection_message ? (
            <div className="redemption-detail-rejection">
              <h3>{copy.rejectionReason}</h3>
              <p>{item.rejection_message}</p>
            </div>
          ) : null}
          <Link
            className="redemption-detail-rewards-link"
            href={`/account/${locale}/rewards`}
          >
            {copy.backToRewards}
            <AccountArrowIcon />
          </Link>
        </article>
      )}
    </div>
  );
}
