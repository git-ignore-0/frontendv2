import {
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
import { AccountPage, SignedOutAccount } from "@/features/account/account-page";
import { accountApi } from "@/features/account/api";

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

describe("public account", () => {
  it("renders a concise summary without duplicate navigation or logout", async () => {
    mockAccount();
    render(<AccountPage locale="en" copy={getSiteContent("en").account} />);
    expect(await screen.findByText("NFV1234567")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Edit information" }),
    ).toHaveAttribute("href", expect.stringContaining("/api/auth/account"));
    expect(
      screen.getByRole("link", { name: "View point history" }),
    ).toHaveAttribute("href", "/account/en/points");
    expect(
      screen.getByRole("link", { name: "View invited people" }),
    ).toHaveAttribute("href", "/account/en/invited");
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
    expect(accountApi).toHaveBeenCalledTimes(1);
  });

  it("copies the code and replaces delayed code entry after success", async () => {
    mockAccount();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<AccountPage locale="en" copy={getSiteContent("en").account} />);
    await screen.findByText("NFV1234567");
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("NFV1234567"));
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
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

  it("explains how to recover when copying the code is unavailable", async () => {
    mockAccount();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<AccountPage locale="en" copy={getSiteContent("en").account} />);
    await screen.findByText("NFV1234567");

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    expect(
      await screen.findByText(
        "We could not copy the referral code. Please copy it manually.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a clear unauthenticated state with login continuation", () => {
    render(
      <SignedOutAccount locale="vi" copy={getSiteContent("vi").account} />,
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
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to account" }),
    ).toHaveAttribute("href", "/account/en");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(accountApi).toHaveBeenCalledWith("points?page=2"),
    );
  });

  it("keeps invited people private on a separate paginated page", async () => {
    mockAccount();
    render(
      <InvitedPeoplePage locale="en" copy={getSiteContent("en").account} />,
    );

    expect(await screen.findByText("Safe Name")).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(accountApi).toHaveBeenCalledWith("invited-users?page=2"),
    );
  });
});
