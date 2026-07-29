"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Arrow } from "@/components/icons";
import { siteConfig } from "@/config/site";
import type { CommonDictionary } from "@/content/site-content";
import type { CoreUser } from "@/lib/auth/schemas";
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
  externalLinks,
  initialUser,
}: {
  locale: Locale;
  dictionary: CommonDictionary;
  externalLinks: { store?: string; forum?: string };
  initialUser: CoreUser | null;
}) {
  const pathname = usePathname();
  const accountHref = localizedPath(locale, "/account");
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const alternateLocales = locales.filter((item) => item !== locale);
  const links = [
    ["", t.nav.home],
    ["/about", t.nav.about],
    ["/plants", t.nav.plants],
    ["/animals", t.nav.animals],
    ["/workshops", t.nav.workshops],
  ] as const;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setUser(null);
          return;
        }
        const payload = (await response.json()) as {
          data?: { user?: CoreUser };
        };
        setUser(payload.data?.user ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
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
          {externalLinks.store && (
            <a href={externalLinks.store} target="_blank" rel="noreferrer">
              {t.nav.store} <Arrow external />
              <span className="sr-only"> ({t.external})</span>
            </a>
          )}
          {externalLinks.forum && (
            <a href={externalLinks.forum} target="_blank" rel="noreferrer">
              {t.nav.forum} <Arrow external />
              <span className="sr-only"> ({t.external})</span>
            </a>
          )}
        </nav>
        <div className="header-tools">
          <div className="desktop-account-actions">
            {user ? (
              <>
                <Link
                  href={accountHref}
                  className="account-link"
                  aria-label={t.nav.account}
                >
                  {user.name}
                </Link>
                <form
                  action={`/api/auth/logout?locale=${locale}`}
                  method="post"
                >
                  <button className="header-logout" type="submit">
                    {t.nav.signOut}
                  </button>
                </form>
              </>
            ) : (
              <>
                <a
                  className="header-register"
                  href={`/api/auth/register?locale=${locale}&returnTo=${encodeURIComponent(pathname)}`}
                >
                  {t.nav.register}
                </a>
                <a
                  className="header-login"
                  href={`/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(pathname)}`}
                >
                  {t.nav.signIn}
                </a>
              </>
            )}
          </div>
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
                {externalLinks.store && (
                  <a
                    href={externalLinks.store}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <small>06</small>
                    {t.nav.store}
                    <Arrow external />
                    <span className="sr-only"> ({t.external})</span>
                  </a>
                )}
                {externalLinks.forum && (
                  <a
                    href={externalLinks.forum}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <small>{externalLinks.store ? "07" : "06"}</small>
                    {t.nav.forum}
                    <Arrow external />
                    <span className="sr-only"> ({t.external})</span>
                  </a>
                )}
                <div className="mobile-account-actions">
                  {user ? (
                    <>
                      <Link href={accountHref}>
                        <small>
                          {externalLinks.store && externalLinks.forum
                            ? "08"
                            : "07"}
                        </small>
                        {t.nav.account}
                        <Arrow />
                      </Link>
                      <form
                        className="mobile-account-logout"
                        action={`/api/auth/logout?locale=${locale}`}
                        method="post"
                      >
                        <button type="submit">
                          <small>→</small>
                          {t.nav.signOut}
                          <Arrow />
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <a
                        href={`/api/auth/register?locale=${locale}&returnTo=${encodeURIComponent(pathname)}`}
                      >
                        <small>+</small>
                        {t.nav.register}
                        <Arrow />
                      </a>
                      <a
                        href={`/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(pathname)}`}
                      >
                        <small>→</small>
                        {t.nav.signIn}
                        <Arrow />
                      </a>
                    </>
                  )}
                </div>
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
