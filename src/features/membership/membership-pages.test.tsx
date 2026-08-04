import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/content/site-content";
import { AccountApiError, accountApi } from "@/features/account/api";
import type {
  CurrentMembership,
  MembershipPackage,
  MembershipQuota,
  MembershipRequest,
  MembershipUsage,
} from "@/features/account/types";
import { CsaPage } from "@/features/membership/csa-page";
import {
  AccountMembershipPage,
  MembershipUsagePage,
} from "@/features/membership/account-membership-pages";

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

const packageItem: MembershipPackage = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Six month CSA",
  description: "Seasonal vegetables",
  upfront_price: "6000000",
  duration_months: 6,
  quota_policy: "expire",
  items: [
    {
      product_id: "22222222-2222-4222-8222-222222222222",
      product_name: "Vegetable basket",
      short_description: "Fresh vegetables",
      unit_size: "0.500",
      unit_label_vi: "kg",
      unit_label_en: "kg",
      quota_units: 2,
    },
  ],
};

const instruction = {
  bank_bin: "970436",
  bank_name: "Joint Stock Commercial Bank for Foreign Trade of Vietnam",
  bank_code: "",
  account_number: "0123456789",
  account_name: "NATURAL FARMING VIETNAM",
  amount: "6000000",
  phone_snapshot: "0918765432",
  transfer_content: "0918765432-CSA8CODE",
  issued_at: "2026-07-20T02:00:00Z",
};

function membershipRequest(
  status: MembershipRequest["status"],
): MembershipRequest {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    short_code: "CSA8CODE",
    status,
    package: packageItem,
    payment_instruction:
      status === "payment_pending" || status === "payment_submitted"
        ? instruction
        : null,
    return_reason: "",
    rejection_reason: "",
    created_at: "2026-07-20T02:00:00Z",
    updated_at: "2026-07-20T02:00:00Z",
  };
}

const currentMembership: CurrentMembership = {
  id: "44444444-4444-4444-8444-444444444444",
  user_id: "55555555-5555-4555-8555-555555555555",
  request_id: "33333333-3333-4333-8333-333333333333",
  package_id: packageItem.id,
  status: "active",
  package_name: "Six month CSA",
  package_description: "Seasonal vegetables",
  upfront_price: "6000000",
  duration_months: 6,
  quota_policy: "expire",
  start_date: "2026-08-15",
  end_date: "2027-02-15",
  activated_at: "2026-08-15T00:00:00Z",
};

const quota: MembershipQuota = {
  membership_id: currentMembership.id,
  products: [
    {
      product_id: packageItem.items[0].product_id,
      product_name: "Vegetable basket",
      unit_size: "0.500",
      unit_label_vi: "kg",
      unit_label_en: "kg",
      quota_units_per_cycle: 2,
      remaining_units: 2,
    },
  ],
};

const requestStatusByFlow = {
  consultation: "consultation_requested",
  direct_transfer: "payment_pending",
} as const;

function publicLoad(path: string) {
  if (path.startsWith("membership-packages?page=1")) {
    return { data: [packageItem], meta: { page: 1, page_size: 30, total: 1 } };
  }
  if (path === "membership-payment-availability") {
    return { data: { direct_transfer_enabled: true } };
  }
  if (path.startsWith("memberships/requests?locale=")) return { data: null };
  if (path.startsWith("memberships/current?locale=")) return { data: null };
  throw new Error(`Unexpected request: ${path}`);
}

describe("public CSA Membership", () => {
  it("presents the CSA story and API package as a two-part ledger", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => publicLoad(path));
    render(<CsaPage copy={getSiteContent("vi").csa} locale="vi" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Gói thành viên CSA" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "CSA vận hành như thế nào?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Chọn sản phẩm tại cửa hàng",
      }),
    ).toBeInTheDocument();

    const packageHeading = await screen.findByRole("heading", {
      level: 3,
      name: "Six month CSA",
    });
    expect(accountApi).toHaveBeenCalledWith(
      "membership-packages?page=1&locale=vi",
      { signal: expect.any(AbortSignal) },
    );
    const packageLedger = packageHeading.closest("article");
    expect(packageLedger).not.toBeNull();
    expect(
      within(packageLedger as HTMLElement).getByText("6.000.000 ₫"),
    ).toBeVisible();
    expect(
      within(packageLedger as HTMLElement).getByRole("heading", {
        level: 4,
        name: "Số lượng bạn có thể dùng mỗi tháng",
      }),
    ).toBeInTheDocument();
    expect(
      within(packageLedger as HTMLElement).getByText("1 kg / tháng"),
    ).toBeVisible();
    expect(
      within(packageLedger as HTMLElement).getByText(
        "Số lượng chưa dùng không cộng sang tháng sau",
      ),
    ).toBeVisible();
  });

  it("keeps the English catalog when a stale Vietnamese response finishes later", async () => {
    let resolveVietnamese!: (value: {
      data: MembershipPackage[];
      meta: { page: number; page_size: number; total: number };
    }) => void;
    let resolveEnglish!: typeof resolveVietnamese;
    const vietnamesePackage = { ...packageItem, name: "Gói tiếng Việt cũ" };
    const englishPackage = { ...packageItem, name: "Current English package" };
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "membership-packages?page=1&locale=vi") {
        return await new Promise((resolve) => {
          resolveVietnamese = resolve;
        });
      }
      if (path === "membership-packages?page=1&locale=en") {
        return await new Promise((resolve) => {
          resolveEnglish = resolve;
        });
      }
      if (path === "membership-payment-availability") {
        return { data: { direct_transfer_enabled: true } };
      }
      if (path.startsWith("memberships/requests")) return { data: null };
      if (path.startsWith("memberships/current")) return { data: null };
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = render(
      <CsaPage copy={getSiteContent("vi").csa} locale="vi" />,
    );
    await waitFor(() => expect(resolveVietnamese).toBeTypeOf("function"));

    view.rerender(<CsaPage copy={getSiteContent("en").csa} locale="en" />);
    await waitFor(() => expect(resolveEnglish).toBeTypeOf("function"));
    await act(async () => {
      resolveEnglish({
        data: [englishPackage],
        meta: { page: 1, page_size: 30, total: 1 },
      });
    });
    expect(
      await screen.findByText("Current English package"),
    ).toBeInTheDocument();

    await act(async () => {
      resolveVietnamese({
        data: [vietnamesePackage],
        meta: { page: 1, page_size: 30, total: 1 },
      });
    });
    expect(screen.getByText("Current English package")).toBeInTheDocument();
    expect(screen.queryByText("Gói tiếng Việt cũ")).not.toBeInTheDocument();
  });

  it("aborts the pending catalog request on unmount", async () => {
    let packageSignal: AbortSignal | null | undefined;
    vi.mocked(accountApi).mockImplementation(async (path, init) => {
      if (path.startsWith("membership-packages")) {
        packageSignal = init?.signal;
        return await new Promise(() => undefined);
      }
      if (path === "membership-payment-availability") {
        return { data: { direct_transfer_enabled: true } };
      }
      if (path.startsWith("memberships/requests")) return { data: null };
      if (path.startsWith("memberships/current")) return { data: null };
      throw new Error(`Unexpected request: ${path}`);
    });
    const { unmount } = render(
      <CsaPage copy={getSiteContent("en").csa} locale="en" />,
    );
    await waitFor(() => expect(packageSignal).toBeInstanceOf(AbortSignal));
    unmount();
    expect(packageSignal?.aborted).toBe(true);
  });

  it("keeps package discovery public and sends signed-out visitors to login", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path.startsWith("memberships/")) {
        throw new AccountApiError("unauthorized", 401);
      }
      return publicLoad(path);
    });
    render(<CsaPage copy={getSiteContent("vi").csa} locale="vi" />);

    const signIn = await screen.findByRole("link", {
      name: "Đăng nhập để tham gia",
    });
    expect(screen.getByText("Six month CSA")).toBeVisible();
    expect(signIn).toHaveAttribute(
      "href",
      "/api/auth/login?locale=vi&returnTo=%2Fvi%2Fcsa",
    );
    expect(screen.queryByRole("button", { name: "Chọn gói này" })).toBeNull();
  });

  it("explains how to reuse a returned transfer request", async () => {
    const returnedRequest = membershipRequest("payment_pending");
    returnedRequest.return_reason =
      "Không tìm thấy đúng nội dung chuyển khoản.";
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path.startsWith("membership-packages?page=1"))
        return publicLoad(path);
      if (path === "membership-payment-availability") {
        return { data: { direct_transfer_enabled: true } };
      }
      if (path === "memberships/requests?locale=vi")
        return { data: returnedRequest };
      if (path === "memberships/current?locale=vi") return { data: null };
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CsaPage copy={getSiteContent("vi").csa} locale="vi" />);

    expect(
      await screen.findByText("Cần kiểm tra lại thông tin chuyển khoản"),
    ).toBeVisible();
    expect(screen.getByText(/tiếp tục dùng yêu cầu hiện tại/i)).toBeVisible();
    expect(
      screen.getByText("Không tìm thấy đúng nội dung chuyển khoản."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Đang có yêu cầu" }),
    ).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Xem gói của bạn" })).toBeNull();
  });

  it("shows consultation only when direct transfer is off", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "membership-payment-availability") {
        return { data: { direct_transfer_enabled: false } };
      }
      return publicLoad(path);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Choose this package" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: /Request a consultation/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /Transfer now/ }),
    ).toBeNull();
  });

  it("fails closed to consultation when payment availability cannot load", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "membership-payment-availability") {
        throw new AccountApiError("upstream_unavailable", 502);
      }
      return publicLoad(path);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Choose this package" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: /Request a consultation/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /Transfer now/ }),
    ).toBeNull();
  });

  it.each([
    ["Request a consultation", "consultation"],
    ["Transfer now", "direct_transfer"],
  ] as const)("sends the exact %s request payload", async (action, flow) => {
    vi.mocked(accountApi).mockImplementation(async (path, init) => {
      if (init?.method !== "POST") return publicLoad(path);
      if (path === "memberships/requests?locale=en") {
        return {
          data: membershipRequest(requestStatusByFlow[flow]),
        };
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Choose this package" }),
    );
    fireEvent.change(screen.getByLabelText("Contact phone number"), {
      target: { value: "+84 912 345 678" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: new RegExp(action),
      }),
    );

    await waitFor(() =>
      expect(accountApi).toHaveBeenCalledWith(
        "memberships/requests?locale=en",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const call = vi
      .mocked(accountApi)
      .mock.calls.find(
        ([path, init]) =>
          path === "memberships/requests?locale=en" && init?.method === "POST",
      );
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      package_id: packageItem.id,
      flow,
      phone: "+84 912 345 678",
    });
  });

  it("validates the contact phone before creating either request flow", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => publicLoad(path));
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Choose this package" }),
    );
    fireEvent.change(screen.getByLabelText("Contact phone number"), {
      target: { value: "abc123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Request a consultation/ }),
    );
    expect(
      await screen.findByText(
        "Enter a valid phone number with 8 to 15 digits.",
      ),
    ).toBeVisible();
    expect(
      vi
        .mocked(accountApi)
        .mock.calls.filter(
          ([path, init]) =>
            path === "memberships/requests?locale=en" &&
            init?.method === "POST",
        ),
    ).toHaveLength(0);
  });

  it("paginates beyond the first 30 active CSA packages without loading every page", async () => {
    const pageOne = Array.from({ length: 30 }, (_, index) => ({
      ...packageItem,
      id: `${String(index + 1).padStart(8, "0")}-1111-4111-8111-111111111111`,
      name: `CSA package ${index + 1}`,
    }));
    const pageTwo = [{ ...packageItem, name: "CSA package 31" }];
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path.startsWith("membership-packages?page=1")) {
        return { data: pageOne, meta: { page: 1, page_size: 30, total: 31 } };
      }
      if (path.startsWith("membership-packages?page=2")) {
        return { data: pageTwo, meta: { page: 2, page_size: 30, total: 31 } };
      }
      return publicLoad(path);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    expect(await screen.findByText("CSA package 30")).toBeInTheDocument();
    expect(screen.queryByText("CSA package 31")).toBeNull();
    expect(screen.getByText("Page 1/2")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("CSA package 31")).toBeInTheDocument();
    expect(
      vi
        .mocked(accountApi)
        .mock.calls.filter(([path]) => path.startsWith("membership-packages")),
    ).toHaveLength(2);
  });

  it("waits for payment confirmation, blocks double click, and keeps failures retryable", async () => {
    let rejectFirst!: (reason: unknown) => void;
    const firstAttempt = new Promise((_, reject) => {
      rejectFirst = reject;
    });
    let attempts = 0;
    vi.mocked(accountApi).mockImplementation(async (path, init) => {
      if (path.startsWith("membership-packages?page=1"))
        return publicLoad(path);
      if (path === "membership-payment-availability") {
        return { data: { direct_transfer_enabled: false } };
      }
      if (
        path === "memberships/requests?locale=en" &&
        init?.method !== "POST"
      ) {
        return { data: membershipRequest("payment_pending") };
      }
      if (path === "memberships/current?locale=en") return { data: null };
      if (
        path.endsWith("/payment-submitted?locale=en") &&
        init?.method === "POST"
      ) {
        attempts += 1;
        if (attempts === 1) return firstAttempt as never;
        return { data: membershipRequest("payment_submitted") };
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    expect(
      await screen.findByRole("img", {
        name: "QR code for this bank transfer instruction",
      }),
    ).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(
      screen.getByRole("img", {
        name: "QR code for this bank transfer instruction",
      }),
    ).toHaveAttribute("src", expect.stringContaining("/970436-0123456789-"));

    fireEvent.click(
      await screen.findByRole("button", { name: "I have transferred" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Confirm your bank transfer",
    });
    expect(
      vi
        .mocked(accountApi)
        .mock.calls.filter(([path]) =>
          path.endsWith("/payment-submitted?locale=en"),
        ),
    ).toHaveLength(0);

    const confirm = within(dialog).getByRole("button", {
      name: "Confirm transfer",
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(
      vi
        .mocked(accountApi)
        .mock.calls.filter(([path]) =>
          path.endsWith("/payment-submitted?locale=en"),
        ),
    ).toHaveLength(1);
    expect(
      within(dialog).getByRole("button", { name: "Confirming…" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toBeDisabled();

    await act(async () => rejectFirst(new Error("network_error")));
    expect(
      await within(dialog).findByText(/retry this same action/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Confirm your bank transfer" }),
    ).toBeVisible();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm transfer" }),
    );
    expect(await screen.findByText("Transfer reported")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Our team will verify the transaction. Once confirmed, your request status will be updated on the website.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      vi
        .mocked(accountApi)
        .mock.calls.filter(([path]) =>
          path.endsWith("/payment-submitted?locale=en"),
        ),
    ).toHaveLength(2);
  });

  it("renders a legacy payment snapshot and keeps its old bank code in the QR", async () => {
    const legacyRequest = membershipRequest("payment_pending");
    legacyRequest.payment_instruction = {
      ...instruction,
      bank_bin: undefined,
      bank_name: undefined,
      bank_code: "VCB",
    };
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path.startsWith("membership-packages?page=1"))
        return publicLoad(path);
      if (path === "membership-payment-availability") {
        return { data: { direct_transfer_enabled: false } };
      }
      if (path === "memberships/requests?locale=en")
        return { data: legacyRequest };
      if (path === "memberships/current?locale=en") return { data: null };
      throw new Error(`Unexpected request: ${path}`);
    });

    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    expect(await screen.findByText("VCB")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "QR code for this bank transfer instruction",
      }),
    ).toHaveAttribute("src", expect.stringContaining("/VCB-0123456789-"));
  });

  it("handles a backend direct-transfer disable race without getting stuck", async () => {
    vi.mocked(accountApi).mockImplementation(async (path, init) => {
      if (init?.method !== "POST") return publicLoad(path);
      if (path === "memberships/requests?locale=en") {
        throw new AccountApiError("direct_transfer_disabled", 409);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Choose this package" }),
    );
    fireEvent.change(screen.getByLabelText("Contact phone number"), {
      target: { value: "0912345678" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /Transfer now/,
      }),
    );

    expect(
      await screen.findByText(/Direct transfer is currently unavailable/),
    ).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: /Request a consultation/ }),
    ).toBeEnabled();
    expect(
      within(dialog).queryByRole("button", { name: /Transfer now/ }),
    ).toBeNull();
  });

  it.each(["scheduled", "active"] as const)(
    "links the matching %s Membership package and locks the other packages",
    async (status) => {
      const otherPackage = {
        ...packageItem,
        id: "66666666-6666-4666-8666-666666666666",
        name: currentMembership.package_name,
      };
      vi.mocked(accountApi).mockImplementation(async (path) => {
        if (path.startsWith("membership-packages?page=1")) {
          return {
            data: [packageItem, otherPackage],
            meta: { page: 1, page_size: 30, total: 2 },
          };
        }
        if (path === "memberships/requests?locale=en") return { data: null };
        if (path === "memberships/current?locale=en") {
          return { data: { ...currentMembership, status } };
        }
        throw new Error(`Unexpected request: ${path}`);
      });
      render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

      expect(screen.queryByText("Your current Membership")).toBeNull();
      expect(
        await screen.findByRole("link", { name: "View your membership" }),
      ).toHaveAttribute("href", "/account/en/membership?returnTo=%2Fen%2Fcsa");
      expect(
        screen.queryByRole("button", { name: "Choose this package" }),
      ).toBeNull();
      expect(
        screen.getByText("You already have a CSA membership"),
      ).toBeInTheDocument();
    },
  );

  it("does not guess a current package match from its name", async () => {
    const unmatchedPackage = {
      ...packageItem,
      id: "66666666-6666-4666-8666-666666666666",
      name: currentMembership.package_name,
    };
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path.startsWith("membership-packages?page=1")) {
        return {
          data: [unmatchedPackage],
          meta: { page: 1, page_size: 30, total: 1 },
        };
      }
      if (path === "memberships/requests?locale=en") return { data: null };
      if (path === "memberships/current?locale=en")
        return { data: currentMembership };
      return publicLoad(path);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    expect(
      await screen.findByText("You already have a CSA membership"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View your membership" }),
    ).toBeNull();
  });

  it("allows a new package request when a legacy ended Membership is returned", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en") {
        return { data: { ...currentMembership, status: "ended" } };
      }
      return publicLoad(path);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    expect(
      await screen.findByRole("button", { name: "Choose this package" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("link", { name: "View your membership" }),
    ).toBeNull();
  });

  it("blocks registration when Membership context fails and enables it after retry", async () => {
    let requestAttempts = 0;
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path.startsWith("membership-packages?page=1"))
        return publicLoad(path);
      if (path === "memberships/current?locale=en") return { data: null };
      if (path === "memberships/requests?locale=en") {
        requestAttempts += 1;
        if (requestAttempts === 1) throw new Error("upstream_unavailable");
        return { data: null };
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    expect(
      await screen.findByText(
        /could not verify your current Membership or request/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Choose this package" }),
    ).toBeNull();
    expect(
      screen.getByText("Registration is temporarily unavailable"),
    ).toBeInTheDocument();
    const initialSignal = vi
      .mocked(accountApi)
      .mock.calls.find(
        ([path]) => path === "memberships/requests?locale=en",
      )?.[1]?.signal;

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(initialSignal?.aborted).toBe(false);
    expect(
      await screen.findByRole("button", { name: "Choose this package" }),
    ).toBeEnabled();
    expect(requestAttempts).toBe(2);
  });

  it("ignores a late rejected context request after a retry succeeds", async () => {
    let rejectOlderCurrent!: (reason: unknown) => void;
    let requestAttempts = 0;
    vi.mocked(accountApi).mockImplementation((path) => {
      if (path.startsWith("membership-packages?page=1")) {
        return Promise.resolve(publicLoad(path));
      }
      if (path === "membership-payment-availability") {
        return Promise.resolve(publicLoad(path));
      }
      if (path === "memberships/requests?locale=en") {
        requestAttempts += 1;
        return requestAttempts === 1
          ? Promise.reject(new Error("initial failure"))
          : Promise.resolve({ data: null });
      }
      if (path === "memberships/current?locale=en") {
        return requestAttempts === 1
          ? new Promise((_, reject) => {
              rejectOlderCurrent = reject;
            })
          : Promise.resolve({ data: null });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    const olderSignal = vi.mocked(accountApi).mock.calls[1][1]?.signal;
    expect(olderSignal?.aborted).toBe(false);
    expect(
      await screen.findByRole("button", { name: "Choose this package" }),
    ).toBeEnabled();

    await act(async () => rejectOlderCurrent(new Error("late failure")));
    expect(
      screen.queryByText(
        /could not verify your current Membership or request/i,
      ),
    ).not.toBeInTheDocument();
  });

  it("does not clear a newer context request when an older request finishes", async () => {
    let resolveOlderRequest!: (value: { data: null }) => void;
    let resolveOlderCurrent!: (value: { data: null }) => void;
    let requestCalls = 0;
    let currentCalls = 0;
    vi.mocked(accountApi).mockImplementation((path) => {
      if (path.startsWith("membership-packages?page=1")) {
        return Promise.resolve(publicLoad(path));
      }
      if (path === "membership-payment-availability") {
        return Promise.resolve(publicLoad(path));
      }
      if (path === "memberships/requests?locale=en") {
        requestCalls += 1;
        return requestCalls === 1
          ? new Promise<{ data: null }>((resolve) => {
              resolveOlderRequest = resolve;
            })
          : new Promise(() => undefined);
      }
      if (path === "memberships/current?locale=en") {
        currentCalls += 1;
        return currentCalls === 1
          ? new Promise<{ data: null }>((resolve) => {
              resolveOlderCurrent = resolve;
            })
          : new Promise(() => undefined);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const { unmount } = render(
      <StrictMode>
        <CsaPage copy={getSiteContent("en").csa} locale="en" />
      </StrictMode>,
    );
    const contextCalls = vi
      .mocked(accountApi)
      .mock.calls.filter(([path]) => path.startsWith("memberships/"));
    const newerSignal = contextCalls[2]?.[1]?.signal;

    await act(async () => {
      resolveOlderRequest({ data: null });
      resolveOlderCurrent({ data: null });
    });
    unmount();

    expect(newerSignal?.aborted).toBe(true);
  });

  it("passes one abort signal to both context requests and aborts it on unmount", () => {
    vi.mocked(accountApi).mockImplementation((path) => {
      if (path.startsWith("membership-packages?page=1")) {
        return Promise.resolve(publicLoad(path));
      }
      if (path === "membership-payment-availability") {
        return Promise.resolve(publicLoad(path));
      }
      if (
        path === "memberships/requests?locale=en" ||
        path === "memberships/current?locale=en"
      ) {
        return new Promise(() => undefined);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const { unmount } = render(
      <CsaPage copy={getSiteContent("en").csa} locale="en" />,
    );
    const contextCalls = vi
      .mocked(accountApi)
      .mock.calls.filter(([path]) => path.startsWith("memberships/"));
    const requestSignal = contextCalls[0]?.[1]?.signal;
    const currentSignal = contextCalls[1]?.[1]?.signal;

    expect(requestSignal).toBeInstanceOf(AbortSignal);
    expect(currentSignal).toBe(requestSignal);
    unmount();
    expect(requestSignal?.aborted).toBe(true);
  });
});

describe("Account Membership", () => {
  it("shows scheduled dates without requesting quota", async () => {
    vi.mocked(accountApi).mockResolvedValue({
      data: { ...currentMembership, status: "scheduled" },
    });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(await screen.findByText("Scheduled")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your CSA membership" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Track your active membership and what remains in this cycle.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("August 15, 2026")).toBeInTheDocument();
    expect(screen.getByText("February 15, 2027")).toBeInTheDocument();
    expect(vi.mocked(accountApi).mock.calls.map(([path]) => path)).toEqual([
      "memberships/current?locale=en",
    ]);
    expect(
      screen.getByText(
        "This membership will begin on August 15, 2026. Product quantities are not available yet.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Product collection history" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Products in your membership"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(navigation.replace).toHaveBeenCalledWith("/en");
  });

  it("loads active quota and multiplies integer units by decimal unit size exactly", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: currentMembership };
      if (path === "memberships/quota?locale=en") return { data: quota };
      throw new Error(`Unexpected request: ${path}`);
    });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(await screen.findByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Products in your membership" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Remaining")).toBeInTheDocument();
    expect(screen.getByText("This cycle: 1 kg")).toBeInTheDocument();
    expect(screen.getAllByText("1 kg")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Product collection history" }),
    ).toHaveAttribute("href", "/account/en/membership/usage");
    expect(accountApi).toHaveBeenCalledWith(
      "memberships/quota?locale=en",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("ignores an older request that fails after a newer request succeeds", async () => {
    let rejectOlder!: (reason: unknown) => void;
    const older = new Promise<never>((_resolve, reject) => {
      rejectOlder = reject;
    });
    vi.mocked(accountApi)
      .mockReturnValueOnce(older)
      .mockResolvedValueOnce({
        data: { ...currentMembership, status: "scheduled" },
      });
    const originalCopy = getSiteContent("en").account;
    const { rerender } = render(
      <AccountMembershipPage copy={originalCopy} locale="en" />,
    );
    const olderSignal = vi.mocked(accountApi).mock.calls[0][1]?.signal;

    rerender(
      <AccountMembershipPage
        copy={{ ...originalCopy, membershipError: "A newer error copy" }}
        locale="en"
      />,
    );

    expect(await screen.findByText("Scheduled")).toBeInTheDocument();
    expect(olderSignal?.aborted).toBe(true);
    await act(async () => rejectOlder(new Error("late upstream failure")));
    expect(screen.queryByText("A newer error copy")).toBeNull();
    expect(screen.getByText("Six month CSA")).toBeInTheDocument();
  });

  it("aborts a pending request on unmount without starting quota or rendering an error", async () => {
    let rejectPending!: (reason: unknown) => void;
    vi.mocked(accountApi).mockReturnValueOnce(
      new Promise<never>((_resolve, reject) => {
        rejectPending = reject;
      }),
    );
    const { unmount } = render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    const signal = vi.mocked(accountApi).mock.calls[0][1]?.signal;

    unmount();

    expect(signal?.aborted).toBe(true);
    await act(async () =>
      rejectPending(new Error("late failure after unmount")),
    );
    expect(accountApi).toHaveBeenCalledTimes(1);
  });

  it("aborts a pending retry before a replacement request starts", async () => {
    let rejectRetry!: (reason: unknown) => void;
    vi.mocked(accountApi)
      .mockRejectedValueOnce(new Error("initial failure"))
      .mockReturnValueOnce(
        new Promise<never>((_resolve, reject) => {
          rejectRetry = reject;
        }),
      )
      .mockResolvedValueOnce({
        data: { ...currentMembership, status: "scheduled" },
      });
    const originalCopy = getSiteContent("en").account;
    const { rerender } = render(
      <AccountMembershipPage copy={originalCopy} locale="en" />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    const retrySignal = vi.mocked(accountApi).mock.calls[1][1]?.signal;

    rerender(
      <AccountMembershipPage
        copy={{ ...originalCopy, membershipError: "Replacement error" }}
        locale="en"
      />,
    );

    expect(await screen.findByText("Scheduled")).toBeInTheDocument();
    expect(retrySignal?.aborted).toBe(true);
    await act(async () => rejectRetry(new Error("stale retry failure")));
    expect(screen.queryByText("Replacement error")).toBeNull();
  });

  it("does not load quota when a stale current request later resolves active", async () => {
    let resolveOlder!: (value: { data: CurrentMembership }) => void;
    vi.mocked(accountApi)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOlder = resolve;
        }),
      )
      .mockResolvedValueOnce({
        data: { ...currentMembership, status: "scheduled" },
      });
    const originalCopy = getSiteContent("en").account;
    const { rerender } = render(
      <AccountMembershipPage copy={originalCopy} locale="en" />,
    );

    rerender(
      <AccountMembershipPage
        copy={{ ...originalCopy, membershipError: "Replacement error" }}
        locale="en"
      />,
    );
    expect(await screen.findByText("Scheduled")).toBeInTheDocument();

    await act(async () => resolveOlder({ data: currentMembership }));

    expect(vi.mocked(accountApi).mock.calls.map(([path]) => path)).toEqual([
      "memberships/current?locale=en",
      "memberships/current?locale=en",
    ]);
  });

  it("labels an ended membership without requesting remaining products", async () => {
    vi.mocked(accountApi).mockResolvedValue({
      data: { ...currentMembership, status: "ended" },
    });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(await screen.findByText("Ended")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(vi.mocked(accountApi).mock.calls.map(([path]) => path)).toEqual([
      "memberships/current?locale=en",
    ]);
    expect(
      screen.queryByRole("link", { name: "Product collection history" }),
    ).not.toBeInTheDocument();
  });

  it("uses the shared empty state and keeps the public CSA link", async () => {
    vi.mocked(accountApi).mockResolvedValue({ data: null });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(
      await screen.findByText(
        "You do not have an active CSA membership. Explore the packages currently available from the farm.",
      ),
    ).toHaveClass("account-request-state");
    expect(
      screen.getByRole("link", { name: "View CSA packages" }),
    ).toHaveAttribute("href", "/en/csa");
  });

  it("renders an applied record with multiple products and long content", async () => {
    const longProductName =
      "An exceptionally long seasonal vegetable assortment name that remains readable on narrow screens";
    const longNote =
      "Collected during the weekly farm visit with an extended note that should wrap naturally without hiding any information.";
    const usage: MembershipUsage = {
      id: "66666666-6666-4666-8666-666666666666",
      membership_id: currentMembership.id,
      status: "applied",
      note: longNote,
      created_at: "2026-08-20T02:00:00Z",
      reversed_at: null,
      lines: [
        {
          product_id: packageItem.items[0].product_id,
          product_name: longProductName,
          unit_size: "0.500",
          unit_label_vi: "kg",
          unit_label_en: "kg",
          units: 2,
        },
        {
          product_id: "77777777-7777-4777-8777-777777777777",
          product_name: "Seasonal fruit selection",
          unit_size: "1.000",
          unit_label_vi: "phần",
          unit_label_en: "portion",
          units: 1,
        },
      ],
    };
    vi.mocked(accountApi).mockResolvedValue({
      data: [usage],
      meta: { page: 1, page_size: 30, total: 1 },
    });

    render(
      <MembershipUsagePage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(
      await screen.findByText(
        getSiteContent("en").account.membershipUsageApplied,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(longProductName)).toBeInTheDocument();
    expect(screen.getByText("1 kg")).toBeInTheDocument();
    expect(screen.getByText("1 portion")).toBeInTheDocument();
    expect(screen.getByText(longNote)).toBeInTheDocument();
    expect(screen.queryByText("Reversal reason")).not.toBeInTheDocument();
  });

  it("keeps English usage when a stale Vietnamese response resolves later", async () => {
    let resolveVietnamese!: (value: {
      data: MembershipUsage[];
      meta: { page: number; page_size: number; total: number };
    }) => void;
    let resolveEnglish!: typeof resolveVietnamese;
    let vietnameseSignal: AbortSignal | null | undefined;
    const vietnameseUsage = {
      id: "usage-vi",
      membership_id: currentMembership.id,
      status: "applied" as const,
      note: "",
      created_at: "2026-08-20T02:00:00Z",
      reversed_at: null,
      lines: [
        {
          product_id: packageItem.items[0].product_id,
          product_name: "Sản phẩm tiếng Việt cũ",
          unit_size: "1.000",
          unit_label_vi: "phần",
          unit_label_en: "portion",
          units: 1,
        },
      ],
    };
    const englishUsage = {
      ...vietnameseUsage,
      id: "usage-en",
      lines: [{ ...vietnameseUsage.lines[0], product_name: "Current English product" }],
    };
    vi.mocked(accountApi).mockImplementation((path, init) => {
      if (path === "memberships/usage?page=1&locale=vi") {
        vietnameseSignal = init?.signal;
        return new Promise((resolve) => {
          resolveVietnamese = resolve;
        });
      }
      if (path === "memberships/usage?page=1&locale=en") {
        return new Promise((resolve) => {
          resolveEnglish = resolve;
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const { rerender } = render(
      <MembershipUsagePage copy={getSiteContent("vi").account} locale="vi" />,
    );
    await waitFor(() => expect(resolveVietnamese).toBeTypeOf("function"));

    rerender(
      <MembershipUsagePage copy={getSiteContent("en").account} locale="en" />,
    );
    await waitFor(() => expect(resolveEnglish).toBeTypeOf("function"));
    expect(vietnameseSignal?.aborted).toBe(true);

    await act(async () => {
      resolveEnglish({
        data: [englishUsage],
        meta: { page: 1, page_size: 30, total: 1 },
      });
    });
    expect(await screen.findByText("Current English product")).toBeInTheDocument();

    await act(async () => {
      resolveVietnamese({
        data: [vietnameseUsage],
        meta: { page: 1, page_size: 30, total: 1 },
      });
    });
    expect(screen.getByText("Current English product")).toBeInTheDocument();
    expect(screen.queryByText("Sản phẩm tiếng Việt cũ")).not.toBeInTheDocument();
  });

  it("aborts pending usage on unmount without showing an error", async () => {
    let rejectUsage!: (reason: unknown) => void;
    let usageSignal: AbortSignal | null | undefined;
    vi.mocked(accountApi).mockImplementation((_path, init) => {
      usageSignal = init?.signal;
      return new Promise((_, reject) => {
        rejectUsage = reject;
      });
    });
    const { unmount } = render(
      <MembershipUsagePage copy={getSiteContent("en").account} locale="en" />,
    );
    await waitFor(() => expect(usageSignal).toBeInstanceOf(AbortSignal));

    unmount();
    expect(usageSignal?.aborted).toBe(true);
    await act(async () => rejectUsage(new Error("late failure")));
  });

  it("keeps the newest page response after a page change", async () => {
    const firstPage = {
      id: "usage-page-one",
      membership_id: currentMembership.id,
      status: "applied" as const,
      note: "",
      created_at: "2026-08-20T02:00:00Z",
      reversed_at: null,
      lines: [],
    };
    const secondPage = { ...firstPage, id: "usage-page-two" };
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/usage?page=1&locale=en") {
        return { data: [firstPage], meta: { page: 1, page_size: 30, total: 31 } };
      }
      if (path === "memberships/usage?page=2&locale=en") {
        return { data: [secondPage], meta: { page: 2, page_size: 30, total: 31 } };
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(
      <MembershipUsagePage copy={getSiteContent("en").account} locale="en" />,
    );

    await screen.findByText("Page 1 of 2");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(accountApi).toHaveBeenCalledWith(
        "memberships/usage?page=2&locale=en",
        { signal: expect.any(AbortSignal) },
      ),
    );
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("paginates usage at the backend page size and marks reversed records", async () => {
    const longNote =
      "Weekly delivery note with enough detail to wrap across multiple lines on a narrow mobile viewport without overflowing.";
    const longReversalReason =
      "Delivery correction required after a detailed reconciliation of the collected product quantities.";
    const usage: MembershipUsage = {
      id: "66666666-6666-4666-8666-666666666666",
      membership_id: currentMembership.id,
      status: "reversed",
      note: longNote,
      created_at: "2026-08-20T02:00:00Z",
      reversed_at: "2026-08-21T02:00:00Z",
      lines: [
        {
          product_id: packageItem.items[0].product_id,
          product_name: "Vegetable basket",
          unit_size: "0.500",
          unit_label_vi: "kg",
          unit_label_en: "kg",
          units: 2,
        },
        {
          product_id: "77777777-7777-4777-8777-777777777777",
          product_name: "A very long seasonal fruit selection",
          unit_size: "1.000",
          unit_label_vi: "phần",
          unit_label_en: "portion",
          units: 1,
        },
      ],
      reversal: {
        reason: longReversalReason,
        created_at: "2026-08-21T02:00:00Z",
      },
    };
    vi.mocked(accountApi).mockResolvedValue({
      data: [usage],
      meta: { page: 1, page_size: 30, total: 31 },
    });
    render(
      <MembershipUsagePage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(await screen.findByText("Reversed")).toBeInTheDocument();
    expect(screen.getByText("1 kg")).toBeInTheDocument();
    expect(screen.getByText("1 portion")).toBeInTheDocument();
    expect(screen.getByText(longNote)).toBeInTheDocument();
    expect(screen.getByText(longReversalReason)).toBeInTheDocument();
    expect(screen.getAllByText("Reversed")).toHaveLength(1);
    expect(
      screen.getByText("Products collected through your CSA membership."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Back to your CSA membership" }),
    );
    expect(navigation.replace).toHaveBeenCalledWith("/account/en/membership");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(accountApi).toHaveBeenCalledWith(
        "memberships/usage?page=2&locale=en",
        { signal: expect.any(AbortSignal) },
      ),
    );
    expect(vi.mocked(accountApi).mock.calls[0][0]).toBe(
      "memberships/usage?page=1&locale=en",
    );
  });
});
