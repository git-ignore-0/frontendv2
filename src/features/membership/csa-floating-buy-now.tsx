"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { BagIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/i18n";

const EXIT_DURATION_MS = 200;

export function CsaFloatingBuyNow({
  label,
  locale,
  targetRef,
}: {
  label: string;
  locale: Locale;
  targetRef: RefObject<HTMLAnchorElement | null>;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const actionRef = useRef<HTMLAnchorElement>(null);
  const exitTimer = useRef<number | null>(null);

  const isCsaRoute = pathname === `/csa/${locale}`;

  useEffect(() => {
    if (!isCsaRoute || !targetRef.current || !window.IntersectionObserver)
      return;

    const show = () => {
      if (exitTimer.current !== null) {
        window.clearTimeout(exitTimer.current);
        exitTimer.current = null;
      }
      setMounted(true);
      window.requestAnimationFrame(() => setVisible(true));
    };
    const hide = () => {
      if (!mounted) return;
      const action = actionRef.current;
      if (action && document.activeElement === action) action.blur();
      setVisible(false);
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
      exitTimer.current = window.setTimeout(() => {
        setMounted(false);
        exitTimer.current = null;
      }, EXIT_DURATION_MS);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) hide();
      else show();
    });

    observer.observe(targetRef.current);
    return () => {
      observer.disconnect();
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    };
  }, [isCsaRoute, mounted, targetRef]);

  if (!isCsaRoute || !mounted) return null;

  const action = (
    <Link
      aria-hidden={!visible}
      aria-label={label}
      className="csa-floating-buy-now"
      data-visible={visible}
      href={localizedPath(locale, "/store")}
      ref={actionRef}
      tabIndex={visible ? undefined : -1}
    >
      <span className="csa-floating-buy-now-icon">
        <BagIcon />
      </span>
      <span>{label}</span>
    </Link>
  );
  const slot = document.querySelector<HTMLElement>("[data-csa-fab-buy-slot]");

  return slot ? createPortal(action, slot) : action;
}
