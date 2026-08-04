import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/content/site-content";
import {
  InvitedPeoplePage,
  PointHistoryPage,
} from "@/features/account/account-list-pages";
import { AccountApiError, accountApi } from "@/features/account/api";
import { AccountSignedOutState } from "@/features/account/account-presentation";
import { ReferralProgramPage } from "@/features/account/referral-program-page";
import type { AccountSummary } from "@/features/account/types";

const navigation = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));

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

const summary = {
  referral_code: "NFV1234567",
  referrer: null,
  can_submit_referral_code: true,
  points_balance: 100,
  invited_count: 1,
};

function mockAccount() {
  vi.mocked(accountApi).mockImplementation(async (path) => {
    if (path === "account") return { data: summary };
    if (path.startsWith("invited-users"))
      return {
        data: [
          {
            id: "1",
            name: "Safe Name",
            status: "joined",
            referred_at: "2026-07-20T00:00:00Z",
          },
        ],
        meta: { page: 1, page_size: 30, total: 31 },
      };
    if (path.startsWith("points"))
      return {
        data: [
          {
            id: "1",
            direction: "credit",
            amount: 100,
            message: "Referral successful",
            created_at: "2026-07-20T00:00:00Z",
          },
          {
            id: "2",
            direction: "debit",
            amount: 25,
            message: "Reward redeemed",
            created_at: "2026-07-21T00:00:00Z",
          },
        ],
        meta: { page: 1, page_size: 30, total: 31, balance: 100 },
      };
    return {
      data: {
        ...summary,
        referrer: { id: "2", name: "Referrer" },
        can_submit_referral_code: false,
      },
    };
  });
}

describe("public account pages", () => {
  it("keeps referral details and guidance on one compact detail page", async () => {
    mockAccount();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <ReferralProgramPage locale="en" copy={getSiteContent("en").account} />,
    );

    expect(
      await screen.findByRole("heading", { name: "How it works" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "They place their first order",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Conditions for earning points" }),
    ).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("+50")).toBeInTheDocument();
    expect(
      screen.getByText(/paid, delivered and worth at least 300,000₫/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Redeem rewards" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Redemption history" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "People invited" }),
    ).toHaveAttribute("href", "/account/en/invited");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(navigation.replace).toHaveBeenCalledWith("/en");

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("NFV1234567"));

    fireEvent.change(screen.getByLabelText("Enter a referral code"), {
      target: { value: "REFCODE123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit code" }));
    expect(
      await screen.findByText("You were referred by Referrer."),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Enter a referral code"),
    ).not.toBeInTheDocument();
  });

  it("uses the shared signed-out state when the referral session expires", async () => {
    vi.mocked(accountApi).mockRejectedValueOnce(
      new AccountApiError("session_expired", 401),
    );
    render(
      <ReferralProgramPage locale="en" copy={getSiteContent("en").account} />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Sign in to view your account",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      expect.stringContaining("returnTo"),
    );
    expect(screen.queryByText("NFV1234567")).not.toBeInTheDocument();
  });

  it("blocks a second submit-code POST while the first is still pending", async () => {
    let resolveFirst!: (value: { data: AccountSummary }) => void;
    const firstPending = new Promise<{ data: AccountSummary }>((resolve) => {
      resolveFirst = resolve;
    });
    let postCount = 0;
    vi.mocked(accountApi).mockImplementation(async (path, init) => {
      if (init?.method !== "POST") {
        return { data: summary };
      }
      postCount += 1;
      return firstPending;
    });

    render(
      <ReferralProgramPage locale="en" copy={getSiteContent("en").account} />,
    );
    await screen.findByRole("heading", { name: "How it works" });
    const input = screen.getByLabelText("Enter a referral code");
    fireEvent.change(input, { target: { value: "REFCODE123" } });
    const submitBtn = screen.getByRole("button", { name: "Submit code" });
    // Fire three times synchronously — only one POST should be sent
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);
    expect(postCount).toBe(1);

    // After the first request resolves the user can submit again
    const updatedSummary = {
      ...summary,
      referrer: { id: "99", name: "Referrer" },
      can_submit_referral_code: false,
    };
    await act(async () => resolveFirst({ data: updatedSummary }));
    expect(screen.queryByLabelText("Enter a referral code")).not.toBeInTheDocument();

    // Submit button is gone once referrer is set, but the guard should have
    // released — assert postCount is still 1 (no extra calls snuck through)
    expect(postCount).toBe(1);
  });

  it("allows resubmitting if the first referral POST fails", async () => {
    let postCount = 0;
    vi.mocked(accountApi).mockImplementation(async (path, init) => {
      if (init?.method !== "POST") {
        return { data: summary };
      }
      postCount += 1;
      if (postCount === 1) {
        throw new Error("network failed");
      }
      return {
        data: {
          ...summary,
          referrer: { id: "99", name: "Referrer" },
          can_submit_referral_code: false,
        },
      };
    });

    render(
      <ReferralProgramPage locale="en" copy={getSiteContent("en").account} />,
    );
    await screen.findByRole("heading", { name: "How it works" });
    const input = screen.getByLabelText("Enter a referral code");
    fireEvent.change(input, { target: { value: "REFCODE123" } });
    const submitBtn = screen.getByRole("button", { name: "Submit code" });
    
    // First submit fails
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    
    // Check error message displays
    expect(await screen.findByText(getSiteContent("en").account.error)).toBeInTheDocument();
    
    // Nút submit không bị kẹt disabled sau lỗi đầu
    expect(submitBtn).not.toBeDisabled();
    
    // Submit again
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    
    // Assert second submit succeeds
    expect(await screen.findByText("You were referred by Referrer.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Enter a referral code")).not.toBeInTheDocument();
    expect(postCount).toBe(2);
  });

  it("shows a clear unauthenticated state with login continuation", () => {
    render(
      <AccountSignedOutState locale="vi" copy={getSiteContent("vi").account} />,
    );
    expect(
      screen.getByRole("heading", { name: "Đăng nhập để xem tài khoản" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute(
      "href",
      expect.stringContaining("returnTo"),
    );
  });

  it("loads point history on its own paginated page", async () => {
    mockAccount();
    render(
      <PointHistoryPage locale="en" copy={getSiteContent("en").account} />,
    );

    expect(await screen.findByText("Referral successful")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your points" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your reward points earned and used"),
    ).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByLabelText("Credit: 100")).toHaveClass("credit");
    expect(screen.getByLabelText("Debit: 25")).toHaveClass("debit");
    expect(
      screen
        .getByText("Referral successful")
        .closest("li")
        ?.querySelector('time[datetime="2026-07-20T00:00:00Z"]'),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Redeem now" })).toHaveAttribute(
      "href",
      "/account/en/rewards?returnTo=%2Faccount%2Fen%2Fpoints%3FreturnTo%3D%252Fen",
    );
    const back = screen.getByRole("button", { name: "Back" });
    expect(back).toHaveTextContent("Back");
    fireEvent.click(back);
    expect(navigation.replace).toHaveBeenCalledWith("/en");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(accountApi).toHaveBeenCalledWith("points?page=2", expect.anything()),
    );
  });

  it("keeps invited people private on a separate paginated page", async () => {
    mockAccount();
    render(
      <InvitedPeoplePage locale="en" copy={getSiteContent("en").account} />,
    );

    expect(await screen.findByText("Safe Name")).toBeInTheDocument();
    expect(
      screen.getByText(
        "People who created an account with your referral code.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("31 people")).toBeInTheDocument();
    expect(
      screen.getByText("Joined with your referral code"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("S", { selector: "[aria-hidden='true']" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to Referral code" }),
    ).toHaveTextContent("Back to Referral code");
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Back to Referral code" }),
    );
    expect(navigation.replace).toHaveBeenCalledWith("/account/en/referral");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(accountApi).toHaveBeenCalledWith("invited-users?page=2", expect.anything()),
    );
  });

  it("uses the shared empty state with referral-specific guidance", async () => {
    vi.mocked(accountApi).mockResolvedValueOnce({
      data: [],
      meta: { page: 1, page_size: 30, total: 0 },
    });
    render(
      <InvitedPeoplePage locale="en" copy={getSiteContent("en").account} />,
    );

    expect(
      await screen.findByText(
        "You have not invited anyone yet. Share your referral code with friends.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("0 people")).toBeInTheDocument();
  });

  it("discards a stale response when a new request is triggered for PointHistoryPage", async () => {
    let resolveFirst!: (value: { data: unknown[]; meta: unknown }) => void;
    let callCount = 0;
    vi.mocked(accountApi).mockImplementation(() => {
      callCount++;
      if (callCount === 1) return new Promise((resolve) => { resolveFirst = resolve; });
      return Promise.resolve({
        data: [{ id: "p2", direction: "debit", amount: 5, message: "Fresh Item", created_at: "2026-01-02T00:00:00Z" }],
        meta: { page: 1, page_size: 30, total: 31, balance: 5 }
      });
    });

    const { rerender } = render(<PointHistoryPage locale="en" copy={getSiteContent("en").account} />);
    
    // Trigger second request by changing a dependency primitive
    rerender(<PointHistoryPage locale="en" copy={{ ...getSiteContent("en").account, error: "trigger" }} />);
    
    expect(await screen.findByText("Fresh Item")).toBeInTheDocument();
    
    // Resolve the first (stale) request
    await act(async () =>
      resolveFirst({
        data: [{ id: "p1", direction: "credit", amount: 10, message: "Stale Item", created_at: "2026-01-01T00:00:00Z" }],
        meta: { page: 1, page_size: 30, total: 31, balance: 10 }
      }),
    );
    expect(screen.queryByText("Stale Item")).not.toBeInTheDocument();
    expect(screen.getByText("Fresh Item")).toBeInTheDocument();
  });

  it("does not show an error when a PointHistoryPage request is aborted by unmount", () => {
    vi.mocked(accountApi).mockImplementation(() => new Promise(() => undefined));
    const { unmount } = render(
      <PointHistoryPage locale="en" copy={getSiteContent("en").account} />,
    );
    const signal = vi.mocked(accountApi).mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("discards a stale response when a new request is triggered for InvitedPeoplePage", async () => {
    let resolveFirst!: (value: { data: unknown[]; meta: unknown }) => void;
    let callCount = 0;
    vi.mocked(accountApi).mockImplementation(() => {
      callCount++;
      if (callCount === 1) return new Promise((resolve) => { resolveFirst = resolve; });
      return Promise.resolve({
        data: [{ id: "u2", name: "Fresh Person", status: "joined", referred_at: "2026-01-02T00:00:00Z" }],
        meta: { page: 1, page_size: 30, total: 31 }
      });
    });

    const { rerender } = render(<InvitedPeoplePage locale="en" copy={getSiteContent("en").account} />);
    
    // Trigger second request by changing a dependency primitive
    rerender(<InvitedPeoplePage locale="en" copy={{ ...getSiteContent("en").account, error: "trigger" }} />);
    
    expect(await screen.findByText("Fresh Person")).toBeInTheDocument();

    await act(async () =>
      resolveFirst({
        data: [{ id: "u1", name: "Stale Person", status: "joined", referred_at: "2026-01-01T00:00:00Z" }],
        meta: { page: 1, page_size: 30, total: 31 }
      }),
    );
    expect(screen.queryByText("Stale Person")).not.toBeInTheDocument();
    expect(screen.getByText("Fresh Person")).toBeInTheDocument();
  });

  it("does not show an error when an InvitedPeoplePage request is aborted by unmount", () => {
    vi.mocked(accountApi).mockImplementation(() => new Promise(() => undefined));
    const { unmount } = render(
      <InvitedPeoplePage locale="en" copy={getSiteContent("en").account} />,
    );
    const signal = vi.mocked(accountApi).mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
