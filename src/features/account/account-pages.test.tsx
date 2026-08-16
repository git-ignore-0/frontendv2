import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);

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
  vi.unstubAllGlobals();
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

const summary = {
  referral_code: "NFV1234567",
  referrer: null,
  can_submit_referral_code: true,
  points_balance: 100,
  invited_count: 1,
};
const publicSiteOrigin = "https://www.naturalfarmingvietnam.com";

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
  it("opens the English share dialog and copies the current link and edited message", async () => {
    mockAccount();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <ReferralProgramPage
        locale="en"
        copy={getSiteContent("en").account}
        publicSiteOrigin={publicSiteOrigin}
      />,
    );

    const shareButton = await screen.findByRole("button", { name: "Share" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(shareButton);
    const dialog = screen.getByRole("dialog", {
      name: "Share your referral link",
    });
    const referralUrl =
      "https://www.naturalfarmingvietnam.com/ref/NFV1234567?locale=en";
    expect(screen.getByLabelText("Your referral link")).toHaveValue(
      referralUrl,
    );
    expect(
      (screen.getByLabelText("Message to share") as HTMLTextAreaElement).value,
    ).toContain(`Check them out: ${referralUrl} 🌱`);

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(referralUrl));
    expect(screen.getByText("Referral link copied.")).toBeInTheDocument();

    const editedMessage = `My edited invitation ${referralUrl}`;
    fireEvent.change(screen.getByLabelText("Message to share"), {
      target: { value: editedMessage },
    });
    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(editedMessage));
    expect(screen.getByText("Share message copied.")).toBeInTheDocument();

    fireEvent.mouseDown(dialog);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(shareButton).toHaveFocus();

    fireEvent.click(shareButton);
    expect(screen.getByLabelText("Message to share")).not.toHaveValue(
      editedMessage,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close share dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("falls back when the Clipboard API rejects and reports copy success", async () => {
    mockAccount();
    const writeText = vi.fn().mockRejectedValue(new Error("Not allowed"));
    const execCommand = vi.fn().mockReturnValue(true);
    const originalExecCommand = Object.getOwnPropertyDescriptor(
      document,
      "execCommand",
    );
    Object.assign(navigator, { clipboard: { writeText } });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });

    try {
      render(
        <ReferralProgramPage
          locale="en"
          copy={getSiteContent("en").account}
          publicSiteOrigin={publicSiteOrigin}
        />,
      );
      fireEvent.click(await screen.findByRole("button", { name: "Share" }));
      const copyLinkButton = screen.getByRole("button", { name: "Copy link" });
      copyLinkButton.focus();
      fireEvent.click(copyLinkButton);

      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(execCommand).toHaveBeenCalledWith("copy"));
      expect(screen.getByText("Referral link copied.")).toBeInTheDocument();
      expect(
        screen.queryByText(/could not copy the referral link/i),
      ).not.toBeInTheDocument();
      expect(copyLinkButton).toHaveFocus();
    } finally {
      if (originalExecCommand) {
        Object.defineProperty(document, "execCommand", originalExecCommand);
      } else {
        Reflect.deleteProperty(document, "execCommand");
      }
    }
  });

  it("uses Vietnamese share labels, message, and referral URL", async () => {
    mockAccount();
    render(
      <ReferralProgramPage
        locale="vi"
        copy={getSiteContent("vi").account}
        publicSiteOrigin={publicSiteOrigin}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Chia sẻ" }));
    const referralUrl =
      "https://www.naturalfarmingvietnam.com/ref/NFV1234567?locale=vi";
    expect(
      screen.getByRole("dialog", { name: "Chia sẻ liên kết giới thiệu" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Liên kết giới thiệu của bạn")).toHaveValue(
      referralUrl,
    );
    expect(
      (screen.getByLabelText("Tin nhắn chia sẻ") as HTMLTextAreaElement).value,
    ).toContain(`Xem thêm tại: ${referralUrl} 🌱`);
    expect(
      screen.getByRole("button", { name: "Sao chép liên kết" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sao chép tin nhắn" }),
    ).toBeInTheDocument();
  });

  it("keeps referral details and guidance on one compact detail page", async () => {
    mockAccount();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <ReferralProgramPage
        locale="en"
        copy={getSiteContent("en").account}
        publicSiteOrigin={publicSiteOrigin}
      />,
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
    expect(screen.getByText("100 points")).toBeInTheDocument();
    expect(screen.getByText("+50 points")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "See what you can redeem →" }),
    ).toHaveAttribute("href", "/account/en/rewards");
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
    const codeControl = screen
      .getByText("NFV1234567")
      .closest(".referral-code-control");
    expect(codeControl).not.toBeNull();
    expect(codeControl?.querySelector(":scope > code")).toHaveTextContent(
      "NFV1234567",
    );
    expect(
      codeControl?.querySelector(":scope > .referral-code-actions"),
    ).toBeInTheDocument();
    expect(
      within(codeControl as HTMLElement)
        .getAllByRole("button")
        .map((button) => button.textContent?.trim()),
    ).toEqual(["Copy code", "Share"]);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(navigation.replace).toHaveBeenCalledWith("/en");

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("NFV1234567"));
    expect(
      await screen.findByText("Referral code copied."),
    ).toBeInTheDocument();

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

  it("renders the localized referral earnings card and rewards link", async () => {
    mockAccount();
    render(
      <ReferralProgramPage
        locale="vi"
        copy={getSiteContent("vi").account}
        publicSiteOrigin={publicSiteOrigin}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Bạn nhận được gì" }),
    ).toBeInTheDocument();
    expect(screen.getByText("100 điểm")).toBeInTheDocument();
    expect(screen.getByText("+50 điểm")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Xem các phần thưởng có thể đổi →",
      }),
    ).toHaveAttribute("href", "/account/vi/rewards");
  });

  it("requires confirmation before applying a referral link code", async () => {
    let postCount = 0;
    vi.mocked(accountApi).mockImplementation(async (_path, init) => {
      if (init?.method !== "POST") return { data: summary };
      postCount += 1;
      return {
        data: {
          ...summary,
          referrer: { id: "2", name: "Invitation owner" },
          can_submit_referral_code: false,
        },
      };
    });

    render(
      <ReferralProgramPage
        locale="en"
        copy={getSiteContent("en").account}
        pendingReferralCode="NFV2345678"
        publicSiteOrigin={publicSiteOrigin}
        returnTo="/workshops/en"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Apply referral code?" }),
    ).toBeInTheDocument();
    const invitationCode = screen.getByLabelText(
      "Referral code from invitation",
    );
    expect(invitationCode).toHaveValue("NFV2345678");
    expect(invitationCode).toHaveAttribute("readonly");
    expect(screen.queryByLabelText("Enter a referral code")).toBeNull();
    expect(postCount).toBe(0);

    const apply = screen.getByRole("button", { name: "Apply code" });
    fireEvent.click(apply);
    fireEvent.click(apply);
    expect(postCount).toBe(1);
    expect(
      await screen.findByText("You were referred by Invitation owner."),
    ).toBeInTheDocument();
    expect(accountApi).toHaveBeenCalledWith("submit-code", {
      method: "POST",
      body: JSON.stringify({ code: "NFV2345678" }),
    });
    expect(navigation.replace).toHaveBeenCalledWith(
      "/account/en/referral?returnTo=%2Fworkshops%2Fen",
    );
  });

  it("dismisses referral confirmation without submitting and supports Vietnamese labels", async () => {
    mockAccount();
    render(
      <ReferralProgramPage
        locale="vi"
        copy={getSiteContent("vi").account}
        pendingReferralCode="NFV2345678"
        publicSiteOrigin={publicSiteOrigin}
        returnTo="/vi"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Áp dụng mã giới thiệu?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Áp dụng mã" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Để sau" }));

    expect(screen.getByLabelText("Nhập mã giới thiệu")).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith(
      "/account/vi/referral?returnTo=%2Fvi",
    );
    expect(accountApi).not.toHaveBeenCalledWith(
      "submit-code",
      expect.anything(),
    );
  });

  it("keeps a failed referral confirmation available for retry", async () => {
    vi.mocked(accountApi).mockImplementation(async (_path, init) => {
      if (init?.method !== "POST") return { data: summary };
      throw new AccountApiError("invalid_referral_code", 400);
    });
    render(
      <ReferralProgramPage
        locale="en"
        copy={getSiteContent("en").account}
        pendingReferralCode="NFV2345678"
        publicSiteOrigin={publicSiteOrigin}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Apply code" }));
    expect(
      await screen.findByText("That referral code is not valid."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Referral code from invitation")).toHaveValue(
      "NFV2345678",
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("uses the shared signed-out state when the referral session expires", async () => {
    vi.mocked(accountApi).mockRejectedValueOnce(
      new AccountApiError("session_expired", 401),
    );
    render(
      <ReferralProgramPage
        locale="en"
        copy={getSiteContent("en").account}
        publicSiteOrigin={publicSiteOrigin}
      />,
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
      <ReferralProgramPage
        locale="en"
        copy={getSiteContent("en").account}
        publicSiteOrigin={publicSiteOrigin}
      />,
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
    expect(
      screen.queryByLabelText("Enter a referral code"),
    ).not.toBeInTheDocument();

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
      <ReferralProgramPage
        locale="en"
        copy={getSiteContent("en").account}
        publicSiteOrigin={publicSiteOrigin}
      />,
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
    expect(
      await screen.findByText(getSiteContent("en").account.error),
    ).toBeInTheDocument();

    // Nút submit không bị kẹt disabled sau lỗi đầu
    expect(submitBtn).not.toBeDisabled();

    // Submit again
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Assert second submit succeeds
    expect(
      await screen.findByText("You were referred by Referrer."),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Enter a referral code"),
    ).not.toBeInTheDocument();
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
      expect(accountApi).toHaveBeenCalledWith(
        "points?page=2",
        expect.anything(),
      ),
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
      expect(accountApi).toHaveBeenCalledWith(
        "invited-users?page=2",
        expect.anything(),
      ),
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
      if (callCount === 1)
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      return Promise.resolve({
        data: [
          {
            id: "p2",
            direction: "debit",
            amount: 5,
            message: "Fresh Item",
            created_at: "2026-01-02T00:00:00Z",
          },
        ],
        meta: { page: 1, page_size: 30, total: 31, balance: 5 },
      });
    });

    const { rerender } = render(
      <PointHistoryPage locale="en" copy={getSiteContent("en").account} />,
    );

    // Trigger second request by changing a dependency primitive
    rerender(
      <PointHistoryPage
        locale="en"
        copy={{ ...getSiteContent("en").account, error: "trigger" }}
      />,
    );

    expect(await screen.findByText("Fresh Item")).toBeInTheDocument();

    // Resolve the first (stale) request
    await act(async () =>
      resolveFirst({
        data: [
          {
            id: "p1",
            direction: "credit",
            amount: 10,
            message: "Stale Item",
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
        meta: { page: 1, page_size: 30, total: 31, balance: 10 },
      }),
    );
    expect(screen.queryByText("Stale Item")).not.toBeInTheDocument();
    expect(screen.getByText("Fresh Item")).toBeInTheDocument();
  });

  it("does not show an error when a PointHistoryPage request is aborted by unmount", () => {
    vi.mocked(accountApi).mockImplementation(
      () => new Promise(() => undefined),
    );
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
      if (callCount === 1)
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      return Promise.resolve({
        data: [
          {
            id: "u2",
            name: "Fresh Person",
            status: "joined",
            referred_at: "2026-01-02T00:00:00Z",
          },
        ],
        meta: { page: 1, page_size: 30, total: 31 },
      });
    });

    const { rerender } = render(
      <InvitedPeoplePage locale="en" copy={getSiteContent("en").account} />,
    );

    // Trigger second request by changing a dependency primitive
    rerender(
      <InvitedPeoplePage
        locale="en"
        copy={{ ...getSiteContent("en").account, error: "trigger" }}
      />,
    );

    expect(await screen.findByText("Fresh Person")).toBeInTheDocument();

    await act(async () =>
      resolveFirst({
        data: [
          {
            id: "u1",
            name: "Stale Person",
            status: "joined",
            referred_at: "2026-01-01T00:00:00Z",
          },
        ],
        meta: { page: 1, page_size: 30, total: 31 },
      }),
    );
    expect(screen.queryByText("Stale Person")).not.toBeInTheDocument();
    expect(screen.getByText("Fresh Person")).toBeInTheDocument();
  });

  it("does not show an error when an InvitedPeoplePage request is aborted by unmount", () => {
    vi.mocked(accountApi).mockImplementation(
      () => new Promise(() => undefined),
    );
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
