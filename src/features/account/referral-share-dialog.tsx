"use client";

import {
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { SiteContent } from "@/content/site-content";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["account"];
type CopyStatus = "idle" | "copied" | "failed";

function messageWithReferralUrl(message: string, referralUrl: string) {
  const parts = message.split(referralUrl);
  if (parts.length > 1) {
    return `${parts[0]}${referralUrl}${parts.slice(1).join("")}`;
  }
  const trimmedMessage = message.trimEnd();
  return trimmedMessage ? `${trimmedMessage}\n${referralUrl}` : referralUrl;
}

function isShareCancellation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the legacy copy path when browser permission or
      // clipboard availability changes after feature detection.
    }
  }

  const activeElement = document.activeElement;
  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = value;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";

  try {
    document.body.appendChild(temporaryInput);
    temporaryInput.select();
    if (
      typeof document.execCommand !== "function" ||
      !document.execCommand("copy")
    ) {
      throw new Error("Copy failed");
    }
  } finally {
    temporaryInput.remove();
    if (activeElement instanceof HTMLElement && activeElement.isConnected) {
      activeElement.focus();
    }
  }
}

function CopyFeedback({
  status,
  copied,
  failed,
}: {
  status: CopyStatus;
  copied: string;
  failed: string;
}) {
  if (status === "idle") return null;
  if (status === "failed") {
    return (
      <p
        aria-live="assertive"
        className="referral-share-feedback is-failed"
        role="alert"
      >
        {failed}
      </p>
    );
  }
  return (
    <p
      aria-live="polite"
      className="referral-share-feedback is-copied"
      role="status"
    >
      {copied}
    </p>
  );
}

export function ReferralShareDialog({
  code,
  copy,
  locale,
  origin,
}: {
  code: string;
  copy: Copy;
  locale: Locale;
  origin: string;
}) {
  const referralUrl = useMemo(
    () => `${origin}/ref/${encodeURIComponent(code)}?locale=${locale}`,
    [code, locale, origin],
  );
  const facebookShareUrl = useMemo(
    () => `${origin}/share/ref/${encodeURIComponent(code)}?locale=${locale}`,
    [code, locale, origin],
  );
  const defaultMessage = useMemo(
    () => copy.defaultShareMessage.replace("{link}", referralUrl),
    [copy.defaultShareMessage, referralUrl],
  );
  const [message, setMessage] = useState(defaultMessage);
  const normalizedShareMessage = useMemo(
    () => messageWithReferralUrl(message, referralUrl),
    [message, referralUrl],
  );
  const facebookTarget = useMemo(() => {
    const url = new URL("https://www.facebook.com/sharer/sharer.php");
    url.searchParams.set("u", facebookShareUrl);
    return url.toString();
  }, [facebookShareUrl]);
  const whatsappTarget = useMemo(() => {
    const url = new URL("https://wa.me/");
    url.searchParams.set("text", normalizedShareMessage);
    return url.toString();
  }, [normalizedShareMessage]);
  const emailTarget = useMemo(() => {
    const query = new URLSearchParams({
      subject: copy.emailShareSubject,
      body: normalizedShareMessage,
    });
    return `mailto:?${query.toString()}`;
  }, [copy.emailShareSubject, normalizedShareMessage]);
  const [open, setOpen] = useState(false);
  const [linkStatus, setLinkStatus] = useState<CopyStatus>("idle");
  const [messageStatus, setMessageStatus] = useState<CopyStatus>("idle");
  const [mobileShareSurface, setMobileShareSurface] = useState<boolean | null>(
    null,
  );
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sharingRef = useRef(false);

  useEffect(() => {
    const hasNativeShare = typeof navigator.share === "function";
    setNativeShareAvailable(hasNativeShare);
    if (typeof window.matchMedia !== "function") {
      setMobileShareSurface(hasNativeShare);
      return;
    }

    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const narrowViewport = window.matchMedia("(max-width: 760px)");
    const updateShareSurface = () => {
      setMobileShareSurface(coarsePointer.matches || narrowViewport.matches);
    };

    updateShareSurface();
    coarsePointer.addEventListener("change", updateShareSurface);
    narrowViewport.addEventListener("change", updateShareSurface);
    return () => {
      coarsePointer.removeEventListener("change", updateShareSurface);
      narrowViewport.removeEventListener("change", updateShareSurface);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  function openDialog() {
    setMessage(defaultMessage);
    setLinkStatus("idle");
    setMessageStatus("idle");
    setShareError("");
    setOpen(true);
  }

  function keepFocusInside(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
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

  async function copyValue(value: string, target: "link" | "message") {
    const setStatus = target === "link" ? setLinkStatus : setMessageStatus;
    try {
      await copyText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  async function shareViaApps() {
    if (sharingRef.current || typeof navigator.share !== "function") return;
    sharingRef.current = true;
    setSharing(true);
    setShareError("");
    try {
      await navigator.share({
        title: copy.shareDialogTitle,
        text: normalizedShareMessage,
      });
    } catch (error) {
      if (!isShareCancellation(error)) setShareError(copy.nativeShareFailed);
    } finally {
      sharingRef.current = false;
      setSharing(false);
    }
  }

  return (
    <>
      <button
        className="account-primary-action referral-share-trigger"
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        {copy.share}
      </button>

      {open ? (
        <div
          className="referral-share-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            aria-describedby="referral-share-description"
            aria-labelledby="referral-share-title"
            aria-modal="true"
            className="referral-share-dialog"
            onKeyDown={keepFocusInside}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <button
              aria-label={copy.closeShareDialog}
              className="referral-share-close"
              onClick={() => setOpen(false)}
              ref={closeRef}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
            <h2 id="referral-share-title">{copy.shareDialogTitle}</h2>
            <p id="referral-share-description">{copy.shareDialogDescription}</p>

            <div className="referral-share-field">
              <label htmlFor="referral-share-link">
                {copy.referralLinkLabel}
              </label>
              <div className="referral-share-copy-row">
                <input
                  id="referral-share-link"
                  readOnly
                  type="url"
                  value={referralUrl}
                />
                <button
                  onClick={() => void copyValue(referralUrl, "link")}
                  type="button"
                >
                  {copy.copyLink}
                </button>
              </div>
              <CopyFeedback
                copied={copy.linkCopied}
                failed={copy.linkCopyFailed}
                status={linkStatus}
              />
            </div>

            <div className="referral-share-field">
              <label htmlFor="referral-share-message">
                {copy.shareMessageLabel}
              </label>
              <textarea
                id="referral-share-message"
                onChange={(event) => {
                  setMessage(event.target.value);
                  setMessageStatus("idle");
                  setShareError("");
                }}
                rows={7}
                value={message}
              />
              {mobileShareSurface === false ? (
                <section
                  aria-labelledby="referral-platform-share-title"
                  className="referral-platform-share"
                >
                  <h3 id="referral-platform-share-title">{copy.shareOn}</h3>
                  <div className="referral-platform-grid">
                    <a
                      aria-label={copy.shareOnFacebook}
                      className="referral-platform-button"
                      href={facebookTarget}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M14.2 8.4V6.9c0-.7.5-.9.9-.9h2.3V2.2L14.2 2c-3.5 0-4.3 2.6-4.3 4.3v2.1H7v4.3h2.9V22h4.3v-9.3h3.1l.5-4.3h-3.6Z" />
                      </svg>
                      <span>{copy.facebook}</span>
                    </a>
                    <a
                      aria-label={copy.shareViaWhatsApp}
                      className="referral-platform-button"
                      href={whatsappTarget}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M20 11.6a8 8 0 0 1-11.8 7l-4.2 1.2 1.2-4a8 8 0 1 1 14.8-4.2Z" />
                        <path d="M8.7 7.5c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.6.8c-.2.2-.1.4 0 .6.7 1.2 1.6 2.1 2.8 2.7.2.1.4.1.6-.1l.8-1c.2-.2.4-.3.7-.2l1.8.9c.3.1.4.3.4.5 0 .5-.2 1.4-.8 1.8-.5.5-1.3.8-2.2.6-1.1-.2-2.5-.8-4.1-2.2-1.3-1.2-2.2-2.6-2.5-3.5-.3-.9 0-1.7.3-2.2Z" />
                      </svg>
                      <span>{copy.whatsapp}</span>
                    </a>
                    <a
                      aria-label={copy.shareByEmail}
                      className="referral-platform-button"
                      href={emailTarget}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <rect height="14" rx="2" width="18" x="3" y="5" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                      <span>{copy.email}</span>
                    </a>
                  </div>
                </section>
              ) : null}
              <div className="referral-share-message-actions">
                {mobileShareSurface === true && nativeShareAvailable ? (
                  <button
                    aria-busy={sharing}
                    className="account-primary-action referral-native-share"
                    disabled={sharing}
                    onClick={() => void shareViaApps()}
                    type="button"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12 16V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                    </svg>
                    {copy.shareViaApps}
                  </button>
                ) : null}
                <button
                  className="referral-share-copy-message"
                  onClick={() => void copyValue(message, "message")}
                  type="button"
                >
                  {copy.copyMessage}
                </button>
              </div>
              {shareError ? (
                <p
                  aria-live="assertive"
                  className="referral-share-feedback is-failed"
                  role="alert"
                >
                  {shareError}
                </p>
              ) : null}
              <CopyFeedback
                copied={copy.messageCopied}
                failed={copy.messageCopyFailed}
                status={messageStatus}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
