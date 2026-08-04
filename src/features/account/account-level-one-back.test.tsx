import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/content/site-content";
import {
  buildAccountLevelOnePath,
  resolveAccountLevelOneBackHref,
} from "@/features/account/account-level-one-back";
import { PointHistoryPage } from "@/features/account/account-list-pages";
import { AccountApiError, accountApi } from "@/features/account/api";
import { ReferralProgramPage } from "@/features/account/referral-program-page";
import { RewardsPage } from "@/features/account/rewards-page";
import { AccountMembershipPage } from "@/features/membership/account-membership-pages";

const navigation = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));
const copy = getSiteContent("en").account;

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/features/account/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/account/api")>();
  return { ...actual, accountApi: vi.fn() };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("resolveAccountLevelOneBackHref", () => {
  const resolve = (returnTo?: unknown) =>
    resolveAccountLevelOneBackHref({
      locale: "en",
      returnTo,
      currentPath: "/account/en/points",
    });

  it("preserves an internal pathname, query and hash", () => {
    expect(resolve("/workshops/en?type=soil#upcoming")).toBe(
      "/workshops/en?type=soil#upcoming",
    );
  });

  it.each([
    ["missing", undefined],
    ["repeated parameter", ["/en", "/workshops/en"]],
    ["external URL", "https://outside.example/path"],
    ["protocol-relative URL", "//outside.example/path"],
    ["malformed URL", "/workshops/%E0%A4%A"],
    ["API route", "/api/auth/callback"],
    ["auth callback", "/auth/callback"],
    ["localized login", "/en/login"],
    ["logout", "/logout"],
    ["current route", "/account/en/points?tab=earned"],
  ])("falls back for a %s", (_, returnTo) => {
    expect(resolve(returnTo)).toBe("/en");
  });
});

describe("buildAccountLevelOnePath", () => {
  it("builds the current level-one URL from the resolved return target", () => {
    expect(
      buildAccountLevelOnePath({
        locale: "en",
        currentPath: "/account/en/points",
        returnTo: "/workshops/en",
      }),
    ).toBe("/account/en/points?returnTo=%2Fworkshops%2Fen");
  });

  it.each(["https://outside.example/path", "/workshops/%E0%A4%A"])(
    "uses the safe fallback instead of raw invalid input",
    (returnTo) => {
      const path = buildAccountLevelOnePath({
        locale: "en",
        currentPath: "/account/en/points",
        returnTo,
      });

      expect(path).toBe("/account/en/points?returnTo=%2Fen");
      expect(path).not.toContain("outside.example");
      expect(path).not.toContain("%E0%A4%A");
    },
  );
});

const levelOnePages = [
  {
    name: "Referral",
    renderPage: (returnTo?: string | null) =>
      render(
        <ReferralProgramPage copy={copy} locale="en" returnTo={returnTo} />,
      ),
  },
  {
    name: "Points",
    renderPage: (returnTo?: string | null) =>
      render(<PointHistoryPage copy={copy} locale="en" returnTo={returnTo} />),
  },
  {
    name: "Rewards",
    renderPage: (returnTo?: string | null) =>
      render(<RewardsPage copy={copy} locale="en" returnTo={returnTo} />),
  },
  {
    name: "Membership",
    renderPage: (returnTo?: string | null) =>
      render(
        <AccountMembershipPage copy={copy} locale="en" returnTo={returnTo} />,
      ),
  },
] as const;

describe.each(levelOnePages)("$name level-one Back", ({ renderPage }) => {
  it("replaces with a valid returnTo", () => {
    vi.mocked(accountApi).mockReturnValue(new Promise(() => {}));
    renderPage("/workshops/en?type=soil#upcoming");

    fireEvent.click(screen.getByRole("button", { name: copy.back }));

    expect(navigation.replace).toHaveBeenCalledWith(
      "/workshops/en?type=soil#upcoming",
    );
    expect(navigation.back).not.toHaveBeenCalled();
  });

  it.each([undefined, "https://outside.example/path"])(
    "replaces with the locale home for a missing or invalid returnTo",
    (returnTo) => {
      vi.mocked(accountApi).mockReturnValue(new Promise(() => {}));
      renderPage(returnTo);

      fireEvent.click(screen.getByRole("button", { name: copy.back }));

      expect(navigation.replace).toHaveBeenCalledWith("/en");
      expect(navigation.back).not.toHaveBeenCalled();
    },
  );
});

describe("level-one continuation chains", () => {
  it("preserves Workshop through Points, Rewards, then Points again", () => {
    vi.mocked(accountApi).mockReturnValue(new Promise(() => {}));
    const pointsPath = "/account/en/points?returnTo=%2Fworkshops%2Fen";
    const rewardsPath =
      "/account/en/rewards?returnTo=%2Faccount%2Fen%2Fpoints%3FreturnTo%3D%252Fworkshops%252Fen";

    render(
      <PointHistoryPage copy={copy} locale="en" returnTo="/workshops/en" />,
    );
    expect(
      screen.getByRole("link", { name: copy.redeemRewardsNow }),
    ).toHaveAttribute("href", rewardsPath);
    fireEvent.click(screen.getByRole("button", { name: copy.back }));
    expect(navigation.replace).toHaveBeenCalledWith("/workshops/en");

    cleanup();
    vi.clearAllMocks();
    vi.mocked(accountApi).mockReturnValue(new Promise(() => {}));
    render(<RewardsPage copy={copy} locale="en" returnTo={pointsPath} />);
    fireEvent.click(screen.getByRole("button", { name: copy.back }));
    expect(navigation.replace).toHaveBeenCalledWith(pointsPath);

    cleanup();
    vi.clearAllMocks();
    vi.mocked(accountApi).mockReturnValue(new Promise(() => {}));
    render(
      <PointHistoryPage copy={copy} locale="en" returnTo="/workshops/en" />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.back }));
    expect(navigation.replace).toHaveBeenCalledWith("/workshops/en");
  });

  it.each(["https://outside.example/path", "/workshops/%E0%A4%A"])(
    "does not put raw invalid input in the Points to Rewards link",
    (returnTo) => {
      vi.mocked(accountApi).mockReturnValue(new Promise(() => {}));
      render(<PointHistoryPage copy={copy} locale="en" returnTo={returnTo} />);

      const href = screen
        .getByRole("link", { name: copy.redeemRewardsNow })
        .getAttribute("href");
      expect(href).toBe(
        "/account/en/rewards?returnTo=%2Faccount%2Fen%2Fpoints%3FreturnTo%3D%252Fen",
      );
      expect(href).not.toContain("outside.example");
      expect(href).not.toContain("%E0%A4%A");
    },
  );
});

describe("level-one signed-out continuations", () => {
  const expectedCurrentPath = (route: string) =>
    `/account/en/${route}?returnTo=%2Fworkshops%2Fen`;
  const expectedLoginHref = (route: string) =>
    `/api/auth/login?locale=en&returnTo=${encodeURIComponent(expectedCurrentPath(route))}`;

  it("preserves Referral returnTo after the session expires", async () => {
    vi.mocked(accountApi).mockRejectedValue(
      new AccountApiError("session_expired", 401),
    );
    render(
      <ReferralProgramPage copy={copy} locale="en" returnTo="/workshops/en" />,
    );

    expect(
      await screen.findByRole("link", { name: copy.signIn }),
    ).toHaveAttribute("href", expectedLoginHref("referral"));
  });

  it("preserves Points returnTo after the session expires", async () => {
    vi.mocked(accountApi).mockRejectedValue(
      new AccountApiError("session_expired", 401),
    );
    render(
      <PointHistoryPage copy={copy} locale="en" returnTo="/workshops/en" />,
    );

    expect(
      await screen.findByRole("link", { name: copy.signIn }),
    ).toHaveAttribute("href", expectedLoginHref("points"));
  });

  it("preserves Rewards returnTo in its sign-in links", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "account") throw new AccountApiError("session_expired", 401);
      return { data: [], meta: { page: 1, page_size: 30, total: 0 } };
    });
    render(<RewardsPage copy={copy} locale="en" returnTo="/workshops/en" />);

    expect(
      await screen.findByRole("link", { name: copy.signIn }),
    ).toHaveAttribute("href", expectedLoginHref("rewards"));
  });

  it("preserves Membership returnTo after the session expires", async () => {
    vi.mocked(accountApi).mockRejectedValue(
      new AccountApiError("session_expired", 401),
    );
    render(
      <AccountMembershipPage
        copy={copy}
        locale="en"
        returnTo="/workshops/en"
      />,
    );

    expect(
      await screen.findByRole("link", { name: copy.signIn }),
    ).toHaveAttribute("href", expectedLoginHref("membership"));
  });

  it.each([
    ["https://outside.example/path", "outside.example"],
    ["/workshops/%E0%A4%A", "%E0%A4%A"],
  ])(
    "excludes invalid raw input from signed-out auth URLs",
    async (returnTo, raw) => {
      vi.mocked(accountApi).mockRejectedValue(
        new AccountApiError("session_expired", 401),
      );
      render(<PointHistoryPage copy={copy} locale="en" returnTo={returnTo} />);

      const href = (
        await screen.findByRole("link", { name: copy.signIn })
      ).getAttribute("href");
      expect(href).toBe(
        "/api/auth/login?locale=en&returnTo=%2Faccount%2Fen%2Fpoints%3FreturnTo%3D%252Fen",
      );
      expect(href).not.toContain(raw);
    },
  );
});
