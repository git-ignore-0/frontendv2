import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/site-header";
import { getSiteContent } from "@/content/site-content";

const navigation = vi.hoisted(() => ({ pathname: "/en", search: "" }));
const member = {
  sub: "11111111-1111-4111-8111-111111111111",
  name: "A member with a very long display name",
  email: "member@example.com",
  email_verified: true as const,
  locale: "en" as const,
  status: "active" as const,
  roles: [],
};

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

beforeEach(() => {
  navigation.pathname = "/en";
  navigation.search = "";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ data: {} }, { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderHeader(locale: "en" | "vi" = "en") {
  return render(
    <SiteHeader
      dictionary={getSiteContent(locale).common}
      externalLinks={{
        forum: "https://forum.example.com",
      }}
      initialUser={null}
      locale={locale}
    />,
  );
}

describe("site header navigation", () => {
  it("switches the CSA locale within the canonical route", () => {
    navigation.pathname = "/csa/en";
    renderHeader();

    expect(
      screen.getByRole("link", { name: "Language: Tiếng Việt" }),
    ).toHaveAttribute("href", "/csa/vi");
  });

  it("preserves the verification reference when switching locale", () => {
    navigation.pathname = "/csa/verify/en";
    navigation.search = "reference=CSA-202609-8F3K2M";
    renderHeader();

    expect(
      screen.getByRole("link", { name: "Language: Tiếng Việt" }),
    ).toHaveAttribute("href", "/csa/verify/vi?reference=CSA-202609-8F3K2M");
  });

  it("normalizes the verification route slash while keeping its reference", () => {
    navigation.pathname = "/csa/verify/en/";
    navigation.search = "reference=CSA-202609-8F3K2M";
    renderHeader();

    expect(
      screen.getByRole("link", { name: "Language: Tiếng Việt" }),
    ).toHaveAttribute("href", "/csa/verify/vi?reference=CSA-202609-8F3K2M");
  });

  it.each([
    ["/csa/purchase/en", "/csa/purchase/vi"],
    ["/csa/purchase/en/", "/csa/purchase/vi"],
    ["/csa/track/en", "/csa/track/vi"],
    ["/csa/track/en/", "/csa/track/vi"],
  ])("keeps the current CSA flow route and scroll at %s", (from, to) => {
    navigation.pathname = from;
    renderHeader();

    const language = screen.getByRole("link", {
      name: "Language: Tiếng Việt",
    });
    expect(language).toHaveAttribute("href", to);
    expect(language.getAttribute("href")).not.toContain("?");
  });

  it.each(["/csa/en", "/csa/purchase/en", "/csa/track/en", "/csa/verify/en"])(
    "marks the single CSA item active on desktop and mobile at %s",
    (route) => {
      navigation.pathname = route;
      renderHeader();

      const desktop = screen.getByRole("navigation", {
        name: "Primary navigation",
      });
      const desktopCSA = within(desktop).getByRole("link", { name: "CSA" });
      expect(desktopCSA).toHaveAttribute("aria-current", "page");
      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const mobile = within(
        screen.getByRole("dialog", { name: "Menu" }),
      ).getByRole("navigation", { name: "Mobile navigation" });
      expect(within(mobile).getAllByRole("link", { name: "CSA" })).toHaveLength(
        1,
      );
      expect(within(mobile).getByRole("link", { name: "CSA" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    },
  );

  it("does not mark CSA active for unrelated routes", () => {
    navigation.pathname = "/csa-other/en";
    renderHeader();
    const desktop = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(
      within(desktop).getByRole("link", { name: "CSA" }),
    ).not.toHaveAttribute("aria-current");
  });

  it.each([
    ["en", "/tracker/en", "Farm Tracker", "/tracker/vi"],
    ["vi", "/tracker/vi", "Theo dõi nông trại", "/tracker/en"],
  ] as const)(
    "keeps Tracker active and preserves its route when switching from %s",
    (locale, route, label, alternateRoute) => {
      navigation.pathname = route;
      const { container } = renderHeader(locale);

      const desktop = screen.getByRole("navigation", {
        name: getSiteContent(locale).common.primaryNavigation,
      });
      expect(
        within(desktop).getByRole("link", { name: label }),
      ).toHaveAttribute("aria-current", "page");
      expect(container.querySelector("a.language")).toHaveAttribute(
        "href",
        alternateRoute,
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: getSiteContent(locale).common.menu,
        }),
      );
      const mobile = within(
        screen.getByRole("dialog", {
          name: getSiteContent(locale).common.menu,
        }),
      ).getByRole("navigation", {
        name: getSiteContent(locale).common.mobileNavigation,
      });
      expect(within(mobile).getByRole("link", { name: label })).toHaveAttribute(
        "aria-current",
        "page",
      );
    },
  );

  it("does not mark Tracker active for unrelated routes", () => {
    navigation.pathname = "/tracker-other/en";
    renderHeader();

    const desktop = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(
      within(desktop).getByRole("link", { name: "Farm Tracker" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("omits Plants and Animals from the desktop primary navigation", () => {
    renderHeader();

    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(
      primaryNavigation.querySelector('a[href="/plants/en"]'),
    ).not.toBeInTheDocument();
    expect(
      primaryNavigation.querySelector('a[href="/animals/en"]'),
    ).not.toBeInTheDocument();
    expect(
      within(primaryNavigation).queryByRole("button", { name: "Knowledge" }),
    ).not.toBeInTheDocument();
    expect(primaryNavigation.querySelector('a[href="/en"]')).toHaveTextContent(
      "Home",
    );
    expect(
      primaryNavigation.querySelector('a[href="/about/en"]'),
    ).toHaveTextContent("About");
    expect(
      primaryNavigation.querySelector('a[href="/workshops/en"]'),
    ).toHaveTextContent("Workshops");
    expect(
      primaryNavigation.querySelector('a[href="/tracker/en"]'),
    ).toHaveTextContent("Farm Tracker");
    expect(
      primaryNavigation.querySelector('a[href="/csa/en"]'),
    ).toHaveTextContent("CSA");
    expect(
      primaryNavigation.querySelector('a[href="/store/en"]'),
    ).toHaveTextContent("Store");
    const storeLink = primaryNavigation.querySelector('a[href="/store/en"]');
    expect(storeLink).not.toHaveAttribute("target");
    expect(storeLink).not.toHaveAttribute("rel");
    const forumLink = primaryNavigation.querySelector(
      'a[href="https://forum.example.com"]',
    );
    expect(forumLink).toHaveTextContent("Forum");
    expect(forumLink).toHaveAttribute("target", "_blank");
    expect(forumLink).toHaveAttribute("rel", "noreferrer");
  });

  it("omits Plants and Animals while keeping the remaining mobile links", () => {
    renderHeader();
    const menuTrigger = screen.getByRole("button", { name: "Menu" });
    expect(menuTrigger).toHaveAccessibleName("Menu");
    expect(menuTrigger).toHaveTextContent("");

    const language = screen.getByRole("link", {
      name: "Language: Tiếng Việt",
    });
    expect(language).toHaveAttribute("href", "/vi");
    expect(language).toHaveAttribute("hreflang", "vi");
    expect(language).toHaveAttribute("lang", "vi");
    expect(language).toHaveTextContent("🇻🇳VI");

    fireEvent.click(menuTrigger);
    const mobileNavigation = within(
      screen.getByRole("dialog", { name: "Menu" }),
    ).getByRole("navigation", { name: "Mobile navigation" });
    expect(mobileNavigation.querySelector("small")).not.toBeInTheDocument();
    expect(mobileNavigation).not.toHaveTextContent(/\b0[1-6]\b/);
    expect(
      mobileNavigation.querySelector('a[href="/plants/en"]'),
    ).not.toBeInTheDocument();
    expect(
      mobileNavigation.querySelector('a[href="/animals/en"]'),
    ).not.toBeInTheDocument();
    expect(
      within(mobileNavigation).queryByRole("button", { name: "Knowledge" }),
    ).not.toBeInTheDocument();
    expect(mobileNavigation.querySelector('a[href="/en"]')).toHaveTextContent(
      "Home",
    );
    expect(
      mobileNavigation.querySelector('a[href="/about/en"]'),
    ).toHaveTextContent("About");
    expect(
      mobileNavigation.querySelector('a[href="/workshops/en"]'),
    ).toHaveTextContent("Workshops");
    expect(
      mobileNavigation.querySelector('a[href="/tracker/en"]'),
    ).toHaveTextContent("Farm Tracker");
    expect(
      mobileNavigation.querySelector('a[href="/csa/en"]'),
    ).toHaveTextContent("CSA");
    expect(
      mobileNavigation.querySelector('a[href="/store/en"]'),
    ).toHaveTextContent("Store");
    const mobileStoreLink = mobileNavigation.querySelector(
      'a[href="/store/en"]',
    );
    expect(mobileStoreLink).not.toHaveAttribute("target");
    expect(mobileStoreLink).not.toHaveAttribute("rel");
    const mobileForumLink = mobileNavigation.querySelector(
      'a[href="https://forum.example.com"]',
    );
    expect(mobileForumLink).toHaveTextContent("Forum");
    expect(mobileForumLink).toHaveAttribute("target", "_blank");
    expect(mobileForumLink).toHaveAttribute("rel", "noreferrer");
  });

  it("keeps Store in desktop and mobile navigation without a backend Store URL", () => {
    render(
      <SiteHeader
        dictionary={getSiteContent("vi").common}
        externalLinks={{}}
        initialUser={null}
        locale="vi"
      />,
    );

    const primaryNavigation = screen.getByRole("navigation", {
      name: "Điều hướng chính",
    });
    expect(
      primaryNavigation.querySelector('a[href="/store/vi"]'),
    ).toHaveTextContent("Cửa hàng");
    expect(
      primaryNavigation.querySelector('a[href="/tracker/vi"]'),
    ).toHaveTextContent("Theo dõi nông trại");

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const mobileNavigation = within(
      screen.getByRole("dialog", { name: "Menu" }),
    ).getByRole("navigation", { name: "Điều hướng di động" });
    expect(
      mobileNavigation.querySelector('a[href="/store/vi"]'),
    ).toHaveTextContent("Cửa hàng");
    expect(
      mobileNavigation.querySelector('a[href="/tracker/vi"]'),
    ).toHaveTextContent("Theo dõi nông trại");
  });
});

describe("site header session projection", () => {
  it("places the signed-out actions in the account menu", () => {
    navigation.pathname = "/workshops/en";
    renderHeader();

    const trigger = screen.getByRole("button", { name: "Account" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: "Create account" }),
    ).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const menu = screen.getByRole("menu", { name: "Account" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      within(menu).getByRole("menuitem", { name: "Create account" }),
    ).toHaveAttribute(
      "href",
      "/api/auth/register?locale=en&returnTo=%2Fworkshops%2Fen",
    );
    expect(
      within(menu).getByRole("menuitem", { name: "Sign in" }),
    ).toHaveAttribute(
      "href",
      "/api/auth/login?locale=en&returnTo=%2Fworkshops%2Fen",
    );
  });

  it("shows the signed-in identity, ordered destinations and localized balance", async () => {
    let resolveAccount!: (response: Response) => void;
    const accountResponse = new Promise<Response>((resolve) => {
      resolveAccount = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        if (String(input) === "/api/account/account") return accountResponse;
        if (
          String(input).startsWith("/api/account/memberships/current?locale=")
        ) {
          return Promise.resolve(
            Response.json({ data: { status: "active" } }, { status: 200 }),
          );
        }
        return Promise.resolve(
          Response.json({ data: { user: member } }, { status: 200 }),
        );
      }),
    );
    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={member}
        locale="en"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Account" });
    expect(screen.queryByText(member.name)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const menu = screen.getByRole("menu", { name: "Account" });
    const identity = menu.querySelector(".header-account-user");
    expect(identity).not.toBeNull();
    expect(
      within(identity as HTMLElement).getByText("Account of"),
    ).toBeVisible();
    expect(
      within(identity as HTMLElement).getByText(member.name),
    ).toBeVisible();
    const pointsSummary = menu.querySelector(".header-account-points-summary");
    expect(pointsSummary).not.toBeNull();
    expect(
      within(pointsSummary as HTMLElement).getByText("Current points"),
    ).toBeVisible();
    expect(within(pointsSummary as HTMLElement).getByText("…")).toHaveClass(
      "header-account-balance",
    );
    expect(
      within(menu).queryByRole("menuitem", { name: "Your account" }),
    ).not.toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitem", { name: "Edit profile" }),
    ).toHaveAttribute("href", "/api/auth/account?returnTo=%2Faccount%2Fen");
    expect(
      within(menu).getByRole("menuitem", { name: "Point history" }),
    ).toHaveAttribute("href", "/account/en/points?returnTo=%2Fen");
    expect(
      within(menu).getByRole("menuitem", { name: "Redeem rewards" }),
    ).toHaveAttribute("href", "/account/en/rewards?returnTo=%2Fen");
    expect(
      within(menu).getByRole("menuitem", { name: "Referral code" }),
    ).toHaveAttribute("href", "/account/en/referral?returnTo=%2Fen");
    await waitFor(() =>
      expect(
        within(menu).getByRole("menuitem", { name: "CSA Membership" }),
      ).toHaveAttribute("href", "/account/en/membership?returnTo=%2Fen"),
    );
    expect(menu.querySelectorAll("a")).toHaveLength(5);

    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Point history",
      "Redeem rewards",
      "Referral code",
      "Edit profile",
      "CSA Membership",
      "Sign out",
    ]);

    const signOut = within(menu).getByRole("menuitem", { name: "Sign out" });
    const logoutForm = signOut.closest("form");
    expect(logoutForm).toHaveAttribute("method", "post");
    expect(logoutForm).toHaveAttribute("action", "/api/auth/logout?locale=en");

    const language = screen.getByRole("link", {
      name: "Language: Tiếng Việt",
    });
    expect(language).toHaveAttribute("href", "/vi");
    expect(language).toHaveAttribute("hreflang", "vi");
    expect(language).toHaveAttribute("lang", "vi");
    resolveAccount(
      Response.json({ data: { points_balance: 1280 } }, { status: 200 }),
    );
    expect(
      await within(pointsSummary as HTMLElement).findByText("1,280"),
    ).toHaveClass("header-account-balance");
  });

  it.each([null, { status: "ended" }, { status: "revoked" }])(
    "hides the desktop Membership destination for %o",
    async (membershipData) => {
      let resolveMembership!: (response: Response) => void;
      const membershipResponse = new Promise<Response>((resolve) => {
        resolveMembership = resolve;
      });
      const fetchMock = vi.fn((input: string | URL | Request) =>
        String(input).startsWith("/api/account/memberships/current?locale=")
          ? membershipResponse
          : Promise.resolve(
              String(input) === "/api/account/account"
                ? Response.json({ data: { points_balance: 1280 } })
                : Response.json({ data: { user: member } }),
            ),
      );
      vi.stubGlobal("fetch", fetchMock);
      render(
        <SiteHeader
          dictionary={getSiteContent("en").common}
          externalLinks={{}}
          initialUser={member}
          locale="en"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Account" }));
      const menu = screen.getByRole("menu", { name: "Account" });
      expect(
        within(menu).queryByRole("menuitem", { name: "CSA Membership" }),
      ).toBeNull();
      await waitFor(() =>
        expect(
          fetchMock.mock.calls.filter(([input]) =>
            String(input).startsWith(
              "/api/account/memberships/current?locale=",
            ),
          ),
        ).toHaveLength(1),
      );
      await act(async () =>
        resolveMembership(Response.json({ data: membershipData })),
      );
      expect(
        within(menu).queryByRole("menuitem", { name: "CSA Membership" }),
      ).toBeNull();
    },
  );

  it.each([null, { status: "revoked" }])(
    "hides the desktop Membership destination when reopen refreshes to %o",
    async (membershipData) => {
      let membershipCalls = 0;
      let resolveRefresh!: (response: Response) => void;
      const refreshResponse = new Promise<Response>((resolve) => {
        resolveRefresh = resolve;
      });
      const fetchMock = vi.fn((input: string | URL | Request) => {
        if (
          String(input).startsWith("/api/account/memberships/current?locale=")
        ) {
          membershipCalls += 1;
          return membershipCalls === 1
            ? Promise.resolve(Response.json({ data: { status: "active" } }))
            : refreshResponse;
        }
        return Promise.resolve(
          String(input) === "/api/account/account"
            ? Response.json({ data: { points_balance: 1280 } })
            : Response.json({ data: { user: member } }),
        );
      });
      vi.stubGlobal("fetch", fetchMock);
      render(
        <SiteHeader
          dictionary={getSiteContent("en").common}
          externalLinks={{}}
          initialUser={member}
          locale="en"
        />,
      );

      const trigger = screen.getByRole("button", { name: "Account" });
      fireEvent.click(trigger);
      let menu = screen.getByRole("menu", { name: "Account" });
      expect(
        await within(menu).findByRole("menuitem", {
          name: "CSA Membership",
        }),
      ).toBeVisible();

      fireEvent.click(trigger);
      fireEvent.click(trigger);
      menu = screen.getByRole("menu", { name: "Account" });
      expect(
        within(menu).queryByRole("menuitem", { name: "CSA Membership" }),
      ).toBeNull();
      expect(membershipCalls).toBe(2);

      await act(async () =>
        resolveRefresh(Response.json({ data: membershipData })),
      );
      expect(
        within(menu).queryByRole("menuitem", { name: "CSA Membership" }),
      ).toBeNull();
      expect(membershipCalls).toBe(2);
    },
  );

  it.each(["/workshops/en", "/csa/en"])(
    "adds the current pathname to every level-one destination from %s",
    async (pathname) => {
      navigation.pathname = pathname;
      vi.stubGlobal(
        "fetch",
        vi.fn((input: string | URL | Request) =>
          Promise.resolve(
            String(input).startsWith("/api/account/memberships/current?locale=")
              ? Response.json({ data: { status: "active" } })
              : String(input) === "/api/account/account"
                ? Response.json({ data: { points_balance: 1280 } })
                : Response.json({ data: { user: member } }),
          ),
        ),
      );
      render(
        <SiteHeader
          dictionary={getSiteContent("en").common}
          externalLinks={{}}
          initialUser={member}
          locale="en"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Account" }));
      const menu = screen.getByRole("menu", { name: "Account" });
      const encodedPath = encodeURIComponent(pathname);
      expect(
        within(menu).getByRole("menuitem", { name: "Point history" }),
      ).toHaveAttribute("href", `/account/en/points?returnTo=${encodedPath}`);
      expect(
        within(menu).getByRole("menuitem", { name: "Redeem rewards" }),
      ).toHaveAttribute("href", `/account/en/rewards?returnTo=${encodedPath}`);
      expect(
        within(menu).getByRole("menuitem", { name: "Referral code" }),
      ).toHaveAttribute("href", `/account/en/referral?returnTo=${encodedPath}`);
      await waitFor(() =>
        expect(
          within(menu).getByRole("menuitem", { name: "CSA Membership" }),
        ).toHaveAttribute(
          "href",
          `/account/en/membership?returnTo=${encodedPath}`,
        ),
      );
    },
  );

  it("preserves the full current path, including its query, in account destinations", async () => {
    navigation.pathname = "/account/en/points";
    navigation.search = "returnTo=%2Fworkshops%2Fen";
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        Promise.resolve(
          String(input).startsWith("/api/account/memberships/current?locale=")
            ? Response.json({ data: { status: "active" } })
            : String(input) === "/api/account/account"
              ? Response.json({ data: { points_balance: 1280 } })
              : Response.json({ data: { user: member } }),
        ),
      ),
    );
    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={member}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    const menu = screen.getByRole("menu", { name: "Account" });
    const returnTo =
      "%2Faccount%2Fen%2Fpoints%3FreturnTo%3D%252Fworkshops%252Fen";
    expect(
      within(menu).getByRole("menuitem", { name: "Point history" }),
    ).toHaveAttribute("href", `/account/en/points?returnTo=${returnTo}`);
    expect(
      within(menu).getByRole("menuitem", { name: "Redeem rewards" }),
    ).toHaveAttribute("href", `/account/en/rewards?returnTo=${returnTo}`);
    expect(
      within(menu).getByRole("menuitem", { name: "Referral code" }),
    ).toHaveAttribute("href", `/account/en/referral?returnTo=${returnTo}`);
    await waitFor(() =>
      expect(
        within(menu).getByRole("menuitem", { name: "CSA Membership" }),
      ).toHaveAttribute("href", `/account/en/membership?returnTo=${returnTo}`),
    );
  });

  it("preserves the full current path, including its query, for signed-out actions", () => {
    navigation.pathname = "/account/en/points";
    navigation.search = "returnTo=%2Fworkshops%2Fen";
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    const menu = screen.getByRole("menu", { name: "Account" });
    const returnTo =
      "%2Faccount%2Fen%2Fpoints%3FreturnTo%3D%252Fworkshops%252Fen";
    expect(
      within(menu).getByRole("menuitem", { name: "Sign in" }),
    ).toHaveAttribute("href", `/api/auth/login?locale=en&returnTo=${returnTo}`);
    expect(
      within(menu).getByRole("menuitem", { name: "Create account" }),
    ).toHaveAttribute(
      "href",
      `/api/auth/register?locale=en&returnTo=${returnTo}`,
    );
  });

  it("formats the Vietnamese identity and balance", async () => {
    navigation.pathname = "/vi";
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        Promise.resolve(
          String(input) === "/api/account/account"
            ? Response.json({ data: { points_balance: 1280 } })
            : Response.json({ data: { user: member } }),
        ),
      ),
    );
    render(
      <SiteHeader
        dictionary={getSiteContent("vi").common}
        externalLinks={{}}
        initialUser={member}
        locale="vi"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    const menu = screen.getByRole("menu", { name: "Tài khoản" });
    expect(within(menu).getByText("Tài khoản của")).toBeVisible();
    expect(within(menu).getByText(member.name)).toBeVisible();
    expect(
      within(menu).getByRole("menuitem", { name: "Lịch sử điểm" }),
    ).toHaveAttribute("href", "/account/vi/points?returnTo=%2Fvi");
    expect(
      within(menu).getByRole("menuitem", { name: "Mã giới thiệu" }),
    ).toHaveAttribute("href", "/account/vi/referral?returnTo=%2Fvi");
    expect(
      within(menu).getByRole("menuitem", { name: "Chỉnh sửa thông tin" }),
    ).toHaveAttribute("href", "/api/auth/account?returnTo=%2Faccount%2Fvi");
    expect(
      await within(menu).findByText("1.280", {
        selector: ".header-account-balance",
      }),
    ).toBeVisible();
  });

  it("keeps the points balance separate from the points history action", () => {
    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={member}
        locale="en"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    const menu = screen.getByRole("menu", { name: "Account" });
    expect(
      within(menu).getByRole("menuitem", { name: "Point history" }),
    ).toBeInTheDocument();
    expect(
      within(menu).queryByRole("menuitem", { name: /Current points/ }),
    ).not.toBeInTheDocument();
  });

  it("shows an unavailable balance after failure and retries on reopen", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) =>
      Promise.resolve(
        String(input) === "/api/account/account" ||
          String(input).startsWith("/api/account/memberships/current?locale=")
          ? Response.json({ error: "upstream_unavailable" }, { status: 502 })
          : Response.json({ data: { user: member } }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={member}
        locale="en"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Account" });
    fireEvent.click(trigger);
    const menu = screen.getByRole("menu", { name: "Account" });
    expect(
      within(menu).queryByRole("menuitem", { name: "CSA Membership" }),
    ).toBeNull();
    expect(
      await screen.findByText("—", { selector: ".header-account-balance" }),
    ).toBeVisible();
    expect(
      screen.queryByText("0", { selector: ".header-account-balance" }),
    ).not.toBeInTheDocument();
    expect(
      within(menu).queryByRole("menuitem", { name: "CSA Membership" }),
    ).toBeNull();

    fireEvent.click(trigger);
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(
          ([input]) => String(input) === "/api/account/account",
        ),
      ).toHaveLength(2),
    );
  });

  it("deduplicates rapid opens while refreshing Membership on each completed reopen", async () => {
    let resolveAccount!: (response: Response) => void;
    const accountResponse = new Promise<Response>((resolve) => {
      resolveAccount = resolve;
    });
    const fetchMock = vi.fn((input: string | URL | Request) =>
      String(input) === "/api/account/account"
        ? accountResponse
        : String(input).startsWith("/api/account/memberships/current?locale=")
          ? Promise.resolve(Response.json({ data: { status: "scheduled" } }))
          : Promise.resolve(Response.json({ data: { user: member } })),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={member}
        locale="en"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Account" });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(
      fetchMock.mock.calls.filter(
        ([input]) => String(input) === "/api/account/account",
      ),
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).startsWith("/api/account/memberships/current?locale="),
      ),
    ).toHaveLength(1);

    resolveAccount(Response.json({ data: { points_balance: 1280 } }));
    expect(
      await screen.findByText("1,280", {
        selector: ".header-account-balance",
      }),
    ).toBeVisible();
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(
      fetchMock.mock.calls.filter(
        ([input]) => String(input) === "/api/account/account",
      ),
    ).toHaveLength(1);
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([input]) =>
          String(input).startsWith("/api/account/memberships/current?locale="),
        ),
      ).toHaveLength(2),
    );
  });

  it.each(["Enter", " "])("opens the account menu with %s", (key) => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: "Account" });

    fireEvent.keyDown(trigger, { key });

    expect(screen.getByRole("menu", { name: "Account" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape and returns focus to the account trigger", () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: "Account" });
    fireEvent.click(trigger);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("menu", { name: "Account" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes when the user points outside the account menu", () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: "Account" });
    fireEvent.click(trigger);

    fireEvent.pointerDown(document.body);

    expect(
      screen.queryByRole("menu", { name: "Account" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("clears an initial user when the session endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "upstream_unavailable" }, { status: 502 }),
        ),
    );

    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={{ ...member, name: "Stale Member" }}
        locale="en"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Account" });
    fireEvent.click(trigger);
    expect(screen.getByText("Stale Member")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Stale Member")).not.toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole("menu", { name: "Account" })).getByRole(
        "menuitem",
        { name: "Sign in" },
      ),
    ).toBeInTheDocument();
  });
});

describe("mobile account drawer", () => {
  it("shows a signed-in account accordion with shared lazy balance links", async () => {
    let resolveAccount!: (response: Response) => void;
    const accountResponse = new Promise<Response>((resolve) => {
      resolveAccount = resolve;
    });
    const fetchMock = vi.fn((input: string | URL | Request) =>
      String(input) === "/api/account/account"
        ? accountResponse
        : String(input).startsWith("/api/account/memberships/current?locale=")
          ? Promise.resolve(Response.json({ data: { status: "scheduled" } }))
          : Promise.resolve(Response.json({ data: { user: member } })),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={member}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const drawer = screen.getByRole("dialog", { name: "Menu" });
    const account = within(drawer).getByRole("button", { name: "Account" });
    expect(
      within(drawer).queryByRole("button", { name: "Sign out" }),
    ).toBeNull();
    expect(within(drawer).queryByText(new RegExp(member.name))).toBeNull();
    expect(account).toHaveAttribute("aria-controls", "mobile-account-panel");
    expect(account).toHaveAttribute("aria-expanded", "false");
    expect(
      within(drawer).queryByRole("link", { name: "Edit profile" }),
    ).toBeNull();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/account/account");

    fireEvent.click(account);
    fireEvent.click(account);
    fireEvent.click(account);
    const panel = drawer.querySelector("#mobile-account-panel");
    expect(account).toHaveAttribute("aria-expanded", "true");
    expect(panel).toBeInTheDocument();
    expect(within(panel as HTMLElement).getByText("Account of")).toBeVisible();
    expect(within(panel as HTMLElement).getByText(member.name)).toBeVisible();
    const edit = within(drawer).getByRole("link", { name: "Edit profile" });
    const points = within(drawer).getByRole("link", {
      name: "Point history",
    });
    const referral = within(drawer).getByRole("link", {
      name: "Referral code",
    });
    const rewards = within(drawer).getByRole("link", {
      name: "Redeem rewards",
    });
    const membership = await within(drawer).findByRole("link", {
      name: "CSA Membership",
    });
    expect(edit).toHaveAttribute(
      "href",
      "/api/auth/account?returnTo=%2Faccount%2Fen",
    );
    expect(points).toHaveAttribute("href", "/account/en/points?returnTo=%2Fen");
    expect(rewards).toHaveAttribute(
      "href",
      "/account/en/rewards?returnTo=%2Fen",
    );
    expect(referral).toHaveAttribute(
      "href",
      "/account/en/referral?returnTo=%2Fen",
    );
    expect(membership).toHaveAttribute(
      "href",
      "/account/en/membership?returnTo=%2Fen",
    );
    expect(
      within(drawer).queryByRole("link", { name: "Your account" }),
    ).toBeNull();

    const logout = within(drawer).getByRole("button", { name: "Sign out" });
    const logoutForm = logout.closest("form");
    expect(logoutForm).toHaveAttribute("method", "post");
    expect(logoutForm).toHaveAttribute("action", "/api/auth/logout?locale=en");
    expect(panel).toContainElement(logout);
    expect(
      account.compareDocumentPosition(edit) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      membership.compareDocumentPosition(logout) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    resolveAccount(Response.json({ data: { points_balance: 1280 } }));
    expect(
      await within(panel as HTMLElement).findByText("1,280", {
        selector: ".header-account-balance",
      }),
    ).toBeVisible();
    expect(
      fetchMock.mock.calls.filter(
        ([input]) => String(input) === "/api/account/account",
      ),
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).startsWith("/api/account/memberships/current?locale="),
      ),
    ).toHaveLength(1);
    fireEvent.click(account);
    fireEvent.click(account);
    expect(
      fetchMock.mock.calls.filter(
        ([input]) => String(input) === "/api/account/account",
      ),
    ).toHaveLength(1);
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([input]) =>
          String(input).startsWith("/api/account/memberships/current?locale="),
        ),
      ).toHaveLength(2),
    );
    const referralLink = within(drawer).getByRole("link", {
      name: "Referral code",
    });
    referralLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(referralLink);
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
  });

  it.each([null, { status: "ended" }, { status: "revoked" }])(
    "hides the mobile Membership destination for %o",
    async (membershipData) => {
      let resolveMembership!: (response: Response) => void;
      const membershipResponse = new Promise<Response>((resolve) => {
        resolveMembership = resolve;
      });
      const fetchMock = vi.fn((input: string | URL | Request) =>
        String(input).startsWith("/api/account/memberships/current?locale=")
          ? membershipResponse
          : Promise.resolve(
              String(input) === "/api/account/account"
                ? Response.json({ data: { points_balance: 1280 } })
                : Response.json({ data: { user: member } }),
            ),
      );
      vi.stubGlobal("fetch", fetchMock);
      render(
        <SiteHeader
          dictionary={getSiteContent("en").common}
          externalLinks={{}}
          initialUser={member}
          locale="en"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const drawer = screen.getByRole("dialog", { name: "Menu" });
      fireEvent.click(within(drawer).getByRole("button", { name: "Account" }));
      expect(
        within(drawer).queryByRole("link", { name: "CSA Membership" }),
      ).toBeNull();
      await waitFor(() =>
        expect(
          fetchMock.mock.calls.filter(([input]) =>
            String(input).startsWith(
              "/api/account/memberships/current?locale=",
            ),
          ),
        ).toHaveLength(1),
      );
      await act(async () =>
        resolveMembership(Response.json({ data: membershipData })),
      );
      expect(
        within(drawer).queryByRole("link", { name: "CSA Membership" }),
      ).toBeNull();
    },
  );

  it.each([null, { status: "revoked" }])(
    "hides the mobile Membership destination when reopen refreshes to %o",
    async (membershipData) => {
      let membershipCalls = 0;
      let resolveRefresh!: (response: Response) => void;
      const refreshResponse = new Promise<Response>((resolve) => {
        resolveRefresh = resolve;
      });
      const fetchMock = vi.fn((input: string | URL | Request) => {
        if (
          String(input).startsWith("/api/account/memberships/current?locale=")
        ) {
          membershipCalls += 1;
          return membershipCalls === 1
            ? Promise.resolve(Response.json({ data: { status: "active" } }))
            : refreshResponse;
        }
        return Promise.resolve(
          String(input) === "/api/account/account"
            ? Response.json({ data: { points_balance: 1280 } })
            : Response.json({ data: { user: member } }),
        );
      });
      vi.stubGlobal("fetch", fetchMock);
      render(
        <SiteHeader
          dictionary={getSiteContent("en").common}
          externalLinks={{}}
          initialUser={member}
          locale="en"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const drawer = screen.getByRole("dialog", { name: "Menu" });
      const account = within(drawer).getByRole("button", { name: "Account" });
      fireEvent.click(account);
      expect(
        await within(drawer).findByRole("link", { name: "CSA Membership" }),
      ).toBeVisible();

      fireEvent.click(account);
      fireEvent.click(account);
      expect(
        within(drawer).queryByRole("link", { name: "CSA Membership" }),
      ).toBeNull();
      expect(membershipCalls).toBe(2);

      await act(async () =>
        resolveRefresh(Response.json({ data: membershipData })),
      );
      expect(
        within(drawer).queryByRole("link", { name: "CSA Membership" }),
      ).toBeNull();
      expect(membershipCalls).toBe(2);
    },
  );

  it("shows an unavailable mobile balance without inventing zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        Promise.resolve(
          String(input) === "/api/account/account" ||
            String(input).startsWith("/api/account/memberships/current?locale=")
            ? Response.json({ error: "upstream_unavailable" }, { status: 502 })
            : Response.json({ data: { user: member } }),
        ),
      ),
    );
    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={member}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const drawer = screen.getByRole("dialog", { name: "Menu" });
    fireEvent.click(within(drawer).getByRole("button", { name: "Account" }));
    expect(
      within(drawer).queryByRole("link", { name: "CSA Membership" }),
    ).toBeNull();

    expect(
      await within(drawer).findByText("—", {
        selector: ".header-account-balance",
      }),
    ).toBeVisible();
    expect(
      within(drawer).queryByText("0", {
        selector: ".header-account-balance",
      }),
    ).toBeNull();
    expect(
      within(drawer).queryByRole("link", { name: "CSA Membership" }),
    ).toBeNull();
  });

  it.each(["Enter", " "])(
    "opens the signed-out Account accordion with %s",
    (key) => {
      navigation.pathname = "/workshops/en";
      renderHeader();
      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const drawer = screen.getByRole("dialog", { name: "Menu" });
      const account = within(drawer).getByRole("button", { name: "Account" });
      expect(
        within(drawer).queryByRole("button", { name: "Sign out" }),
      ).toBeNull();

      fireEvent.keyDown(account, { key });

      expect(account).toHaveAttribute("aria-expanded", "true");
      expect(
        within(drawer).getByRole("link", { name: "Sign in" }),
      ).toHaveAttribute(
        "href",
        "/api/auth/login?locale=en&returnTo=%2Fworkshops%2Fen",
      );
      expect(
        within(drawer).getByRole("link", { name: "Create account" }),
      ).toHaveAttribute(
        "href",
        "/api/auth/register?locale=en&returnTo=%2Fworkshops%2Fen",
      );
    },
  );
});
