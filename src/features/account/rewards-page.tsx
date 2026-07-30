"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AccountArrowIcon } from "@/features/account/account-icons";
import {
  AccountApiError,
  accountApi,
  isAccountSessionError,
  redemptionErrorKey,
} from "@/features/account/api";
import {
  AccountListHeading,
  Pager,
} from "@/features/account/account-list-pages";
import { RedemptionDialog } from "@/features/account/redemption-dialog";
import {
  type AccountCopy,
  formatRewardPoints,
} from "@/features/account/reward-copy";
import { rewardImageSources } from "@/features/account/reward-media";
import type {
  AccountSummary,
  PaginationMeta,
  RedemptionCreated,
  Reward,
} from "@/features/account/types";
import type { Locale } from "@/lib/i18n";

type Attempt = { reward: Reward; idempotencyKey: string };
type AccountState = "loading" | "signed-in" | "signed-out" | "error";

function rewardActionLabel(
  copy: AccountCopy,
  accountState: AccountState,
  canRedeem: boolean,
) {
  if (accountState === "loading") return copy.loading;
  if (accountState === "error") return copy.balanceUnavailable;
  return canRedeem ? copy.redeem : copy.notEnoughPoints;
}

export function RewardsPage({
  locale,
  copy,
}: {
  locale: Locale;
  copy: AccountCopy;
}) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [accountState, setAccountState] = useState<AccountState>("loading");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [created, setCreated] = useState<RedemptionCreated | null>(null);
  const submittingRef = useRef(false);

  const loadAccount = useCallback(async () => {
    setAccountState("loading");
    try {
      const payload = await accountApi<AccountSummary>("account");
      setBalance(payload.data.points_balance);
      setAccountState("signed-in");
    } catch (caught) {
      setBalance(null);
      if (isAccountSessionError(caught)) {
        setAccountState("signed-out");
      } else {
        setAccountState("error");
      }
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const payload = await accountApi<Reward[], PaginationMeta>(
        `rewards?locale=${locale}&page=${page}`,
      );
      setRewards(payload.data);
      setMeta(payload.meta ?? null);
    } catch {
      setCatalogError(copy.catalogError);
    } finally {
      setCatalogLoading(false);
    }
  }, [copy.catalogError, locale, page]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  function openAttempt(reward: Reward) {
    setSubmitError("");
    setAttempt({ reward, idempotencyKey: crypto.randomUUID() });
  }

  const closeAttempt = useCallback(() => {
    if (submittingRef.current) return;
    setAttempt(null);
    setSubmitError("");
  }, []);

  async function submitRedemption() {
    if (!attempt || accountState !== "signed-in" || submittingRef.current)
      return;
    if (balance === null || balance < attempt.reward.point_cost) {
      setSubmitError(copy.redemptionInsufficient);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = await accountApi<RedemptionCreated>("redemptions", {
        method: "POST",
        body: JSON.stringify({
          reward_id: attempt.reward.id,
          idempotency_key: attempt.idempotencyKey,
        }),
      });
      setBalance(payload.data.balance);
      setCreated(payload.data);
      setAttempt(null);
    } catch (caught) {
      if (isAccountSessionError(caught)) {
        setAttempt(null);
        setBalance(null);
        setAccountState("signed-out");
        return;
      }
      const message = caught instanceof Error ? caught.message : "";
      if (
        message === "insufficient_points" ||
        (caught instanceof AccountApiError && caught.status === 409)
      ) {
        await Promise.allSettled([loadAccount(), loadCatalog()]);
      }
      setSubmitError(copy[redemptionErrorKey(message)]);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const returnPath = `/account/${locale}/rewards`;
  const loginHref = `/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(returnPath)}`;

  return (
    <div className="account-list-page rewards-page shell">
      <AccountListHeading
        locale={locale}
        copy={copy}
        title={copy.catalogTitle}
      />

      <section className="reward-catalog" aria-labelledby="catalog-title">
        <header className="reward-catalog-heading">
          <p id="catalog-title">{copy.catalogIntro}</p>
          <div className="reward-balance" aria-live="polite">
            <span>{copy.balance}</span>
            <strong>{balance ?? "—"}</strong>
            <small>{copy.pointsUnit}</small>
            {accountState === "signed-out" ? (
              <Link href={loginHref} prefetch={false}>
                {copy.signIn}
              </Link>
            ) : null}
          </div>
        </header>

        {accountState === "error" ? (
          <div className="account-inline-state" role="alert">
            <p>{copy.error}</p>
            <button onClick={() => void loadAccount()}>{copy.retry}</button>
          </div>
        ) : null}

        {created ? (
          <div className="redemption-confirmation" role="status">
            <div>
              <strong>{copy.redemptionSuccessTitle}</strong>
              <p>{copy.redemptionSuccessBody}</p>
            </div>
            <Link
              href={`/account/${locale}/redemptions/${created.redemption.id}`}
            >
              {copy.viewRedemption}
              <AccountArrowIcon />
            </Link>
            <button
              aria-label={copy.dismissConfirmation}
              onClick={() => setCreated(null)}
              type="button"
            >
              ×
            </button>
          </div>
        ) : null}

        {catalogError ? (
          <div className="account-inline-state" role="alert">
            <p>{catalogError}</p>
            <button onClick={() => void loadCatalog()}>{copy.retry}</button>
          </div>
        ) : catalogLoading && !meta ? (
          <p aria-live="polite" className="account-inline-state">
            {copy.catalogLoading}
          </p>
        ) : rewards.length === 0 ? (
          <p className="account-empty">{copy.catalogEmpty}</p>
        ) : (
          <div aria-busy={catalogLoading} className="reward-grid">
            {rewards.map((reward) => {
              const canRedeem =
                accountState === "signed-in" &&
                balance !== null &&
                balance >= reward.point_cost;
              const imageSources = rewardImageSources(reward.image);
              return (
                <article className="reward-card" key={reward.id}>
                  <div className="reward-card-image">
                    {/* The trusted backend returns the media origin at runtime. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      height={reward.image.height}
                      loading="lazy"
                      sizes="(max-width: 420px) calc(100vw - 2rem), (max-width: 760px) calc(50vw - 1.5rem), 24rem"
                      src={imageSources.src}
                      srcSet={imageSources.srcSet}
                      width={reward.image.width}
                    />
                  </div>
                  <div className="reward-card-body">
                    <h3>{reward.name}</h3>
                    {reward.short_description ? (
                      <p>{reward.short_description}</p>
                    ) : null}
                    <strong>
                      {formatRewardPoints(copy, reward.point_cost)}
                    </strong>
                    {accountState === "signed-out" ? (
                      <Link
                        aria-label={copy.signInToRedeem.replace(
                          "{name}",
                          reward.name,
                        )}
                        className="reward-card-action"
                        href={loginHref}
                        prefetch={false}
                      >
                        {copy.signInToRedeemLabel}
                      </Link>
                    ) : (
                      <button
                        aria-label={copy.openRedemption.replace(
                          "{name}",
                          reward.name,
                        )}
                        className="reward-card-action"
                        disabled={!canRedeem || catalogLoading}
                        onClick={() => openAttempt(reward)}
                        type="button"
                      >
                        {rewardActionLabel(copy, accountState, canRedeem)}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {meta ? (
          <Pager
            meta={meta}
            loading={catalogLoading}
            onPage={setPage}
            copy={copy}
          />
        ) : null}
      </section>

      {attempt && balance !== null ? (
        <RedemptionDialog
          balance={balance}
          copy={copy}
          error={submitError}
          onCancel={closeAttempt}
          onConfirm={() => void submitRedemption()}
          reward={attempt.reward}
          submitting={submitting}
        />
      ) : null}
    </div>
  );
}
