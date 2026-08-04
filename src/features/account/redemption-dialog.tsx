"use client";

import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from "react";

import {
  type AccountCopy,
  formatRewardPoints,
} from "@/features/account/reward-copy";
import type { Reward } from "@/features/account/types";

export function RedemptionDialog({
  reward,
  balance,
  copy,
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  reward: Reward;
  balance: number;
  copy: AccountCopy;
  submitting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(submitting);
  const remainingBalance = balance - reward.point_cost;
  submittingRef.current = submitting;

  useEffect(() => {
    const activeElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!submittingRef.current) onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (activeElement instanceof HTMLElement && activeElement.isConnected) {
        activeElement.focus();
      }
    };
  }, [onCancel]);

  function keepFocusInside(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (controls.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="redemption-dialog-backdrop"
      onMouseDown={(event) => {
        if (!submitting && event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        aria-describedby="redemption-dialog-description"
        aria-labelledby="redemption-dialog-title"
        aria-modal="true"
        className="redemption-dialog"
        onKeyDown={keepFocusInside}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <button
          aria-label={copy.closeDialog}
          className="redemption-dialog-close"
          disabled={submitting}
          onClick={onCancel}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
        <h2 id="redemption-dialog-title">{copy.dialogTitle}</h2>
        <p
          id="redemption-dialog-description"
          className="redemption-dialog-intro"
        >
          {copy.dialogDescription}
        </p>
        <div className="redemption-dialog-reward">
          <span>{copy.rewardName}</span>
          <strong>{reward.name}</strong>
          {reward.short_description ? <p>{reward.short_description}</p> : null}
        </div>
        <dl className="redemption-dialog-summary">
          <div>
            <dt>{copy.balance}</dt>
            <dd>{formatRewardPoints(copy, balance)}</dd>
          </div>
          <div className="is-required">
            <dt>{copy.pointsRequired}</dt>
            <dd>− {formatRewardPoints(copy, reward.point_cost)}</dd>
          </div>
          <div className="is-remaining">
            <dt>{copy.balanceAfterRedemption}</dt>
            <dd>{formatRewardPoints(copy, remainingBalance)}</dd>
          </div>
        </dl>
        {error ? (
          <p className="redemption-dialog-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="redemption-dialog-actions">
          <button disabled={submitting} onClick={onCancel} type="button">
            {copy.cancel}
          </button>
          <button
            className="primary"
            disabled={submitting}
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            {submitting ? copy.confirmingRedemption : copy.confirmRedemption}
          </button>
        </div>
      </div>
    </div>
  );
}
