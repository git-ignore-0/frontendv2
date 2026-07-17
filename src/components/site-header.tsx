"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Arrow } from "@/components/icons";
import { siteConfig } from "@/config/site";
import type { CommonDictionary } from "@/content/site-content";
import {
  type Locale,
  localeConfig,
  locales,
  localizedPath,
  replacePathLocale,
} from "@/lib/i18n";

export function SiteHeader({
  locale,
  dictionary: t,
}: {
  locale: Locale;
  dictionary: CommonDictionary;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const alternateLocales = locales.filter((item) => item !== locale);
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link
          href={localizedPath(locale)}
          className="brand"
          aria-label={t.homeLabel}
        >
          <Image
            src="/images/logo-horizontal.png"
            alt={siteConfig.name}
            width={151}
            height={40}
            priority
          />
        </Link>
        <nav className="desktop-nav" aria-label={t.primaryNavigation}>
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
          <a href={siteConfig.links.store} target="_blank" rel="noreferrer">
            {t.nav.store} <Arrow external />
            <span className="sr-only"> ({t.external})</span>
          </a>
          <a href={siteConfig.links.forum} target="_blank" rel="noreferrer">
            {t.nav.forum} <Arrow external />
            <span className="sr-only"> ({t.external})</span>
          </a>
        </nav>
        <div className="header-tools">
          {alternateLocales.map((targetLocale) => (
            <Link
              key={targetLocale}
              href={replacePathLocale(pathname, targetLocale)}
              className="language"
              hrefLang={targetLocale}
              lang={targetLocale}
              aria-label={`${t.language}: ${localeConfig[targetLocale].label}`}
            >
              <span aria-hidden="true">{localeConfig[targetLocale].icon}</span>
              {localeConfig[targetLocale].shortLabel}
            </Link>
          ))}
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
      {open &&
        createPortal(
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
              <nav aria-label={t.mobileNavigation}>
                {links.map(([path, label], i) => (
                  <Link key={path} href={localizedPath(locale, path)}>
                    <small>0{i + 1}</small>
                    {label}
                    <Arrow />
                  </Link>
                ))}
                <a
                  href={siteConfig.links.store}
                  target="_blank"
                  rel="noreferrer"
                >
                  <small>05</small>
                  {t.nav.store}
                  <Arrow external />
                  <span className="sr-only"> ({t.external})</span>
                </a>
                <a
                  href={siteConfig.links.forum}
                  target="_blank"
                  rel="noreferrer"
                >
                  <small>06</small>
                  {t.nav.forum}
                  <Arrow external />
                  <span className="sr-only"> ({t.external})</span>
                </a>
              </nav>
              <div className="mobile-languages" aria-label={t.language}>
                {alternateLocales.map((targetLocale) => (
                  <Link
                    key={targetLocale}
                    href={replacePathLocale(pathname, targetLocale)}
                    hrefLang={targetLocale}
                    lang={targetLocale}
                    className="mobile-language"
                  >
                    <span aria-hidden="true">
                      {localeConfig[targetLocale].icon}
                    </span>
                    {localeConfig[targetLocale].label}
                  </Link>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
