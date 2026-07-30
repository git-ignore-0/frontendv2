"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { SiteContent } from "@/content/site-content";
import { AccountBackIcon } from "@/features/account/account-icons";
import { SignedOutAccount } from "@/features/account/account-page";
import {
  accountApi,
  accountDateLocale,
  isAccountSessionError,
} from "@/features/account/api";
import type {
  InvitedUser,
  PaginationMeta,
  PointMeta,
  PointTransaction,
} from "@/features/account/types";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];

export function AccountListHeading({
  locale,
  copy,
  title,
}: {
  locale: Locale;
  copy: Copy;
  title: string;
}) {
  return (
    <header className="account-list-heading">
      <Link
        aria-label={copy.backToAccount}
        className="account-back-link"
        href={`/account/${locale}`}
      >
        <AccountBackIcon />
      </Link>
      <h1>{title}</h1>
    </header>
  );
}

export function Pager({
  meta,
  loading,
  onPage,
  copy,
}: {
  meta: PaginationMeta;
  loading: boolean;
  onPage: (page: number) => void;
  copy: Copy;
}) {
  const pages = Math.max(1, Math.ceil(meta.total / meta.page_size));
  if (pages <= 1) return null;
  return (
    <nav className="account-pagination" aria-label={copy.paginationLabel}>
      <button
        disabled={loading || meta.page <= 1}
        onClick={() => onPage(meta.page - 1)}
      >
        {copy.previous}
      </button>
      <span>
        {copy.page
          .replace("{page}", String(meta.page))
          .replace("{pages}", String(pages))}
      </span>
      <button
        disabled={loading || meta.page >= pages}
        onClick={() => onPage(meta.page + 1)}
      >
        {copy.next}
      </button>
    </nav>
  );
}

export function PointHistoryPage({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Copy;
}) {
  const [items, setItems] = useState<PointTransaction[]>([]);
  const [meta, setMeta] = useState<PointMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await accountApi<PointTransaction[], PointMeta>(
        `points?page=${page}`,
      );
      setItems(payload.data);
      setMeta(payload.meta ?? null);
    } catch (caught) {
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.error);
    } finally {
      setLoading(false);
    }
  }, [copy.error, page]);

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
        returnPath={`/account/${locale}/points`}
      />
    );

  return (
    <div className="account-list-page shell">
      <AccountListHeading locale={locale} copy={copy} title={copy.history} />
      <div className="account-list-summary">
        <span>{copy.balance}</span>
        <strong>{meta?.balance ?? "—"}</strong>
        <small>{copy.pointsUnit}</small>
      </div>
      {error ? (
        <div className="account-inline-state" role="alert">
          <p>{error}</p>
          <button onClick={() => void load()}>{copy.retry}</button>
        </div>
      ) : loading && !meta ? (
        <p className="account-inline-state">{copy.loading}</p>
      ) : items.length === 0 ? (
        <p className="account-empty">{copy.historyEmpty}</p>
      ) : (
        <ul
          aria-busy={loading}
          className="account-record-list account-history-list"
        >
          {items.map((item) => (
            <li key={item.id}>
              <span>
                <strong>{item.message}</strong>
                <time dateTime={item.created_at}>
                  {format.format(new Date(item.created_at))}
                </time>
              </span>
              <b className={item.direction}>
                {item.direction === "credit" ? "+" : "−"}
                {item.amount}
              </b>
            </li>
          ))}
        </ul>
      )}
      {meta && (
        <Pager meta={meta} loading={loading} onPage={setPage} copy={copy} />
      )}
    </div>
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await accountApi<InvitedUser[], PaginationMeta>(
        `invited-users?page=${page}`,
      );
      setItems(payload.data);
      setMeta(payload.meta ?? null);
    } catch (caught) {
      if (isAccountSessionError(caught)) setSessionExpired(true);
      else setError(copy.error);
    } finally {
      setLoading(false);
    }
  }, [copy.error, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const format = new Intl.DateTimeFormat(accountDateLocale(locale), {
    dateStyle: "medium",
  });

  if (sessionExpired)
    return (
      <SignedOutAccount
        locale={locale}
        copy={copy}
        returnPath={`/account/${locale}/invited`}
      />
    );

  return (
    <div className="account-list-page shell">
      <AccountListHeading locale={locale} copy={copy} title={copy.invited} />
      {error ? (
        <div className="account-inline-state" role="alert">
          <p>{error}</p>
          <button onClick={() => void load()}>{copy.retry}</button>
        </div>
      ) : loading && !meta ? (
        <p className="account-inline-state">{copy.loading}</p>
      ) : items.length === 0 ? (
        <p className="account-empty">{copy.invitedEmpty}</p>
      ) : (
        <ol
          aria-busy={loading}
          className="account-record-list account-invited-list"
          start={meta ? (meta.page - 1) * meta.page_size + 1 : 1}
        >
          {items.map((person) => (
            <li key={person.id}>
              <span>{person.name}</span>
              <time dateTime={person.referred_at}>
                {format.format(new Date(person.referred_at))}
              </time>
            </li>
          ))}
        </ol>
      )}
      {meta && (
        <Pager meta={meta} loading={loading} onPage={setPage} copy={copy} />
      )}
    </div>
  );
}
