"use client";

import { useEffect, useState } from "react";

import type { SiteContent } from "@/content/site-content";

type Copy = SiteContent["account"];

function buttonClass(status: string) {
  if (status === "copied") return "is-copied";
  return undefined;
}

function feedbackProps(status: string) {
  if (status === "failed") {
    return { className: "copy-status-error", role: "alert" as const };
  }
  return { className: "sr-only", role: undefined };
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function ReferralCodeButton({
  code,
  copy,
}: {
  code: string;
  copy: Copy;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const feedback = feedbackProps(status);

  useEffect(() => {
    if (status !== "copied") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyCode() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard is unavailable");
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="referral-code-control">
      <button
        aria-label={status === "copied" ? copy.copiedButton : copy.copy}
        className={buttonClass(status)}
        onClick={() => void copyCode()}
        type="button"
      >
        <code>{code}</code>
        <span>
          {status === "copied" ? <CheckIcon /> : null}
          {status === "copied" ? copy.copiedButton : copy.copy}
        </span>
      </button>
      <p aria-live="polite" className={feedback.className} role={feedback.role}>
        {status === "copied"
          ? copy.copied
          : status === "failed"
            ? copy.copyFailed
            : ""}
      </p>
    </div>
  );
}
