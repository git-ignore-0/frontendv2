"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Arrow } from "@/components/icons";
import { siteConfig } from "@/config/site";
import type { CommonDictionary } from "@/content/site-content";
import { useHeaderAccountBalance } from "@/features/account/use-header-account-balance";
import { useHeaderMembershipDestination } from "@/features/account/use-header-membership-destination";
import type { CoreUser } from "@/lib/auth/schemas";
import {
  type Locale,
  localeConfig,
  locales,
  localizedPath,
  replacePathLocale,
} from "@/lib/i18n";

function AccountMenuChevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

function HeaderAccountDestinations({
  accountHref,
  balanceLabel,
  currentPath,
  membershipHref,
  menuSemantics = false,
  onNavigate,
  t,
}: {
  accountHref: string;
  balanceLabel: string;
  currentPath: string;
  membershipHref: string;
  menuSemantics?: boolean;
  onNavigate: () => void;
  t: CommonDictionary;
}) {
  let role: "menuitem" | undefined;
  let groupRole: "none" | undefined;
  if (menuSemantics) {
    role = "menuitem";
    groupRole = "none";
  }
  const returnTo = `?returnTo=${encodeURIComponent(currentPath)}`;
  const membershipDestination = membershipHref.startsWith("/account/")
    ? `${membershipHref}${returnTo}`
    : membershipHref;
  return (
    <div className="header-account-destinations" role={groupRole}>
      <div className="header-account-points-summary" role="presentation">
        <span>{t.nav.currentPoints}</span>
        <strong
          aria-atomic="true"
          aria-live="polite"
          className="header-account-balance"
        >
          {balanceLabel}
        </strong>
      </div>
      <Link
        href={`${accountHref}/points${returnTo}`}
        onClick={onNavigate}
        role={role}
      >
        {t.nav.pointsHistory}
      </Link>
      <Link
        href={`${accountHref}/rewards${returnTo}`}
        onClick={onNavigate}
        role={role}
      >
        {t.nav.rewards}
      </Link>
      <Link
        href={`${accountHref}/referral${returnTo}`}
        onClick={onNavigate}
        role={role}
      >
        {t.nav.referFriends}
      </Link>
      <a
        href={`/api/auth/account?returnTo=${encodeURIComponent(accountHref)}`}
        onClick={onNavigate}
        role={role}
      >
        {t.nav.editAccount}
      </a>
      <Link href={membershipDestination} onClick={onNavigate} role={role}>
        {t.nav.membership}
      </Link>
    </div>
  );
}

function HeaderAccountIdentity({
  t,
  user,
}: {
  t: CommonDictionary;
  user: CoreUser;
}) {
  return (
    <div className="header-account-user" role="presentation" title={user.name}>
      <span>{t.nav.accountOwner}</span>
      <strong>{user.name}</strong>
    </div>
  );
}

function HeaderAccountLogout({
  locale,
  menuSemantics = false,
  t,
}: {
  locale: Locale;
  menuSemantics?: boolean;
  t: CommonDictionary;
}) {
  let role: "menuitem" | undefined;
  if (menuSemantics) {
    role = "menuitem";
  }
  return (
    <form
      action={`/api/auth/logout?locale=${locale}`}
      className="header-account-logout-form"
      method="post"
    >
      <button className="header-account-logout" role={role} type="submit">
        {t.nav.signOut}
      </button>
    </form>
  );
}

function HeaderAccountMenu({
  locale,
  pathname,
  currentPath,
  t,
  user,
  balanceLabel,
  loadBalance,
  loadMembershipDestination,
  membershipHref,
}: {
  locale: Locale;
  pathname: string;
  currentPath: string;
  t: CommonDictionary;
  user: CoreUser | null;
  balanceLabel: string;
  loadBalance: () => Promise<void>;
  loadMembershipDestination: () => Promise<void>;
  membershipHref: string;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const accountHref = localizedPath(locale, "/account");
  const menuId = "header-account-menu";
  const close = () => setOpen(false);

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    setOpen(true);
    void loadBalance();
    void loadMembershipDestination();
  };

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="desktop-account-menu" ref={container}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        className="header-account-trigger"
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          setOpen(true);
          void loadBalance();
          void loadMembershipDestination();
        }}
        ref={trigger}
        type="button"
      >
        {t.nav.account}
        <AccountMenuChevron />
      </button>

      {open ? (
        <div
          aria-label={t.nav.account}
          className="header-account-popover"
          id={menuId}
          role="menu"
        >
          {user ? (
            <>
              <HeaderAccountIdentity t={t} user={user} />
              <HeaderAccountDestinations
                accountHref={accountHref}
                balanceLabel={balanceLabel}
                currentPath={currentPath}
                membershipHref={membershipHref}
                menuSemantics
                onNavigate={close}
                t={t}
              />
              <HeaderAccountLogout locale={locale} menuSemantics t={t} />
            </>
          ) : (
            <>
              <a
                href={`/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(currentPath)}`}
                onClick={close}
                role="menuitem"
              >
                {t.nav.signIn}
              </a>
              <a
                href={`/api/auth/register?locale=${locale}&returnTo=${encodeURIComponent(currentPath)}`}
                onClick={close}
                role="menuitem"
              >
                {t.nav.register}
              </a>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

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
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentPath = search ? `${pathname}?${search}` : pathname;
  const accountHref = localizedPath(locale, "/account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  const { label: balanceLabel, load: loadBalance } = useHeaderAccountBalance({
    locale,
    pathname,
    userId: user?.sub,
  });
  const { href: membershipHref, load: loadMembershipDestination } =
    useHeaderMembershipDestination({
      locale,
      pathname,
      userId: user?.sub,
    });
  const mobileMenuTrigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const alternateLocales = locales.filter((item) => item !== locale);
  const links = [
    ["", t.nav.home],
    ["/about", t.nav.about],
    ["/workshops", t.nav.workshops],
    ["/csa", t.nav.csa],
  ] as const;
  const linkHref = (path: (typeof links)[number][0]) =>
    path === "/csa" ? `/${locale}/csa` : localizedPath(locale, path);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileAccountOpen(false);
  }, [pathname]);
  useEffect(() => setMobileAccountOpen(false), [user?.sub]);
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
    if (!mobileMenuOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = panel.current?.querySelector<HTMLElement>("a, button");
    focusable?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setMobileAccountOpen(false);
        mobileMenuTrigger.current?.focus();
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
  }, [mobileMenuOpen]);

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
            const href = linkHref(path);
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
          <HeaderAccountMenu
            balanceLabel={balanceLabel}
            loadBalance={loadBalance}
            loadMembershipDestination={loadMembershipDestination}
            locale={locale}
            membershipHref={membershipHref}
            currentPath={currentPath}
            pathname={pathname}
            t={t}
            user={user}
          />
          {alternateLocales.map((targetLocale) => (
            <Link
              key={targetLocale}
              href={replacePathLocale(pathname, targetLocale)}
              className="language"
              hrefLang={targetLocale}
              lang={targetLocale}
              aria-label={`${t.language}: ${localeConfig[targetLocale].label}`}
            >
              <span aria-hidden="true" className="language-icon">
                {localeConfig[targetLocale].icon}
              </span>
              <span aria-hidden="true" className="language-flag">
                {localeConfig[targetLocale].flag}
              </span>
              {localeConfig[targetLocale].shortLabel}
            </Link>
          ))}
          <button
            ref={mobileMenuTrigger}
            aria-label={t.menu}
            className="menu-button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen(true)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
      {mobileMenuOpen &&
        createPortal(
          <div
            className="menu-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setMobileMenuOpen(false);
                setMobileAccountOpen(false);
              }
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
              <button
                className="menu-close"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setMobileAccountOpen(false);
                }}
              >
                {t.close}
                <span aria-hidden="true">×</span>
              </button>
              <nav aria-label={t.mobileNavigation}>
                {links.map(([path, label]) => (
                  <Link key={path} href={linkHref(path)}>
                    <span>{label}</span>
                    <Arrow />
                  </Link>
                ))}
                {externalLinks.store && (
                  <a
                    href={externalLinks.store}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{t.nav.store}</span>
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
                    <span>{t.nav.forum}</span>
                    <Arrow external />
                    <span className="sr-only"> ({t.external})</span>
                  </a>
                )}
                <div className="mobile-account-section">
                  <button
                    aria-controls="mobile-account-panel"
                    aria-expanded={mobileAccountOpen}
                    className="mobile-account-trigger"
                    onClick={() => {
                      const next = !mobileAccountOpen;
                      setMobileAccountOpen(next);
                      if (next) {
                        void loadBalance();
                        void loadMembershipDestination();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      const next = !mobileAccountOpen;
                      setMobileAccountOpen(next);
                      if (next) {
                        void loadBalance();
                        void loadMembershipDestination();
                      }
                    }}
                    type="button"
                  >
                    <span>{t.nav.account}</span>
                    <AccountMenuChevron />
                  </button>
                  {mobileAccountOpen ? (
                    <div
                      className="mobile-account-panel"
                      id="mobile-account-panel"
                    >
                      {user ? (
                        <>
                          <HeaderAccountIdentity t={t} user={user} />
                          <HeaderAccountDestinations
                            accountHref={accountHref}
                            balanceLabel={balanceLabel}
                            currentPath={currentPath}
                            membershipHref={membershipHref}
                            onNavigate={() => setMobileMenuOpen(false)}
                            t={t}
                          />
                          <HeaderAccountLogout locale={locale} t={t} />
                        </>
                      ) : (
                        <>
                          <a
                            href={`/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(currentPath)}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {t.nav.signIn}
                          </a>
                          <a
                            href={`/api/auth/register?locale=${locale}&returnTo=${encodeURIComponent(currentPath)}`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {t.nav.register}
                          </a>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
