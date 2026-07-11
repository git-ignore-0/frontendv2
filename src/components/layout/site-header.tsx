"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "@/components/ui/external-link";
import { mainNavigation, siteConfig } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.dataset.menuOpen = String(open);
    if (!open) return;

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    focusable?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      delete document.body.dataset.menuOpen;
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-forest/10 bg-rice/95 sticky top-0 z-50 h-[var(--header-height)] border-b backdrop-blur-md">
      <div className="site-container flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="relative z-50 inline-flex min-h-11 items-center"
          aria-label="Natural Farming Vietnam — Trang chủ"
        >
          <Image
            src="/images/logo-horizontal.png"
            width={151}
            height={40}
            alt="Natural Farming Vietnam"
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-1 md:flex"
        >
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-bold text-charcoal transition-colors hover:text-forest aria-[current=page]:border-terra aria-[current=page]:text-forest"
            >
              {item.label}
            </Link>
          ))}
          <ExternalLink
            href={siteConfig.storeUrl}
            className="border-forest/25 ml-2 inline-flex min-h-11 items-center gap-1.5 border px-4 text-sm font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-warm"
          >
            Cửa hàng
          </ExternalLink>
        </nav>

        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          onClick={() => setOpen((value) => !value)}
          className="border-forest/20 relative z-50 grid size-12 place-items-center border text-forest md:hidden"
        >
          <span className="sr-only">{open ? "Đóng menu" : "Mở menu"}</span>
          <span aria-hidden="true" className="grid gap-1.5">
            <span
              className={`block h-0.5 w-5 bg-current transition-transform ${open ? "translate-y-1 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition-opacity ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition-transform ${open ? "-translate-y-1 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      <div
        ref={panelRef}
        id="mobile-navigation"
        aria-hidden={!open}
        className={`fixed inset-0 top-0 z-40 bg-rice px-4 pb-8 pt-28 transition duration-300 md:hidden ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"}`}
      >
        <nav
          aria-label="Điều hướng di động"
          className="mx-auto flex max-w-lg flex-col"
        >
          {mainNavigation.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="border-forest/15 flex min-h-16 items-center justify-between border-b font-display text-3xl text-forest aria-[current=page]:text-terra"
            >
              <span>{item.label}</span>
              <span className="font-sans text-xs text-soil">0{index + 1}</span>
            </Link>
          ))}
          <ExternalLink
            href={siteConfig.storeUrl}
            tabIndex={open ? 0 : -1}
            className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 bg-forest px-5 font-bold text-warm"
          >
            Đến cửa hàng
          </ExternalLink>
          <p className="text-muted mt-4 text-center text-xs leading-5">
            Sản phẩm và thanh toán được quản lý trên Farmbrite.
          </p>
        </nav>
      </div>
    </header>
  );
}
