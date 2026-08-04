"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SiteContent } from "@/content/site-content";
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
      const payload = await accountApi<Redemption[], PaginationMeta>(
        `redemptions?locale=${locale}&page=${page}`,
        { signal: controller.signal },
      );
      if (!isCurrentRequest()) return;
      setItems(payload.data);
      setMeta(payload.meta ?? null);
    } catch (caught) {
      if (
        !isCurrentRequest() ||
        (caught instanceof Error && caught.name === "AbortError")
      )
        return;
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.redemptionsError);
    } finally {
      if (!isCurrentRequest()) return;
      activeRequest.current = null;
      setLoading(false);
    }
  }, [copy.redemptionsError, locale, page]);

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

  if (sessionExpired)
    return (
      <AccountSignedOutState
        locale={locale}
        copy={copy}
        returnPath={`/account/${locale}/redemptions`}
      />
    );

  return (
    <AccountPageShell className="account-detail-page redemption-list-page">
      <AccountDetailHeader
        backFallbackHref={accountBackFallbacks(locale).redemptions}
        backLabel={copy.backToRewards}
        title={copy.redemptionsTitle}
      />
      {error ? (
        <AccountErrorState
          message={error}
          onRetry={() => void load()}
          retryLabel={copy.retry}
        />
      ) : loading && !meta ? (
        <AccountLoadingState message={copy.redemptionsLoading} />
      ) : items.length === 0 ? (
        <AccountEmptyState message={copy.redemptionsEmpty} />
      ) : (
        <ol aria-busy={loading} className="account-record-list redemption-list">
          {items.map((item) => (
            <li key={item.id}>
              <div className="redemption-list-main">
                <div className="redemption-list-heading">
                  <p className="redemption-reward-name">{item.reward_name}</p>
                  <span className={`redemption-status is-${item.status}`}>
                    {statusLabel(copy, item.status)}
                  </span>
                </div>
                <div className="account-record-meta redemption-list-meta">
                  <time dateTime={item.created_at}>
                    {format.format(new Date(item.created_at))}
                  </time>
                </div>
              </div>
              <div className="redemption-list-summary">
                <p>
                  {copy.pointsUsed}: <strong>{item.point_cost_snapshot}</strong>{" "}
                  {copy.pointsUnit}
                </p>
              </div>
              {item.status === "rejected" && item.rejection_message ? (
                <div className="redemption-rejection">
                  <p>
                    <span>{copy.redemptionNote}:</span> {item.rejection_message}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {meta ? (
        <AccountPagination
          meta={meta}
          loading={loading}
          onPage={setPage}
          copy={copy}
        />
      ) : null}
    </AccountPageShell>
  );
}
