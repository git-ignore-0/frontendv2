"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useEffect,
  useRef,
} from "react";

let bodyLockCount = 0;
let bodyOverflowBeforeLock = "";

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0)
    document.body.style.overflow = bodyOverflowBeforeLock;
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useTestimonialDialog({
  captureEscape = false,
  dialogRef,
  initialFocusRef,
  onEscape,
  returnFocusRef,
}: {
  captureEscape?: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
  onEscape: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const requestedReturnTarget = returnFocusRef?.current;
    lockBodyScroll();
    initialFocusRef.current?.focus();

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (captureEscape) event.stopImmediatePropagation();
      onEscapeRef.current();
    }

    document.addEventListener("keydown", handleDocumentKeyDown, captureEscape);
    return () => {
      document.removeEventListener(
        "keydown",
        handleDocumentKeyDown,
        captureEscape,
      );
      unlockBodyScroll();
      const returnTarget = requestedReturnTarget ?? previouslyFocused;
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [captureEscape, initialFocusRef, returnFocusRef]);

  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter(
      (element) =>
        element.getAttribute("aria-hidden") !== "true" &&
        !element.hasAttribute("hidden"),
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

  return trapFocus;
}
