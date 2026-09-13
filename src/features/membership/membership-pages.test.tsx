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
import { AccountApiError, accountApi } from "@/features/account/api";
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
import {
  formatMembershipDate,
  formatMembershipDateTime,
  formatMembershipExclusiveEndDate,
  formatMembershipTimestampDate,
} from "@/features/membership/format";

const navigation = vi.hoisted(() => ({
  back: vi.fn(),
  pathname: "/csa/en",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation,
}));
vi.mock("@/features/account/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/account/api")>();
  return { ...actual, accountApi: vi.fn() };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
  it.each(["en", "vi"] as const)(
    "renders the %s packages between the comparison sections and the weekly timeline",
    async (locale) => {
      vi.mocked(accountApi).mockResolvedValue(catalog());
      const copy = getSiteContent(locale).csa;
      render(<CsaPage copy={copy} locale={locale} />);

      const packages = screen.getByRole("region", {
        name: copy.packagesTitle,
      });
      const comparisons = copy.comparisons.map((comparison) =>
        screen.getByRole("region", { name: comparison.title }),
      );
      const timeline = screen.getByRole("region", {
        name: copy.timelineTitle,
      });

      expect(screen.getByRole("heading", { level: 1, name: copy.title })).toBe(
        document.querySelector(".csa-hero h1"),
      );
      for (const title of [copy.packagesTitle, copy.timelineTitle]) {
        const heading = screen.getByRole("heading", { level: 2, name: title });
        expect(heading).toHaveClass("store-section-title");
        expect(heading.closest(".csa-section-heading")).not.toBeNull();
      }
      const faqHeading = screen.getByRole("heading", {
        level: 2,
        name: copy.faqTitle,
      });
      expect(faqHeading).toHaveClass("store-section-title");
      expect(faqHeading.closest(".store-section")).not.toBeNull();
      const packageIntro = screen.getByText(copy.packagesSubtitle);
      const timelineIntro = screen.getByText(copy.substitutionLine);
      expect(packageIntro.tagName).toBe("P");
      expect(packageIntro).toHaveClass("csa-section-intro");
      expect(timelineIntro.tagName).toBe("P");
      expect(timelineIntro).toHaveClass("csa-section-intro");

      expect(comparisons[0].compareDocumentPosition(comparisons[1])).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(comparisons[1].compareDocumentPosition(packages)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(packages.compareDocumentPosition(timeline)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );

      for (const [index, comparison] of copy.comparisons.entries()) {
        const section = comparisons[index];
        expect(within(section).getByText(comparison.eyebrow)).toHaveClass(
          "csa-section-kicker",
        );
        expect(section).toHaveAttribute(
          "aria-labelledby",
          `csa-comparison-${comparison.id}`,
        );
        expect(section.querySelector("header")).toHaveClass(
          "csa-section-heading",
        );
        expect(
          within(section).getByRole("heading", {
            level: 2,
            name: comparison.title,
          }),
        ).toBeVisible();
        expect(
          within(section).getByRole("heading", {
            level: 2,
            name: comparison.title,
          }),
        ).toHaveClass("store-section-title");
        const intro = within(section).getByText(comparison.intro);
        expect(intro.tagName).toBe("P");
        expect(intro).toHaveClass("csa-section-intro");
        expect(
          within(section).getByRole("heading", {
            level: 3,
            name: comparison.left.label,
          }),
        ).toBeVisible();
        expect(
          within(section).getByRole("heading", {
            level: 3,
            name: comparison.right.label,
          }),
        ).toBeVisible();

        const lists = within(section).getAllByRole("list");
        expect(lists).toHaveLength(2);
        expect(within(lists[0]).getAllByRole("listitem")).toHaveLength(
          comparison.left.items.length,
        );
        expect(within(lists[1]).getAllByRole("listitem")).toHaveLength(
          comparison.right.items.length,
        );
        if ("conclusion" in comparison) {
          expect(section).toHaveTextContent(comparison.conclusion.lead);
          expect(section).toHaveTextContent(comparison.conclusion.accent);
        }
      }

      expect(comparisons[0].querySelector("blockquote")).toBeNull();
      const csaComparison = copy.comparisons[1];
      expect("pullQuote" in csaComparison).toBe(true);
      if (!("pullQuote" in csaComparison))
        throw new Error("Missing pull quote");
      const quote = comparisons[1].querySelector("blockquote");
      expect(quote).toHaveClass("csa-comparison-quote");
      const leadParagraph = quote?.querySelector(
        "p:not(.csa-comparison-quote-accent)",
      );
      if (csaComparison.pullQuote.lead) {
        expect(leadParagraph).toHaveTextContent(csaComparison.pullQuote.lead);
      } else {
        expect(leadParagraph).toBeNull();
      }
      expect(quote).toHaveTextContent(csaComparison.pullQuote.accent);
      expect(quote?.querySelector('[aria-hidden="true"]')).toHaveTextContent(
        csaComparison.pullQuote.mark,
      );
      expect(
        quote?.querySelector(".csa-comparison-quote-term"),
      ).toHaveTextContent(csaComparison.pullQuote.accentTerm);
    },
  );

  it.each(["en", "vi"] as const)(
    "renders the %s weekly timeline as an ordered list without carousel controls",
    async (locale) => {
      vi.mocked(accountApi).mockResolvedValue(catalog());
      const copy = getSiteContent(locale).csa;
      render(<CsaPage copy={copy} locale={locale} />);

      const timeline = screen.getByRole("region", {
        name: copy.timelineTitle,
      });
      const list = within(timeline).getByRole("list", {
        name: copy.timelineLabel,
      });
      const cards = within(list).getAllByRole("listitem");

      expect(cards).toHaveLength(5);
      expect(
        within(timeline).queryByRole("button", { name: "Previous day" }),
      ).toBeNull();
      expect(
        within(timeline).queryByRole("button", { name: "Next day" }),
      ).toBeNull();
      expect(timeline.querySelector(".csa-timeline-nav")).toBeNull();
      const heading = within(timeline).getByRole("heading", {
        name: copy.timelineTitle,
      });
      const substitutionLine = within(timeline).getByText(
        copy.substitutionLine,
      );

      expect(heading.compareDocumentPosition(substitutionLine)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(substitutionLine.compareDocumentPosition(cards[0])).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(timeline.querySelector(".csa-timeline-progress")).toBeNull();
      for (const [index, step] of copy.timeline.entries()) {
        expect(cards[index]).not.toHaveTextContent(step.day);
        expect(cards[index]).toHaveTextContent(step.title);
        expect(cards[index]).toHaveTextContent(step.description);
        expect(within(cards[index]).getByAltText(step.alt)).toBeVisible();
      }
      expect(substitutionLine).toBeVisible();
      for (const index of ["01", "02", "03", "04", "05"]) {
        expect(within(timeline).queryByText(index, { exact: true })).toBeNull();
      }
    },
  );

  it.each(["en", "vi"] as const)(
    "supports the %s CSA comparison tabs with linked panels and keyboard navigation",
    async (locale) => {
      vi.mocked(accountApi).mockResolvedValue(catalog());
      const copy = getSiteContent(locale).csa;
      render(<CsaPage copy={copy} locale={locale} />);

      const comparison = copy.comparisons[0];
      const section = screen.getByRole("region", {
        name: comparison.title,
      });
      const [leftTab, rightTab] = within(section).getAllByRole("tab");
      const [leftPanel, rightPanel] = within(section).getAllByRole("tabpanel");

      expect(leftTab).toHaveAttribute("aria-selected", "true");
      expect(leftTab).toHaveAttribute("tabindex", "0");
      expect(rightTab).toHaveAttribute("aria-selected", "false");
      expect(rightTab).toHaveAttribute("tabindex", "-1");
      expect(leftTab).toHaveAttribute("aria-controls", leftPanel.id);
      expect(rightTab).toHaveAttribute("aria-controls", rightPanel.id);
      expect(leftPanel).toHaveAttribute("aria-labelledby", leftTab.id);
      expect(rightPanel).toHaveAttribute("aria-labelledby", rightTab.id);
      expect(leftPanel).toHaveAttribute("tabindex", "0");
      expect(rightPanel).toHaveAttribute("tabindex", "-1");

      leftTab.focus();
      fireEvent.keyDown(leftTab, { key: "ArrowRight" });
      expect(rightTab).toHaveFocus();
      expect(rightTab).toHaveAttribute("aria-selected", "true");
      expect(leftTab).toHaveAttribute("aria-selected", "false");
      expect(rightPanel).toHaveAttribute("tabindex", "0");
      expect(leftPanel).toHaveAttribute("tabindex", "-1");

      fireEvent.keyDown(rightTab, { key: "ArrowRight" });
      expect(leftTab).toHaveFocus();
      expect(leftTab).toHaveAttribute("aria-selected", "true");

      fireEvent.keyDown(leftTab, { key: "End" });
      expect(rightTab).toHaveFocus();
      expect(rightTab).toHaveAttribute("aria-selected", "true");

      fireEvent.keyDown(rightTab, { key: "Home" });
      expect(leftTab).toHaveFocus();
      expect(leftTab).toHaveAttribute("aria-selected", "true");

      fireEvent.keyDown(leftTab, { key: "ArrowLeft" });
      expect(rightTab).toHaveFocus();
      expect(rightTab).toHaveAttribute("aria-selected", "true");

      fireEvent.click(leftTab);
      expect(leftTab).toHaveAttribute("aria-selected", "true");
      expect(rightTab).toHaveAttribute("aria-selected", "false");
    },
  );

  it.each(["en", "vi"] as const)(
    "renders the %s CSA Zalo help section with a labelled link",
    async (locale) => {
      vi.mocked(accountApi).mockResolvedValue(catalog());
      const copy = getSiteContent(locale).csa;
      render(<CsaPage copy={copy} locale={locale} />);

      const section = screen.getByLabelText(copy.zaloTitle);
      expect(section).toBeVisible();
      const zaloLink = screen.getByRole("link", { name: copy.zaloCta });
      expect(zaloLink).toHaveAttribute("href", copy.zaloUrl);
      expect(zaloLink).not.toHaveAttribute("target");
      expect(zaloLink).not.toHaveAttribute("rel");
    },
  );

  it.each(["en", "vi"] as const)(
    "renders all %s CSA FAQ questions and answers with an accessible accordion",
    async (locale) => {
      vi.mocked(accountApi).mockResolvedValue(catalog());
      const copy = getSiteContent(locale).csa;
      render(<CsaPage copy={copy} locale={locale} />);

      expect(
        screen.getByRole("heading", { name: copy.faqTitle }),
      ).toBeVisible();
      expect(
        screen
          .getAllByRole("button")
          .filter((button) => button.id.startsWith("csa-faq-trigger-")),
      ).toHaveLength(8);

      for (const [index, faq] of copy.faqItems.entries()) {
        const trigger = screen.getByRole("button", { name: faq.question });
        const panel = document.getElementById(
          trigger.getAttribute("aria-controls") as string,
        );

        expect(trigger).toHaveAttribute("id", `csa-faq-trigger-${index}`);
        expect(trigger).toHaveAttribute("type", "button");
        expect(trigger).toHaveAttribute(
          "aria-controls",
          `csa-faq-panel-${index}`,
        );
        expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
        expect(panel).toHaveTextContent(faq.answer);
        expect(trigger).toHaveAttribute("aria-expanded", String(index === 0));
      }

      const firstTrigger = screen.getByRole("button", {
        name: copy.faqItems[0].question,
      });
      const secondTrigger = screen.getByRole("button", {
        name: copy.faqItems[1].question,
      });
      const firstPanel = document.getElementById(
        firstTrigger.getAttribute("aria-controls") as string,
      );
      const secondPanel = document.getElementById(
        secondTrigger.getAttribute("aria-controls") as string,
      );

      fireEvent.click(secondTrigger);

      expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
      expect(firstPanel).toHaveAttribute("hidden");
      expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
      expect(secondPanel).not.toHaveAttribute("hidden");
      expect(secondPanel).toHaveTextContent(copy.faqItems[1].answer);
    },
  );

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

  it("opens the Store CTA in the same tab and makes no request/payment/login call", async () => {
    vi.mocked(accountApi).mockResolvedValue(catalog());
    const copy = getSiteContent("vi").csa;
    render(<CsaPage copy={copy} locale="vi" />);

    const heroCta = await screen.findByRole("link", {
      name: "Mua ngay",
    });
    expect(heroCta).toHaveAttribute("href", "/store/vi");
    expect(heroCta).not.toHaveAttribute("target");
    expect(heroCta).not.toHaveAttribute("rel");
    expect(document.querySelector(".csa-story")).toBeNull();

    expect(getSiteContent("vi").csa.timeline.map(({ day }) => day)).toEqual([
      "THỨ HAI",
      "THỨ BA",
      "THỨ TƯ",
      "THỨ NĂM",
      "THỨ SÁU",
    ]);
    for (const day of ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu"]) {
      expect(screen.getByText(day)).toBeVisible();
    }
    expect(vi.mocked(accountApi).mock.calls.map(([path]) => path)).toEqual([
      "membership-packages?page=1&locale=vi",
    ]);
    expect(document.querySelector('a[href^="/api/auth/login"]')).toBeNull();

    const hero = heroCta.closest("header");
    expect(hero).not.toBeNull();
    const benefitList = within(hero as HTMLElement).getByRole("list");
    expect(benefitList.tagName).toBe("UL");
    expect(within(benefitList).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(hero as HTMLElement).getByText("Không sử dụng hóa chất"),
    ).toBeVisible();
    expect(
      within(hero as HTMLElement).getByText("Người nông dân bạn biết rõ tên"),
    ).toBeVisible();
    expect(
      within(hero as HTMLElement).getByText(
        "Giao hàng trong vòng 24 giờ sau thu hoạch",
      ),
    ).toBeVisible();
    expect(document.querySelector(".csa-benefits")).toBeNull();
  });

  it("keeps the English Store CTA localized and verifies benefits", async () => {
    vi.mocked(accountApi).mockResolvedValue(catalog());
    const copy = getSiteContent("en").csa;
    render(<CsaPage copy={copy} locale="en" />);

    const heroCta = await screen.findByRole("link", { name: "Buy now" });
    expect(heroCta).toBeVisible();
    expect(heroCta).toHaveAttribute("href", "/store/en");
    expect(heroCta).not.toHaveAttribute("target");
    expect(heroCta).not.toHaveAttribute("rel");
    expect(document.querySelector(".csa-story")).toBeNull();
    const hero = heroCta.closest("header");
    expect(hero).not.toBeNull();
    const benefitList = within(hero as HTMLElement).getByRole("list");
    expect(within(benefitList).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(hero as HTMLElement).getByText("No chemical inputs"),
    ).toBeVisible();
    expect(
      within(hero as HTMLElement).getByText("A farmer you know by name"),
    ).toBeVisible();
    expect(
      within(hero as HTMLElement).getByText(
        "Delivered within 24 hours of harvest",
      ),
    ).toBeVisible();
    expect(document.querySelector(".csa-benefits")).toBeNull();
  });

  it.each([
    ["en", "See our farms", "Meet the farmers"],
    ["vi", "Xem nông trại của chúng tôi", "Gặp gỡ những người nông dân"],
  ] as const)(
    "uses the configured farms URL without changing other %s comparison actions",
    async (locale, farmsLabel, farmersLabel) => {
      vi.mocked(accountApi).mockResolvedValue(catalog());
      const copy = getSiteContent(locale).csa;
      render(
        <CsaPage
          copy={copy}
          farmsUrl="https://farms.example.com/visit"
          locale={locale}
        />,
      );

      const farmsLink = screen.getByRole("link", { name: farmsLabel });
      expect(farmsLink).toHaveAttribute(
        "href",
        "https://farms.example.com/visit",
      );
      expect(farmsLink).toHaveAttribute("target", "_blank");
      expect(farmsLink).toHaveAttribute("rel", "noopener noreferrer");

      const farmersLink = screen.getByRole("link", { name: farmersLabel });
      expect(farmersLink).toHaveAttribute("href", `/tracker/${locale}`);
      expect(farmersLink).not.toHaveAttribute("target");
      expect(farmersLink).not.toHaveAttribute("rel");

      for (const comparison of copy.comparisons.slice(1)) {
        const section = screen.getByRole("region", {
          name: comparison.title,
        });
        expect(
          within(section).queryByRole("link", { name: farmsLabel }),
        ).toBeNull();
        expect(
          within(section).queryByRole("link", { name: farmersLabel }),
        ).toBeNull();
      }
    },
  );

  it.each([
    ["en", "See our farms", "Meet the farmers", undefined],
    ["en", "See our farms", "Meet the farmers", ""],
    ["en", "See our farms", "Meet the farmers", "ftp://farms.example.com"],
    ["en", "See our farms", "Meet the farmers", "javascript:alert(1)"],
    [
      "vi",
      "Xem nông trại của chúng tôi",
      "Gặp gỡ những người nông dân",
      undefined,
    ],
    ["vi", "Xem nông trại của chúng tôi", "Gặp gỡ những người nông dân", ""],
    [
      "vi",
      "Xem nông trại của chúng tôi",
      "Gặp gỡ những người nông dân",
      "ftp://farms.example.com",
    ],
    [
      "vi",
      "Xem nông trại của chúng tôi",
      "Gặp gỡ những người nông dân",
      "javascript:alert(1)",
    ],
  ] as const)(
    "hides every unavailable farms URL in %s without changing the farmers action",
    async (locale, farmsLabel, farmersLabel, farmsUrl) => {
      vi.mocked(accountApi).mockResolvedValue(catalog());
      render(
        <CsaPage
          copy={getSiteContent(locale).csa}
          farmsUrl={farmsUrl}
          locale={locale}
        />,
      );

      expect(screen.queryByRole("link", { name: farmsLabel })).toBeNull();
      const farmersLink = screen.getByRole("link", { name: farmersLabel });
      expect(farmersLink).toHaveAttribute("href", `/tracker/${locale}`);
      expect(farmersLink).not.toHaveAttribute("target");
      expect(farmersLink).not.toHaveAttribute("rel");
    },
  );

  it("keeps only the Hero CTA in the empty catalog state", async () => {
    vi.mocked(accountApi).mockResolvedValue(catalog([]));
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    expect(
      await screen.findByText("There are no packages available right now."),
    ).toBeVisible();
    const heroCta = screen.getByRole("link", { name: "Buy now" });
    expect(heroCta).toBeVisible();
    expect(heroCta).toHaveAttribute("href", "/store/en");
  });

  it("keeps only the Hero CTA while packages load and after an error", async () => {
    vi.mocked(accountApi).mockImplementation(
      () => new Promise(() => undefined),
    );
    const loadingView = render(
      <CsaPage copy={getSiteContent("en").csa} locale="en" />,
    );

    expect(screen.getByText("Loading packages…")).toBeVisible();
    expect(screen.getByRole("link", { name: "Buy now" })).toBeVisible();
    loadingView.unmount();

    vi.mocked(accountApi).mockRejectedValue(new Error("Unavailable"));
    render(<CsaPage copy={getSiteContent("en").csa} locale="en" />);

    expect(
      await screen.findByText("We could not load packages. Please try again."),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Buy now" })).toBeVisible();
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
  it("keeps date-only boundaries separate from timestamps in Vietnam time", () => {
    expect(formatMembershipTimestampDate("2026-09-11T18:00:00Z")).toBe(
      "12/09/2026",
    );
    expect(formatMembershipDateTime("2026-09-11T18:00:00Z")).toBe(
      "12/09/2026 01:00",
    );
    expect(formatMembershipDate("2026-10-01")).toBe("01/10/2026");
    expect(formatMembershipExclusiveEndDate("2027-01-01")).toBe("31/12/2026");
  });

  it("renders immutable purchase snapshots and active quota", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: { ...currentMembership, end_date: "2027-01-01" } };
      if (path === "memberships/quota?locale=en") return { data: quota };
      if (path === `memberships/${currentMembership.id}/contract`)
        throw new AccountApiError("csa_contract_unavailable", 404);
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
    expect(screen.getByText("15/08/2026")).toBeVisible();
    expect(screen.getByText("31/12/2026")).toBeVisible();
    expect(await screen.findByText("No contract yet")).toBeVisible();
  });

  it("renders the owned contract and downloads only available current PDFs", async () => {
    const contract = {
      id: "77777777-7777-4777-8777-777777777777",
      reference_code: "CSA-202609-8F3K2M",
      status: "active" as const,
      issued_at: "2026-09-10T02:00:00Z",
      revoked_at: null,
      revocation_reason: null,
      available_locales: ["vi", "en"] as Array<"vi" | "en">,
      payment_plan: { payment_type: "installment", installment_count: 2 },
      payment_summary: {
        total_amount: "1200000",
        paid_amount: "600000",
        remaining_amount: "600000",
        confirmed_installments: 1,
        installment_count: 2,
        paid_cycles: 1,
        total_cycles: 3,
      },
      payments: [
        {
          installment_sequence: 1,
          amount_due: "600000",
          amount_paid: "600000",
          cycle_count: 1,
          status: "confirmed",
          due_at: null,
          confirmed_at: "2026-09-11T18:00:00Z",
          rejected_at: null,
        },
      ],
    };
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: currentMembership };
      if (path === "memberships/quota?locale=en") return { data: quota };
      if (path === `memberships/${currentMembership.id}/contract`)
        return { data: contract };
      throw new Error(`Unexpected request: ${path}`);
    });
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      expect(String(input)).toMatch(
        new RegExp(
          `/api/account/memberships/${currentMembership.id}/contract/pdf\\?locale=(vi|en)$`,
        ),
      );
      return new Response(new Uint8Array([37, 80, 68, 70]), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="contract.pdf"',
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:contract"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );

    expect(await screen.findByText(contract.reference_code)).toBeVisible();
    expect(screen.getByText("CSA payment schedule")).toBeVisible();
    expect(screen.getByText("Pay in 2 installments")).toBeVisible();
    expect(screen.getByText("Payment 1")).toBeVisible();
    expect(
      screen.getByText(/legacy contract has no version history/),
    ).toBeVisible();
    expect(
      screen.getByText("Active", {
        selector: ".membership-contract-section span",
      }),
    ).toBeVisible();
    const revokeObjectURL = vi.mocked(URL.revokeObjectURL);
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Download Vietnamese PDF" }),
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(999));
    expect(revokeObjectURL).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Download English PDF" }),
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(click).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1_000));
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("renders ordered owned Contract versions and downloads historical/current PDFs", async () => {
    const old = {
      id: "11111111-1111-4111-8111-111111111111",
      version_number: 1,
      version_reason: "issued",
      contract_status: "active",
      created_at: "2026-09-10T02:00:00Z",
      available_locales: ["vi"],
    };
    const current = {
      id: "22222222-2222-4222-8222-222222222222",
      version_number: 2,
      version_reason: "membership_revoked",
      contract_status: "revoked",
      created_at: "2026-09-12T02:00:00Z",
      available_locales: ["vi", "en"],
      paid_amount: "1000000",
      remaining_amount: "3500000",
    };
    const contract = {
      id: "77777777-7777-4777-8777-777777777777",
      reference_code: "CSA-202609-8F3K2M",
      status: "revoked",
      available_locales: ["vi", "en"],
      current_version: current,
      versions: [current, old],
    };
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: currentMembership };
      if (path === "memberships/quota?locale=en") return { data: quota };
      if (path === `memberships/${currentMembership.id}/contract`)
        return { data: contract };
      throw new Error(`Unexpected request: ${path}`);
    });
    const fetchMock = vi.fn(
      async () =>
        new Response(new Uint8Array([37, 80, 68, 70]), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="CSA-CODE.v1.vi.pdf"',
          },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:version"),
    });
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const downloaded: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloaded.push(this.download);
    });

    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    expect(await screen.findByText("Contract version history")).toBeVisible();
    const rows = screen
      .getAllByRole("listitem")
      .filter((row) => row.className === "csa-contract-version");
    expect(within(rows[0]).getByText("Version 1")).toBeVisible();
    expect(within(rows[1]).getByText("Version 2")).toBeVisible();
    expect(within(rows[1]).getByText("Current version")).toBeVisible();
    expect(within(rows[0]).queryByText("Current version")).toBeNull();
    expect(within(rows[0]).getByText("VI")).toBeVisible();
    expect(
      within(rows[0]).queryByRole("button", { name: "Download English PDF" }),
    ).toBeNull();
    expect(within(rows[1]).getByText("₫1,000,000")).toBeVisible();

    vi.useFakeTimers();
    await act(async () =>
      fireEvent.click(
        within(rows[0]).getByRole("button", {
          name: "Download Vietnamese PDF",
        }),
      ),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/account/memberships/${currentMembership.id}/contract/pdf?locale=vi&version_id=${old.id}`,
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(downloaded).toEqual(["CSA-CODE.v1.vi.pdf"]);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1_000));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:version");
    await act(async () =>
      fireEvent.click(
        within(rows[1]).getByRole("button", { name: "Download English PDF" }),
      ),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/account/memberships/${currentMembership.id}/contract/pdf?locale=en&version_id=${current.id}`,
      expect.anything(),
    );
  });

  it("keeps owned Contract detail when one version PDF fails", async () => {
    const version = {
      id: "11111111-1111-4111-8111-111111111111",
      version_number: 1,
      version_reason: "issued",
      contract_status: "active",
      created_at: "2026-09-10T02:00:00Z",
      available_locales: ["vi", "en"],
    };
    const contract = {
      reference_code: "CSA-202609-8F3K2M",
      status: "active",
      available_locales: ["vi", "en"],
      current_version: version,
      versions: [version],
    };
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: currentMembership };
      if (path === "memberships/quota?locale=en") return { data: quota };
      return { data: contract };
    });
    let rejectFetch: (error: Error) => void = () => undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((_, reject) => {
          rejectFetch = reject;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    const row = (await screen.findByText("Version 1")).closest("li")!;
    const button = within(row).getByRole("button", {
      name: "Download Vietnamese PDF",
    });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(
      within(row).getByRole("button", { name: "Download English PDF" }),
    ).toBeEnabled();
    fireEvent.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => rejectFetch(new Error("private-storage-key")));
    expect(within(row).getByRole("alert")).toHaveTextContent(
      "temporarily unavailable",
    );
    expect(screen.getByText(contract.reference_code)).toBeVisible();
    expect(button).toBeEnabled();
    expect(screen.queryByText("private-storage-key")).toBeNull();
  });

  it("localizes contract detail and PDF failures without exposing backend errors", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: currentMembership };
      if (path === "memberships/quota?locale=en") return { data: quota };
      throw new AccountApiError("internal_storage_key_failure", 502);
    });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    expect(
      await screen.findByText(
        "We could not load the contract. Please try again.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("internal_storage_key_failure")).toBeNull();
  });

  it("shows a localized error when an owned contract PDF is unavailable", async () => {
    const contract = {
      id: "77777777-7777-4777-8777-777777777777",
      reference_code: "CSA-202609-8F3K2M",
      status: "active" as const,
      issued_at: "2026-09-10T02:00:00Z",
      revoked_at: null,
      revocation_reason: null,
      available_locales: ["en"] as Array<"vi" | "en">,
    };
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: currentMembership };
      if (path === "memberships/quota?locale=en") return { data: quota };
      return { data: contract };
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: "internal_storage_key_failure" },
            { status: 404 },
          ),
        ),
    );
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Download English PDF" }),
    );
    expect(
      await screen.findByText("The contract PDF is temporarily unavailable."),
    ).toBeVisible();
    expect(screen.queryByText("internal_storage_key_failure")).toBeNull();
  });

  it("links an empty Membership account to public CSA", async () => {
    vi.mocked(accountApi).mockResolvedValue({ data: null });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    expect(
      await screen.findByRole("link", { name: "View CSA packages" }),
    ).toHaveAttribute("href", "/csa/en");
    expect(accountApi).toHaveBeenCalledWith("memberships/current?locale=en", {
      signal: expect.any(AbortSignal),
    });
  });

  it("keeps scheduled Membership details without loading quota", async () => {
    vi.mocked(accountApi).mockImplementation(async (path) => {
      if (path === "memberships/current?locale=en")
        return { data: { ...currentMembership, status: "scheduled" as const } };
      throw new AccountApiError("csa_contract_unavailable", 404);
    });
    render(
      <AccountMembershipPage copy={getSiteContent("en").account} locale="en" />,
    );
    expect(await screen.findByText("Scheduled")).toBeVisible();
    expect(screen.getByText(/will begin on 15\/08\/2026/)).toBeVisible();
    expect(vi.mocked(accountApi).mock.calls.map(([path]) => path)).toEqual([
      "memberships/current?locale=en",
      `memberships/${currentMembership.id}/contract`,
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
      })
      .mockRejectedValue(new AccountApiError("csa_contract_unavailable", 404));
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
    created_at: "2026-08-20T18:00:00Z",
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
    expect(screen.getByText("21/08/2026 01:00")).toBeVisible();
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
