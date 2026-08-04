import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/content/site-content";
import { AccountApiError, accountApi } from "@/features/account/api";
import { RedemptionsPage } from "@/features/account/redemption-pages";
import { RewardsPage } from "@/features/account/rewards-page";
import type { Redemption, Reward } from "@/features/account/types";

const navigation = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/features/account/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/account/api")>();
  return { ...actual, accountApi: vi.fn() };
});

const uuid = "11111111-1111-4111-8111-111111111111";

const rewards: Reward[] = [
  {
    id: "reward-1",
    point_cost: 100,
    image: {
      id: "image-1",
      url: "https://auth.example.test/media/reward.jpg",
      width: 800,
      height: 600,
      variants: [
        {
          url: "https://auth.example.test/media/reward-480.webp",
          width: 480,
          height: 360,
        },
        {
          url: "https://auth.example.test/media/reward-960.webp",
          width: 960,
          height: 720,
        },
      ],
    },
    position: 1,
    requested_locale: "en",
    content_locale: "en",
    is_fallback: false,
    name: "Seasonal vegetables",
    short_description: "Fresh vegetables from the farm.",
  },
  {
    id: "reward-2",
    point_cost: 50,
    image: {
      id: "image-2",
      url: "https://auth.example.test/media/meat.jpg",
      width: 800,
      height: 600,
      variants: [],
    },
    position: 2,
    requested_locale: "en",
    content_locale: "en",
    is_fallback: false,
    name: "Farm meat box",
    short_description: "A selection from the farm.",
  },
];

const redemption: Redemption = {
  id: "22222222-2222-4222-8222-222222222222",
  reward_id: "reward-1",
  reward_name_vi_snapshot: "Rau theo mùa",
  reward_name_en_snapshot: "Seasonal vegetables",
  reward_name: "Seasonal vegetables",
  point_cost_snapshot: 100,
  status: "pending",
  rejection_message: "",
  created_at: "2026-07-20T08:00:00Z",
  contacted_at: null,
  completed_at: null,
  rejected_at: null,
  updated_at: "2026-07-20T08:00:00Z",
};

function catalogResponse(path: string) {
  if (path === "account") {
    return {
      data: {
        referral_code: "NFV1234567",
        referrer: null,
        can_submit_referral_code: true,
        points_balance: 120,
        invited_count: 1,
      },
    };
  }
  if (path.startsWith("rewards")) {
    return {
      data: rewards,
      meta: { page: 1, page_size: 30, total: 2 },
    };
  }
  throw new Error(`Unexpected request: ${path}`);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("public reward redemption", () => {
  it("renders the public reward contract without inventory state", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) =>
      catalogResponse(path),
    );

    const { container } = render(
      <RewardsPage locale="en" copy={getSiteContent("en").account} />,
    );

    expect(
      await screen.findByRole("heading", { name: "Redeem rewards" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "How it works" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Fresh vegetables from the farm."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Redeem Seasonal vegetables" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Redeem Farm meat box" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("link", { name: "Redemption history" }),
    ).toHaveAttribute("href", "/account/en/redemptions");
    expect(screen.getByText("Your points")).toBeInTheDocument();
    expect(
      container.querySelector(".rewards-balance-icon svg"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/out of stock/i)).not.toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://auth.example.test/media/reward-480.webp",
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "srcset",
      expect.stringContaining("reward-960.webp 960w"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(navigation.replace).toHaveBeenCalledWith("/en");
  });

  it("keeps the public catalog visible and offers sign-in without a session", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "account") {
        throw new AccountApiError("session_expired", 401);
      }
      return catalogResponse(path);
    });

    render(<RewardsPage locale="vi" copy={getSiteContent("vi").account} />);

    expect(
      await screen.findByRole("heading", { name: "Đổi quà" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fresh vegetables from the farm."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Đăng nhập để đổi Seasonal vegetables",
      }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("/account/vi/rewards")),
    );
    expect(
      screen.getByRole("link", { name: "Đăng nhập để đổi Farm meat box" }),
    ).toBeInTheDocument();
  });

  it("reuses one idempotency key when the same dialog attempt is retried", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => uuid) });
    const bodies: string[] = [];
    let attempts = 0;
    vi.mocked(accountApi).mockImplementation(async (path, init) => {
      if (path !== "redemptions") return catalogResponse(path);
      bodies.push(String(init?.body));
      attempts += 1;
      if (attempts === 1) throw new Error("insufficient_points");
      return {
        data: { redemption, balance: 20, idempotent_replay: false },
      };
    });

    render(<RewardsPage locale="en" copy={getSiteContent("en").account} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Redeem Seasonal vegetables" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Confirm your reward" }),
    ).toBeVisible();
    expect(screen.getByText("Balance after redemption")).toBeInTheDocument();
    expect(screen.getByText("20 points")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm redemption" }));
    expect(
      await screen.findByText(/current balance is not enough/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm redemption" }));

    expect(
      await screen.findByText("Redemption request received"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(bodies).toHaveLength(2);
    expect(JSON.parse(bodies[0])).toEqual({
      reward_id: rewards[0].id,
      idempotency_key: uuid,
    });
    expect(JSON.parse(bodies[1])).toEqual({
      reward_id: rewards[0].id,
      idempotency_key: uuid,
    });
    expect(
      within(screen.getByRole("status")).getByRole("link", {
        name: "Redemption history",
      }),
    ).toHaveAttribute("href", "/account/en/redemptions");
  });

  it("keeps the first reward selected when two redemption actions are clicked quickly", async () => {
    const randomUUID = vi
      .fn()
      .mockReturnValueOnce("first-attempt")
      .mockReturnValueOnce("second-attempt");
    vi.stubGlobal("crypto", { randomUUID });
    vi.mocked(accountApi).mockImplementation(async (path) =>
      catalogResponse(path),
    );
    render(<RewardsPage locale="en" copy={getSiteContent("en").account} />);

    const firstReward = await screen.findByRole("button", {
      name: "Redeem Seasonal vegetables",
    });
    const secondReward = screen.getByRole("button", {
      name: "Redeem Farm meat box",
    });
    fireEvent.click(firstReward);
    fireEvent.click(secondReward);

    const dialog = screen.getByRole("dialog", { name: "Confirm your reward" });
    expect(within(dialog).getByText("Seasonal vegetables")).toBeVisible();
    expect(within(dialog).queryByText("Farm meat box")).toBeNull();
    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(
      vi
        .mocked(accountApi)
        .mock.calls.filter(
          ([path, init]) => path === "redemptions" && init?.method === "POST",
        ),
    ).toHaveLength(0);

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    fireEvent.click(secondReward);
    expect(
      within(
        screen.getByRole("dialog", { name: "Confirm your reward" }),
      ).getByText("Farm meat box"),
    ).toBeVisible();
    expect(randomUUID).toHaveBeenCalledTimes(2);
  });

  it("blocks rapid confirmation while a redemption request is pending", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => uuid) });
    let resolveRequest: ((value: unknown) => void) | undefined;
    const pending = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    let postCount = 0;
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path !== "redemptions") return catalogResponse(path);
      postCount += 1;
      return pending as never;
    });

    render(<RewardsPage locale="en" copy={getSiteContent("en").account} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Redeem Seasonal vegetables" }),
    );
    const confirm = screen.getByRole("button", { name: "Confirm redemption" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(postCount).toBe(1);
    expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(
      document.querySelector(".redemption-dialog-backdrop") as HTMLElement,
    );
    expect(
      screen.getByRole("dialog", { name: "Confirm your reward" }),
    ).toBeVisible();

    resolveRequest?.({
      data: { redemption, balance: 20, idempotent_replay: false },
    });
    expect(
      await screen.findByText("Redemption request received"),
    ).toBeInTheDocument();
  });

  it("shows a safe conflict and refreshes server-owned account and catalog data", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => uuid) });
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "redemptions") {
        throw new AccountApiError("idempotency_conflict", 409);
      }
      return catalogResponse(path);
    });

    render(<RewardsPage locale="en" copy={getSiteContent("en").account} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Redeem Seasonal vegetables" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm redemption" }));

    expect(
      await screen.findByText(/conflicts with an earlier request/i),
    ).toBeInTheDocument();
    expect(
      vi.mocked(accountApi).mock.calls.filter(([path]) => path === "account"),
    ).toHaveLength(2);
    expect(
      vi
        .mocked(accountApi)
        .mock.calls.filter(([path]) => path.startsWith("rewards")),
    ).toHaveLength(2);
  });

  it("keeps the catalog available when the session expires during submission", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => uuid) });
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "redemptions") {
        throw new AccountApiError("session_expired", 401);
      }
      return catalogResponse(path);
    });

    render(<RewardsPage locale="en" copy={getSiteContent("en").account} />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Redeem Seasonal vegetables",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm redemption" }));

    expect(
      await screen.findByRole("link", {
        name: "Sign in to redeem Seasonal vegetables",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Redeem rewards" }),
    ).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("redemption history", () => {
  it("shows translated rejected status, snapshots and the public rejection message", async () => {
    const rejected = {
      ...redemption,
      status: "rejected" as const,
      rejection_message: "Reward is temporarily unavailable.",
      rejected_at: "2026-07-21T08:00:00Z",
      updated_at: "2026-07-21T08:00:00Z",
    };
    vi.mocked(accountApi).mockResolvedValue({
      data: [rejected],
      meta: { page: 1, page_size: 30, total: 1 },
    });

    render(<RedemptionsPage locale="en" copy={getSiteContent("en").account} />);

    const title = await screen.findByText("Seasonal vegetables");
    const row = title.closest("li");
    expect(title.tagName).toBe("P");
    expect(title).toHaveClass("redemption-reward-name");
    expect(
      screen.getByRole("heading", { name: "Reward request history" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Redeem rewards" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Rejected")).toHaveLength(1);
    expect(
      screen.getByText("Reward is temporarily unavailable."),
    ).toBeInTheDocument();
    const noteLabel = screen.getByText("Note:");
    expect(noteLabel.closest(".redemption-rejection")).toHaveClass(
      "redemption-rejection",
    );
    expect(noteLabel.closest(".redemption-rejection")?.parentElement).toBe(row);
    expect(row?.querySelector(".redemption-list-summary")).toHaveTextContent(
      "Points used: 100 points",
    );
    expect(screen.queryByRole("link", { name: /view details/i })).toBeNull();
    expect(accountApi).toHaveBeenCalledWith(
      "redemptions?locale=en&page=1",
      expect.anything(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to rewards" }));
    expect(navigation.replace).toHaveBeenCalledWith("/account/en/rewards");
  });

  it("discards a stale catalog response when a new request is triggered", async () => {
    let resolveFirst!: (value: { data: unknown[]; meta: unknown }) => void;
    let callCount = 0;
    vi.mocked(accountApi).mockImplementation((path) => {
      if (path === "account")
        return Promise.resolve({
          data: {
            referral_code: "X",
            referrer: null,
            can_submit_referral_code: true,
            points_balance: 120,
            invited_count: 0,
          },
        });
      callCount++;
      if (callCount === 1)
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      return Promise.resolve({
        data: [
          {
            id: "fresh-reward",
            point_cost: 50,
            image: {
              id: "i2",
              url: "http://example.test/r2.jpg",
              width: 100,
              height: 100,
              variants: [],
            },
            position: 1,
            requested_locale: "en",
            content_locale: "en",
            is_fallback: false,
            name: "Fresh Reward",
            short_description: "Fresh",
          },
        ],
        meta: { page: 1, page_size: 1, total: 2 },
      });
    });

    const { rerender } = render(
      <RewardsPage locale="en" copy={getSiteContent("en").account} />,
    );

    // Trigger second request by changing locale (which is a dependency)
    rerender(<RewardsPage locale="vi" copy={getSiteContent("en").account} />);

    expect(await screen.findByText("Fresh Reward")).toBeInTheDocument();

    // Resolve the stale request
    await act(async () =>
      resolveFirst({
        data: [
          {
            id: "stale-reward",
            point_cost: 200,
            image: {
              id: "i1",
              url: "http://example.test/r.jpg",
              width: 100,
              height: 100,
              variants: [],
            },
            position: 1,
            requested_locale: "en",
            content_locale: "en",
            is_fallback: false,
            name: "Stale Reward",
            short_description: "Stale",
          },
        ],
        meta: { page: 1, page_size: 1, total: 2 },
      }),
    );
    expect(screen.queryByText("Stale Reward")).not.toBeInTheDocument();
    expect(screen.getByText("Fresh Reward")).toBeInTheDocument();
  });

  it("does not show a catalog error when the component unmounts mid-request", () => {
    vi.mocked(accountApi).mockImplementation(
      () => new Promise(() => undefined),
    );
    const { unmount } = render(
      <RewardsPage locale="en" copy={getSiteContent("en").account} />,
    );
    const signal = vi
      .mocked(accountApi)
      .mock.calls.find(([path]) => path.startsWith("rewards"))?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("redemption history pagination", () => {
  it("discards a stale response when a new request is triggered", async () => {
    let resolveFirst!: (value: { data: unknown[]; meta: unknown }) => void;
    let callCount = 0;
    vi.mocked(accountApi).mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      return Promise.resolve({
        data: [{ ...redemption, id: "r2", reward_name: "Fresh Reward" }],
        meta: { page: 1, page_size: 1, total: 2 },
      });
    });

    const { rerender } = render(
      <RedemptionsPage locale="en" copy={getSiteContent("en").account} />,
    );

    // Trigger second request by changing locale
    rerender(
      <RedemptionsPage locale="vi" copy={getSiteContent("en").account} />,
    );

    expect(await screen.findByText("Fresh Reward")).toBeInTheDocument();

    await act(async () =>
      resolveFirst({
        data: [{ ...redemption, id: "r1", reward_name: "Stale Reward" }],
        meta: { page: 1, page_size: 1, total: 2 },
      }),
    );
    expect(screen.queryByText("Stale Reward")).not.toBeInTheDocument();
    expect(screen.getByText("Fresh Reward")).toBeInTheDocument();
  });

  it("does not show an error when a redemption history request is aborted by unmount", () => {
    vi.mocked(accountApi).mockImplementation(
      () => new Promise(() => undefined),
    );
    const { unmount } = render(
      <RedemptionsPage locale="en" copy={getSiteContent("en").account} />,
    );
    const signal = vi.mocked(accountApi).mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
