"use client";

import type { TrackerCopy } from "./types";

export function TrackerState({
  copy,
  state,
  onRetry,
}: {
  copy: TrackerCopy;
  state: "loading" | "empty" | "error";
  onRetry?: () => void;
}) {
  if (state === "loading") {
    return (
      <section
        aria-live="polite"
        className="tracker-state tracker-state-loading"
        role="status"
      >
        <p>{copy.loading}</p>
        <div aria-hidden="true" className="tracker-state-skeleton">
          <span />
          <span />
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="tracker-state" role="alert">
        <h2>{copy.error}</h2>
        <button className="tracker-retry" onClick={onRetry} type="button">
          {copy.retry}
        </button>
      </section>
    );
  }

  return (
    <section className="tracker-state" role="status">
      <h2>{copy.emptyTitle}</h2>
      <p>{copy.emptyBody}</p>
    </section>
  );
}
