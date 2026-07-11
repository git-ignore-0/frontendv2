"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/icons";
import { getDictionary } from "@/content/dictionaries";
import { type Locale, localizedPath, storeUrl } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const other = locale === "en" ? "vi" : "en";
  const otherPath = pathname.replace(/^\/(en|vi)(?=\/|$)/, `/${other}`);
  const links = [
    ["", t.nav.home],
    ["/about", t.nav.about],
    ["/plants", t.nav.plants],
    ["/animals", t.nav.animals],
  ] as const;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = panel.current?.querySelector<HTMLElement>("a, button");
    focusable?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key === "Tab" && panel.current) {
        const nodes = [
          ...panel.current.querySelectorAll<HTMLElement>("a, button"),
        ];
        const first = nodes[0];
        const last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link
          href={localizedPath(locale)}
          className="brand"
          aria-label="Natural Farming Vietnam home"
        >
          <Image
            src="/images/logo-horizontal.png"
            alt="Natural Farming Vietnam"
            width={151}
            height={40}
            priority
          />
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([path, label]) => {
            const href = localizedPath(locale, path);
            const active = pathname === href;
            return (
              <Link
                key={path}
                href={href}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
          <a href={storeUrl} target="_blank" rel="noreferrer">
            {t.nav.store} <Arrow external />
            <span className="sr-only"> ({t.external})</span>
          </a>
        </nav>
        <div className="header-tools">
          <Link
            href={otherPath}
            className="language"
            hrefLang={other}
            lang={other}
            aria-label={`${t.language}: ${other === "en" ? "English" : "Tiếng Việt"}`}
          >
            {other.toUpperCase()}
          </Link>
          <button
            ref={trigger}
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            {t.menu}
            <span aria-hidden="true">≡</span>
          </button>
        </div>
      </div>
      {open && (
        <div
          className="menu-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panel}
            id="mobile-menu"
            className="mobile-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t.menu}
          >
            <button className="menu-close" onClick={() => setOpen(false)}>
              {t.close}
              <span aria-hidden="true">×</span>
            </button>
            <nav aria-label="Mobile navigation">
              {links.map(([path, label], i) => (
                <Link key={path} href={localizedPath(locale, path)}>
                  <small>0{i + 1}</small>
                  {label}
                  <Arrow />
                </Link>
              ))}
              <a href={storeUrl} target="_blank" rel="noreferrer">
                <small>05</small>
                {t.nav.store}
                <Arrow external />
                <span className="sr-only"> ({t.external})</span>
              </a>
            </nav>
            <Link
              href={otherPath}
              hrefLang={other}
              lang={other}
              className="mobile-language"
            >
              {other === "en"
                ? "Continue in English"
                : "Tiếp tục bằng Tiếng Việt"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
