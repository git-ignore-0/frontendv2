"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AccountArrowIcon } from "@/features/account/account-icons";
import {
  buildAccountLevelOnePath,
  resolveAccountLevelOneBackHref,
} from "@/features/account/account-level-one-back";
import {
  AccountApiError,
  accountApi,
  isAccountSessionError,
  redemptionErrorKey,
} from "@/features/account/api";
import { AccountPagination } from "@/features/account/account-pagination";
import { AccountGiftIcon } from "@/features/account/account-icons";
import {
  AccountBalanceSummary,
  AccountDetailHeader,
  AccountEmptyState,
  AccountErrorState,
  AccountLoadingState,
  AccountPageShell,
} from "@/features/account/account-presentation";
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
  returnTo,
}: {
  locale: Locale;
  copy: AccountCopy;
  returnTo?: string | string[] | null;
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
  const attemptRef = useRef<Attempt | null>(null);
  const catalogSequence = useRef(0);
  const catalogRequest = useRef<{
    controller: AbortController;
    sequence: number;
  } | null>(null);

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
    catalogRequest.current?.controller.abort();
    const controller = new AbortController();
    const sequence = ++catalogSequence.current;
    catalogRequest.current = { controller, sequence };
    const isCurrentRequest = () =>
      catalogRequest.current?.sequence === sequence &&
      !controller.signal.aborted;

    setCatalogLoading(true);
    setCatalogError("");
    try {
      const payload = await accountApi<Reward[], PaginationMeta>(
        `rewards?locale=${locale}&page=${page}`,
        { signal: controller.signal },
      );
      if (!isCurrentRequest()) return;
      setRewards(payload.data);
      setMeta(payload.meta ?? null);
    } catch (caught) {
      if (
        !isCurrentRequest() ||
        (caught instanceof Error && caught.name === "AbortError")
      )
        return;
      setCatalogError(copy.catalogError);
    } finally {
      if (!isCurrentRequest()) return;
      catalogRequest.current = null;
      setCatalogLoading(false);
    }
  }, [copy.catalogError, locale, page]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    void loadCatalog();
    return () => {
      catalogSequence.current += 1;
      catalogRequest.current?.controller.abort();
      catalogRequest.current = null;
    };
  }, [loadCatalog]);

  function openAttempt(reward: Reward) {
    if (attempt || attemptRef.current || submittingRef.current) return;
    const nextAttempt = { reward, idempotencyKey: crypto.randomUUID() };
    attemptRef.current = nextAttempt;
    setSubmitError("");
    setAttempt(nextAttempt);
  }

  const closeAttempt = useCallback(() => {
    if (submittingRef.current) return;
    attemptRef.current = null;
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
      attemptRef.current = null;
      setAttempt(null);
    } catch (caught) {
      if (isAccountSessionError(caught)) {
        attemptRef.current = null;
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
  const loginHref = `/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(currentLevelOnePath)}`;

  return (
    <AccountPageShell className="account-detail-page rewards-page">
      <AccountDetailHeader
        action={
          <div className="rewards-balance-panel">
            <span className="rewards-balance-icon">
              <AccountGiftIcon />
            </span>
            <AccountBalanceSummary
              action={
                <div className="account-balance-links">
                  {accountState === "signed-out" ? (
                    <Link href={loginHref} prefetch={false}>
                      {copy.signIn}
                    </Link>
                  ) : null}
                  <Link href={`/account/${locale}/redemptions`}>
                    {copy.redemptionHistory}
                  </Link>
                </div>
              }
              label={copy.pointsTitle}
              live
              value={balance ?? "—"}
            />
          </div>
        }
        backLabel={copy.back}
        backReplaceHref={backHref}
        subtitle={copy.catalogIntro}
        title={copy.redeemRewards}
      />

      <section className="reward-catalog" aria-label={copy.redeemRewards}>
        {accountState === "error" ? (
          <AccountErrorState
            message={copy.error}
            onRetry={() => void loadAccount()}
            retryLabel={copy.retry}
          />
        ) : null}

        {created ? (
          <div className="redemption-confirmation" role="status">
            <div>
              <strong>{copy.redemptionSuccessTitle}</strong>
              <p>{copy.redemptionSuccessBody}</p>
            </div>
            <Link href={`/account/${locale}/redemptions`}>
              {copy.redemptionHistory}
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
          <AccountErrorState
            message={catalogError}
            onRetry={() => void loadCatalog()}
            retryLabel={copy.retry}
          />
        ) : catalogLoading && !meta ? (
          <AccountLoadingState message={copy.catalogLoading} />
        ) : rewards.length === 0 ? (
          <AccountEmptyState message={copy.catalogEmpty} />
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
                    <span className="reward-card-cost">
                      {formatRewardPoints(copy, reward.point_cost)}
                    </span>
                  </div>
                  <div className="reward-card-body">
                    <h3>{reward.name}</h3>
                    {reward.short_description ? (
                      <p>{reward.short_description}</p>
                    ) : null}
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
          <AccountPagination
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
    </AccountPageShell>
  );
}
