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
import { accountApi } from "@/features/account/api";
import type {
  CurrentMembership,
  MembershipPackage,
  MembershipQuota,
  MembershipUsage,
} from "@/features/account/types";
import {
  AccountMembershipPage,
  MembershipUsagePage,
} from "@/features/membership/account-membership-pages";
import { CsaPage } from "@/features/membership/csa-page";

const navigation = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
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
  quota_policy: "expire",
  price_options: [
    {
      id: "price-six",
      duration_months: 6,
      monthly_price_vnd: "700000",
      total_price_vnd: "4200000",
      sort_order: 30,
    },
    {
      id: "price-one",
      duration_months: 1,
      monthly_price_vnd: "800000",
      total_price_vnd: "800000",
      sort_order: 10,
    },
    {
      id: "price-three",
      duration_months: 3,
      monthly_price_vnd: "750000",
      total_price_vnd: "2250000",
      sort_order: 20,
    },
  ],
  items: [
    {
      product_id: "22222222-2222-4222-8222-222222222222",
      product_name: "Vegetable basket",
      unit_size: "0.500",
      unit_label_vi: "kg",
      unit_label_en: "kg",
      quota_units: 2,
    },
  ],
};

const currentMembership: CurrentMembership = {
  id: "44444444-4444-4444-8444-444444444444",
  user_id: "55555555-5555-4555-8555-555555555555",
  package_id: packageItem.id,
  price_option_id: "price-six",
  status: "active",
  package_name: "Purchased CSA snapshot",
  package_description: "Description saved when this package was assigned",
  duration_months: 6,
  monthly_price_vnd: "769000",
  total_price_vnd: "4614000",
  price_option: {
    duration_months: 6,
    monthly_price_vnd: "769000",
    total_price_vnd: "4614000",
  },
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
      product_name: "Vegetable basket snapshot",
      unit_size: "0.500",
      unit_label_vi: "kg",
      unit_label_en: "kg",
      quota_units_per_cycle: 2,
      remaining_units: 2,
    },
  ],
};

function catalog(
  data: MembershipPackage[] = [packageItem],
  page = 1,
  total = data.length,
) {
  return { data, meta: { page, page_size: 30, total } };
}

describe("public CSA Membership", () => {
  it("renders ordered price options, exact integer money, savings, and one best badge", async () => {
    vi.mocked(accountApi).mockResolvedValue(catalog());
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    const card = (await screen.findByText(packageItem.name)).closest("article");
    expect(card).not.toBeNull();
    const optionItems = within(card as HTMLElement)
      .getByRole("heading", { name: "Available durations" })
      .nextElementSibling?.querySelectorAll(":scope > li");
    expect(
      Array.from(optionItems ?? []).map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining("1 month"),
      expect.stringContaining("3 months"),
      expect.stringContaining("6 months"),
    ]);
    expect(within(card as HTMLElement).getByText("₫4,200,000")).toBeVisible();
    expect(
      within(card as HTMLElement).getByText("Save ₫150,000"),
    ).toBeVisible();
    expect(
      within(card as HTMLElement).getByText("Save ₫600,000"),
    ).toBeVisible();
    expect(
      within(card as HTMLElement).getAllByText("Best savings"),
    ).toHaveLength(1);
    expect(
      within(card as HTMLElement)
        .getByText("Best savings")
        .closest("li"),
    ).toHaveTextContent("6 months");
  });

  it("does not invent savings or a badge without an active one-month baseline", async () => {
    vi.mocked(accountApi).mockResolvedValue(
      catalog([
        {
          ...packageItem,
          price_options: packageItem.price_options.filter(
            (option) => option.duration_months !== 1,
          ),
        },
      ]),
    );
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    await screen.findByText(packageItem.name);
    expect(screen.queryByText(/Save ₫/)).toBeNull();
    expect(screen.queryByText("Best savings")).toBeNull();
  });

  it("opens the Farmbrite CTA in the same tab and makes no request/payment/login call", async () => {
    vi.mocked(accountApi).mockResolvedValue(catalog());
    const copy = getSiteContent("vi").csa;
    render(<CsaPage copy={copy} locale="vi" />);

    const cta = await screen.findByRole("link", {
      name: "Mua ngay",
    });
    expect(cta).toHaveAttribute(
      "href",
      "https://store.farmbrite.com/store/nntn/products?category=Memberships",
    );
    expect(cta).not.toHaveAttribute("target");
    expect(cta).not.toHaveAttribute("rel");
    expect(vi.mocked(accountApi).mock.calls.map(([path]) => path)).toEqual([
      "membership-packages?page=1&locale=vi",
    ]);
    expect(document.querySelector('a[href^="/api/auth/login"]')).toBeNull();

    const benefits = screen.getByRole("region", { name: copy.eyebrow });
    expect(benefits.querySelectorAll("li")).toHaveLength(4);
    expect(within(benefits).getByText("Nhận hàng vào thứ Bảy hằng tuần")).toBeVisible();
    expect(within(benefits).getByText("Miễn phí giao hàng cho thành viên CSA")).toBeVisible();
    expect(within(benefits).getByText("Sản phẩm được cập nhật đầu tuần")).toBeVisible();
    expect(within(benefits).getByText("Thông tin được cập nhật qua nhóm Zalo CSA")).toBeVisible();
  });

  it("keeps the English Farmbrite CTA localized and verifies benefits", async () => {
    vi.mocked(accountApi).mockResolvedValue(catalog());
    const copy = getSiteContent("en").csa;
    render(<CsaPage copy={copy} locale="en" />);

    expect(
      await screen.findByRole("link", { name: "Buy now" }),
    ).toBeVisible();

    const benefits = screen.getByRole("region", { name: copy.eyebrow });
    expect(benefits.querySelectorAll("li")).toHaveLength(4);
    expect(within(benefits).getByText("Receive products every Saturday")).toBeVisible();
    expect(within(benefits).getByText("Free delivery for CSA members")).toBeVisible();
    expect(within(benefits).getByText("Products updated early in the week")).toBeVisible();
    expect(within(benefits).getByText("Information updated via CSA Zalo group")).toBeVisible();
  });

  it("paginates all active packages without loading every page", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path.includes("page=2"))
        return catalog([{ ...packageItem, name: "Package 31" }], 2, 31);
      return catalog([{ ...packageItem, name: "Package 1" }], 1, 31);
    });
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    await screen.findByText("Package 1");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Package 31")).toBeVisible();
    expect(accountApi).toHaveBeenCalledWith(
      "membership-packages?page=2&locale=en",
      { signal: expect.any(AbortSignal) },
    );
  });

  it("keeps the newest locale response and aborts stale catalog work", async () => {
    let resolveVi!: (value: ReturnType<typeof catalog>) => void;
    let resolveEn!: (value: ReturnType<typeof catalog>) => void;
    let viSignal: AbortSignal | null | undefined;
    vi.mocked(accountApi).mockImplementation((path, init) => {
      if (path.endsWith("locale=vi")) {
        viSignal = init?.signal;
        return new Promise((resolve) => {
          resolveVi = resolve;
        });
      }
      return new Promise((resolve) => {
        resolveEn = resolve;
      });
    });
    const view = render(
      <CsaPage copy={getSiteContent("vi").csa} locale="vi" />,
    );
    await waitFor(() => expect(resolveVi).toBeTypeOf("function"));

    view.rerender(<CsaPage copy={getSiteContent("en").csa} locale="en" />);
    await waitFor(() => expect(resolveEn).toBeTypeOf("function"));
    expect(viSignal?.aborted).toBe(true);
    await act(async () =>
      resolveEn(catalog([{ ...packageItem, name: "English current" }])),
    );
    expect(await screen.findByText("English current")).toBeVisible();
    await act(async () =>
      resolveVi(catalog([{ ...packageItem, name: "Vietnamese stale" }])),
    );
    expect(screen.queryByText("Vietnamese stale")).toBeNull();
  });

  it("aborts the pending catalog request on unmount", async () => {
    let signal: AbortSignal | null | undefined;
    vi.mocked(accountApi).mockImplementation((_path, init) => {
      signal = init?.signal;
      return new Promise(() => undefined);
    });
    const { unmount } = render(
      <CsaPage copy={getSiteContent("en").csa} locale="en" />,
    );
    await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal));
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});

describe("Account Membership", () => {
  it("renders immutable purchase snapshots and active quota", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: currentMembership };
      if (path === "memberships/quota?locale=en") return { data: quota };
      throw new Error(`Unexpected request: ${path}`);
    });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(await screen.findByText("Purchased CSA snapshot")).toBeVisible();
    expect(
      screen.getByText("Description saved when this package was assigned"),
    ).toBeVisible();
    expect(screen.getByText("6 months")).toBeVisible();
    expect(screen.getByText("₫769,000")).toBeVisible();
    expect(screen.getByText("₫4,614,000")).toBeVisible();
    expect(screen.getByText("This cycle: 1 kg")).toBeVisible();
    expect(screen.getByText("Vegetable basket snapshot")).toBeVisible();
  });

  it("links an empty Membership account to public CSA", async () => {
    vi.mocked(accountApi).mockResolvedValue({ data: null });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    expect(
      await screen.findByRole("link", { name: "View CSA packages" }),
    ).toHaveAttribute("href", "/en/csa");
    expect(accountApi).toHaveBeenCalledWith("memberships/current?locale=en", {
      signal: expect.any(AbortSignal),
    });
  });

  it("keeps scheduled Membership details without loading quota", async () => {
    vi.mocked(accountApi).mockResolvedValue({
      data: { ...currentMembership, status: "scheduled" },
    });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    expect(await screen.findByText("Scheduled")).toBeVisible();
    expect(screen.getByText(/will begin on August 15, 2026/)).toBeVisible();
    expect(vi.mocked(accountApi).mock.calls.map(([path]) => path)).toEqual([
      "memberships/current?locale=en",
    ]);
  });

  it("aborts stale current/quota work on locale replacement", async () => {
    let resolveOlder!: (value: { data: CurrentMembership }) => void;
    vi.mocked(accountApi)
      .mockReturnValueOnce(new Promise((resolve) => (resolveOlder = resolve)))
      .mockResolvedValueOnce({
        data: {
          ...currentMembership,
          status: "scheduled",
          package_name: "New locale",
        },
      });
    const copy = getSiteContent("en").account;
    const view = render(<AccountMembershipPage copy={copy} locale="en" />);
    const olderSignal = vi.mocked(accountApi).mock.calls[0][1]?.signal;
    view.rerender(
      <AccountMembershipPage
        copy={{ ...copy, membershipError: "New error" }}
        locale="en"
      />,
    );
    expect(await screen.findByText("New locale")).toBeVisible();
    expect(olderSignal?.aborted).toBe(true);
    await act(async () => resolveOlder({ data: currentMembership }));
    expect(screen.getByText("New locale")).toBeVisible();
  });
});

describe("Membership usage", () => {
  const usage: MembershipUsage = {
    id: "usage-one",
    membership_id: currentMembership.id,
    status: "reversed",
    note: "Weekly collection",
    created_at: "2026-08-20T02:00:00Z",
    reversed_at: "2026-08-21T02:00:00Z",
    lines: [
      {
        product_id: packageItem.items[0].product_id,
        product_name: "Vegetable basket snapshot",
        unit_size: "0.500",
        unit_label_vi: "kg",
        unit_label_en: "kg",
        units: 2,
      },
    ],
    reversal: {
      reason: "Quantity corrected",
      created_at: "2026-08-21T02:00:00Z",
    },
  };

  it("keeps localized usage, reversal detail, and 30-item pagination", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => ({
      data: [usage],
      meta: {
        page: path.includes("page=2") ? 2 : 1,
        page_size: 30,
        total: 31,
      },
    }));
    render(
      <MembershipUsagePage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(await screen.findByText("Vegetable basket snapshot")).toBeVisible();
    expect(screen.getByText("1 kg")).toBeVisible();
    expect(screen.getByText("Quantity corrected")).toBeVisible();
    expect(screen.getByText("Page 1 of 2")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Page 2 of 2")).toBeVisible();
    expect(accountApi).toHaveBeenCalledWith(
      "memberships/usage?page=2&locale=en",
      { signal: expect.any(AbortSignal) },
    );
  });

  it("aborts usage on unmount and suppresses its late error", async () => {
    let reject!: (reason: unknown) => void;
    let signal: AbortSignal | null | undefined;
    vi.mocked(accountApi).mockImplementation((_path, init) => {
      signal = init?.signal;
      return new Promise((_, rejectRequest) => {
        reject = rejectRequest;
      });
    });
    const { unmount } = render(
      <MembershipUsagePage copy={getSiteContent("en").account} locale="en" />,
    );
    await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal));
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => reject(new Error("late failure")));
  });
});
