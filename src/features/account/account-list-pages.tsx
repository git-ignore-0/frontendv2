"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { SiteContent } from "@/content/site-content";
import {
  buildAccountLevelOnePath,
  resolveAccountLevelOneBackHref,
} from "@/features/account/account-level-one-back";
import { AccountPagination } from "@/features/account/account-pagination";
import {
  accountApi,
  accountDateLocale,
  isAccountSessionError,
} from "@/features/account/api";
import {
  AccountBalanceSummary,
  AccountDetailHeader,
  AccountEmptyState,
  AccountErrorState,
  AccountLoadingState,
  AccountPageShell,
  AccountSignedOutState,
  accountBackFallbacks,
} from "@/features/account/account-presentation";
import type {
  InvitedUser,
  PaginationMeta,
  PointMeta,
  PointTransaction,
} from "@/features/account/types";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];

function InvitedPersonAvatar({
  locale,
  name,
}: {
  locale: Locale;
  name: string;
}) {
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase(locale) ?? "?";
  return (
    <span aria-hidden="true" className="invited-person-avatar">
      {initial}
    </span>
  );
}

export function PointHistoryPage({
  locale,
  copy,
  returnTo,
}: {
  locale: Locale;
  copy: Copy;
  returnTo?: string | string[] | null;
}) {
  const [items, setItems] = useState<PointTransaction[]>([]);
  const [meta, setMeta] = useState<PointMeta | null>(null);
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
      const payload = await accountApi<PointTransaction[], PointMeta>(
        `points?page=${page}`,
        { signal: controller.signal },
      );
      if (!isCurrentRequest()) return;
      setItems(payload.data);
      setMeta(payload.meta ?? null);
    } catch (caught) {
      if (!isCurrentRequest() || (caught instanceof Error && caught.name === "AbortError")) return;
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.error);
    } finally {
      if (!isCurrentRequest()) return;
      activeRequest.current = null;
      setLoading(false);
    }
  }, [copy.error, page]);

  useEffect(() => {
    void load();
    return () => {
      requestSequence.current += 1;
      activeRequest.current?.controller.abort();
      activeRequest.current = null;
    };
  }, [load]);

  const format = new Intl.DateTimeFormat(accountDateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const returnPath = `/account/${locale}/points`;
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
        locale={locale}
        copy={copy}
        returnPath={currentLevelOnePath}
      />
    );

  return (
    <AccountPageShell className="account-detail-page points-page">
      <AccountDetailHeader
        action={
          <AccountBalanceSummary
            action={
              <Link
                className="account-primary-action"
                href={buildAccountLevelOnePath({
                  locale,
                  currentPath: `/account/${locale}/rewards`,
                  returnTo: currentLevelOnePath,
                })}
              >
                {copy.redeemRewardsNow}
              </Link>
            }
            label={copy.pointsBalanceLabel}
            value={meta?.balance ?? "—"}
          />
        }
        backLabel={copy.back}
        backReplaceHref={backHref}
        subtitle={copy.pointsSubtitle}
        title={copy.pointsTitle}
      />
      {error ? (
        <AccountErrorState
          message={error}
          onRetry={() => void load()}
          retryLabel={copy.retry}
        />
      ) : loading && !meta ? (
        <AccountLoadingState message={copy.loading} />
      ) : items.length === 0 ? (
        <AccountEmptyState message={copy.historyEmpty} />
      ) : (
        <ul
          aria-busy={loading}
          className="account-record-list account-history-list"
        >
          {items.map((item) => (
            <li key={item.id}>
              <span>
                <strong className="account-record-title">{item.message}</strong>
                <time
                  className="account-record-meta"
                  dateTime={item.created_at}
                >
                  {format.format(new Date(item.created_at))}
                </time>
              </span>
              <b
                aria-label={`${item.direction === "credit" ? copy.credit : copy.debit}: ${item.amount}`}
                className={item.direction}
              >
                <span aria-hidden="true">
                  {item.direction === "credit" ? "+" : "−"}
                </span>
                <span aria-hidden="true">{item.amount}</span>
              </b>
            </li>
          ))}
        </ul>
      )}
      {meta && (
        <AccountPagination
          meta={meta}
          loading={loading}
          onPage={setPage}
          copy={copy}
        />
      )}
    </AccountPageShell>
  );
}

export function InvitedPeoplePage({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Copy;
}) {
  const [items, setItems] = useState<InvitedUser[]>([]);
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
      const payload = await accountApi<InvitedUser[], PaginationMeta>(
        `invited-users?page=${page}`,
        { signal: controller.signal },
      );
      if (!isCurrentRequest()) return;
      setItems(payload.data);
      setMeta(payload.meta ?? null);
    } catch (caught) {
      if (!isCurrentRequest() || (caught instanceof Error && caught.name === "AbortError")) return;
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.error);
    } finally {
      if (!isCurrentRequest()) return;
      activeRequest.current = null;
      setLoading(false);
    }
  }, [copy.error, page]);

  useEffect(() => {
    void load();
    return () => {
      requestSequence.current += 1;
      activeRequest.current?.controller.abort();
      activeRequest.current = null;
    };
  }, [load]);

  const format = new Intl.DateTimeFormat(accountDateLocale(locale), {
    dateStyle: "medium",
  });

  if (sessionExpired)
    return (
      <AccountSignedOutState
        locale={locale}
        copy={copy}
        returnPath={`/account/${locale}/invited`}
      />
    );

  return (
    <AccountPageShell className="account-detail-page invited-people-page">
      <AccountDetailHeader
        action={
          meta ? (
            <p className="invited-total">
              {(meta.total === 1
                ? copy.invitedTotalOne
                : copy.invitedTotal
              ).replace("{count}", String(meta.total))}
            </p>
          ) : null
        }
        backFallbackHref={accountBackFallbacks(locale).invited}
        backLabel={copy.invitedBack}
        subtitle={copy.invitedSubtitle}
        title={copy.invited}
      />
      {error ? (
        <AccountErrorState
          message={error}
          onRetry={() => void load()}
          retryLabel={copy.retry}
        />
      ) : loading && !meta ? (
        <AccountLoadingState message={copy.loading} />
      ) : items.length === 0 ? (
        <AccountEmptyState message={copy.invitedEmpty} />
      ) : (
        <ul
          aria-busy={loading}
          className="account-record-list account-invited-list"
        >
          {items.map((person) => (
            <li key={person.id}>
              <span className="invited-person-identity">
                <InvitedPersonAvatar locale={locale} name={person.name} />
                <span className="invited-person-content">
                  <strong className="invited-person-name">{person.name}</strong>
                  <span className="account-record-meta invited-person-context">
                    {copy.invitedPersonContext}
                  </span>
                </span>
              </span>
              <time
                className="account-record-meta invited-person-date"
                dateTime={person.referred_at}
              >
                {format.format(new Date(person.referred_at))}
              </time>
            </li>
          ))}
        </ul>
      )}
      {meta && (
        <AccountPagination
          meta={meta}
          loading={loading}
          onPage={setPage}
          copy={copy}
        />
      )}
    </AccountPageShell>
  );
}
