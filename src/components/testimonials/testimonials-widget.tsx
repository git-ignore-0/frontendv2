"use client";

import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect, useRef, useState } from "react";

import { MessageCircleIcon } from "@/components/icons";
import { TestimonialsDrawer } from "@/components/testimonials/testimonials-drawer";
import { getSiteContent } from "@/content/site-content";
import type { Locale } from "@/lib/i18n";

export function TestimonialsWidget({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getSiteContent(locale).testimonials;
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null)
        window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  if (pathname === "/testimonials/en" || pathname === "/testimonials/vi") {
    return null;
  }

  function openDrawer(event: MouseEvent<HTMLButtonElement>) {
    if (closeTimerRef.current !== null)
      window.clearTimeout(closeTimerRef.current);
    returnFocusRef.current = event.currentTarget;
    setDrawerMounted(true);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimerRef.current = window.setTimeout(
      () => {
        setDrawerMounted(false);
        closeTimerRef.current = null;
      },
      reduceMotion ? 0 : 220,
    );
  }

  return (
    <>
      <button
        aria-label={copy.launcher}
        className="testimonials-launcher testimonials-launcher-desktop"
        data-drawer-mounted={drawerMounted}
        onClick={openDrawer}
        type="button"
      >
        <MessageCircleIcon />
        <span>{copy.launcher}</span>
      </button>
      <button
        aria-label={copy.launcher}
        className="testimonials-launcher testimonials-launcher-mobile"
        data-drawer-mounted={drawerMounted}
        onClick={openDrawer}
        type="button"
      >
        <MessageCircleIcon />
        <span>{copy.launcher}</span>
      </button>

      {drawerMounted ? (
        <TestimonialsDrawer
          locale={locale}
          onClose={closeDrawer}
          open={drawerOpen}
          returnFocusRef={returnFocusRef}
        />
      ) : null}
    </>
  );
}
