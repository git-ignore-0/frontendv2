import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/content/site-content";
import type { PublicTrackerFarm } from "@/lib/content-api";

import { TrackerPage } from "./tracker-page";

function farm(
  signupCount: number,
  overrides: Partial<PublicTrackerFarm> = {},
): PublicTrackerFarm {
  const image = overrides.image ?? null;
  return {
    id: `farm-${signupCount}`,
    name: `Farm ${signupCount}`,
    location: "Da Lat",
    description: "A family farm growing with its community.",
    image,
    images: overrides.images ?? (image ? [image] : []),
    signup_count: signupCount,
    one_month_signup_count: 0,
    sort_order: signupCount,
    ...overrides,
  };
}

function galleryImage(index: number) {
  return {
    id: `image-${index}`,
    url: `https://cdn.example.com/farms/farm-${index}.webp`,
    width: 1600,
    height: 1200,
    alt: `Farm photo ${index}`,
    variants: [
      {
        url: `https://cdn.example.com/farms/farm-${index}-480.webp`,
        width: 480,
        height: 360,
      },
      {
        url: `https://cdn.example.com/farms/farm-${index}-960.webp`,
        width: 960,
        height: 720,
      },
    ],
  };
}

const localizedGalleryTestCopy = {
  en: {
    trigger: "Growth details for Farm 14",
    viewer: "Farm photo viewer",
  },
  vi: {
    trigger: "Thông tin phát triển của Farm 14",
    viewer: "Trình xem ảnh nông trại",
  },
} as const;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TrackerPage", () => {
  it("renders the reference header hierarchy and milestone legend", () => {
    const copy = getSiteContent("en").tracker;
    render(<TrackerPage copy={copy} farms={[farm(14)]} />);

    expect(screen.getByText("Natural Farming Vietnam")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "From Seed to Harvest — CSA Growth Tracker",
      }),
    ).toBeVisible();
    const legend = screen.getByLabelText(copy.legendLabel);
    expect(within(legend).getByText("Getting Started")).toBeVisible();
    expect(within(legend).getByText("Providing for Family")).toBeVisible();
    expect(within(legend).getByText("Community Leader")).toBeVisible();
    expect(within(legend).getByText("10")).toBeVisible();
    expect(within(legend).getByText("20")).toBeVisible();
    expect(within(legend).getByText("30")).toBeVisible();
  });

  it("calculates separate one-month and six-month totals plus leader stats", () => {
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[
          farm(9, { one_month_signup_count: 1 }),
          farm(10, { one_month_signup_count: 2 }),
          farm(29, { one_month_signup_count: 3 }),
          farm(30, { one_month_signup_count: 4 }),
        ]}
      />,
    );

    expect(
      screen.getByText("FARMERS IN THE GROUP").previousSibling,
    ).toHaveTextContent("4");
    expect(
      screen.getByText("TOTAL 1-MONTH SIGNUPS").previousSibling,
    ).toHaveTextContent("10");
    expect(
      screen.getByText("TOTAL 6-MONTH SIGNUPS").previousSibling,
    ).toHaveTextContent("78");
    expect(
      screen.getByText("COMMUNITY LEADERS REACHED").previousSibling,
    ).toHaveTextContent("1");
  });

  it.each([
    ["en", "Live CSA signup data."],
    ["vi", "Dữ liệu đăng ký CSA đang được cập nhật."],
  ] as const)(
    "renders the localized live-data note between the legend and stats for %s",
    (locale, noteTitle) => {
      const copy = getSiteContent(locale).tracker;
      const { container } = render(
        <TrackerPage copy={copy} farms={[farm(14)]} />,
      );
      const legend = container.querySelector(".tracker-legend");
      const note = container.querySelector(".tracker-demo-note");
      const stats = container.querySelector(".tracker-stats");

      if (!legend || !note || !stats) {
        throw new Error("Expected tracker legend, live note, and stats");
      }
      expect(screen.getByText(noteTitle)).toBeVisible();
      expect(note).not.toHaveTextContent(/prototype|placeholder|Farmer B/i);
      expect(
        legend.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        note.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    },
  );

  it("renders API farms without demo data or mutation controls", () => {
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[
          farm(14, {
            id: "real-farm",
            name: "Green Valley Farm",
            location: "Lam Dong",
          }),
        ]}
      />,
    );

    expect(screen.getAllByText("Green Valley Farm").length).toBeGreaterThan(0);
    expect(screen.getByText("Lam Dong")).toBeVisible();
    expect(screen.queryByText("Salime")).not.toBeInTheDocument();
    expect(screen.queryByText("Farmer B")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^(add|remove|reset)( farmer| farm| all)?$/i),
    ).not.toBeInTheDocument();
  });

  it.each([
    [0, "Seed planted"],
    [9, "Seed planted"],
    [10, "Getting Started"],
    [19, "Getting Started"],
    [20, "Providing for Family"],
    [29, "Providing for Family"],
    [30, "Community Leader"],
  ] as const)("renders the %i boundary as %s", (count, label) => {
    render(
      <TrackerPage copy={getSiteContent("en").tracker} farms={[farm(count)]} />,
    );

    const cardContainer = screen
      .getByRole("heading", { level: 3, name: `Farm ${count}` })
      .closest<HTMLElement>(".tracker-farm-card");
    if (!cardContainer) throw new Error("Expected tracker farm card container");
    expect(
      within(cardContainer).getByText(label, {
        selector: ".tracker-stage-badge span",
      }),
    ).toBeVisible();
  });

  it("provides localized progress semantics and fixed ticks", () => {
    render(
      <TrackerPage copy={getSiteContent("en").tracker} farms={[farm(14)]} />,
    );

    const progress = screen.getByRole("progressbar", {
      name: /Farm 14: 14 total 6-month signups/i,
    });
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(progress).toHaveAttribute("aria-valuenow", "47");
    const card = progress.closest<HTMLElement>(".tracker-farm-card");
    if (!card) throw new Error("Expected tracker farm card container");
    expect(card.tagName).toBe("ARTICLE");
    expect(card).not.toHaveAttribute("role", "button");
    const detailTrigger = within(card).getByRole("button", {
      name: "Growth details for Farm 14",
    });
    expect(detailTrigger.tagName).toBe("BUTTON");
    expect(detailTrigger).not.toContainElement(progress);
    expect(card).toContainElement(progress);
    expect(within(card).getByText("/ 30")).toBeVisible();
    const countLabels = card.querySelectorAll<HTMLElement>(
      ".tracker-count-label",
    );
    expect(countLabels).toHaveLength(2);
    expect(countLabels[0]).toHaveTextContent("6-month signups");
    expect(
      countLabels[0].querySelectorAll(".tracker-count-label-part"),
    ).toHaveLength(2);
    expect(
      card.querySelector(
        ".tracker-count-secondary .tracker-count-value strong",
      ),
    ).toHaveTextContent("0");
    expect(countLabels[1]).toHaveTextContent("one-month signups");
    expect(
      countLabels[1].querySelectorAll(".tracker-count-label-part"),
    ).toHaveLength(2);
    expect(
      within(card).queryByText("0 · one-month signups"),
    ).not.toBeInTheDocument();
    const ticks = card.querySelector<HTMLElement>(".tracker-progress-ticks");
    if (!ticks) throw new Error("Expected tracker progress ticks");
    for (const tick of ["0", "10", "20", "30"]) {
      expect(within(ticks).getByText(tick)).toBeInTheDocument();
    }
  });

  it("shows next-milestone guidance and the completed leader state", () => {
    const { rerender } = render(
      <TrackerPage copy={getSiteContent("en").tracker} farms={[farm(29)]} />,
    );
    const nextSignup = screen.getByText("1 more 6-month signup");
    expect(nextSignup).toBeVisible();
    expect(nextSignup.tagName).toBe("STRONG");
    expect(screen.getByText(/gets Farm 29 to/i)).toBeVisible();
    expect(
      document.querySelector(".tracker-impact-note"),
    ).not.toHaveTextContent(/\.\./);

    rerender(
      <TrackerPage copy={getSiteContent("en").tracker} farms={[farm(30)]} />,
    );
    expect(screen.getByLabelText("Community Leader reached")).toBeVisible();
    const leaderMessage = screen.getByText("Community Leader", {
      selector: "strong",
    });
    expect(leaderMessage).toBeVisible();
  });

  it("shows both localized counts without letting the one-month count affect progress or milestones", () => {
    const copy = getSiteContent("vi").tracker;
    const { rerender } = render(
      <TrackerPage
        copy={copy}
        farms={[farm(14, { one_month_signup_count: 4 })]}
      />,
    );

    const progress = screen.getByRole("progressbar");
    const card = progress.closest<HTMLElement>(".tracker-farm-card");
    if (!card) throw new Error("Expected tracker farm card container");
    expect(progress).toHaveAttribute("aria-valuenow", "47");
    expect(within(card).getByText("Bắt đầu phát triển")).toBeVisible();
    expect(
      card.querySelector(
        ".tracker-count-secondary .tracker-count-value strong",
      ),
    ).toHaveTextContent("4");
    expect(within(card).getByText("/ 30")).toBeVisible();
    const localizedLabels = card.querySelectorAll<HTMLElement>(
      ".tracker-count-label",
    );
    expect(localizedLabels[0]).toHaveTextContent("lượt đăng ký gói 6 tháng");
    expect(localizedLabels[1]).toHaveTextContent("lượt đăng ký gói 1 tháng");
    expect(
      within(card).queryByText("0 · one-month signups"),
    ).not.toBeInTheDocument();

    rerender(
      <TrackerPage
        copy={copy}
        farms={[farm(14, { one_month_signup_count: 999 })]}
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "47",
    );
    expect(
      within(
        screen.getByRole("progressbar").closest(".tracker-farm-card")!,
      ).getByText("Bắt đầu phát triển"),
    ).toBeVisible();
    expect(screen.queryByLabelText("Đã đạt mốc Dẫn dắt cộng đồng")).toBeNull();
    expect(
      document.querySelector(
        ".tracker-count-secondary .tracker-count-value strong",
      ),
    ).toHaveTextContent("999");
    expect(document.querySelector(".tracker-impact-note")).toHaveTextContent(
      /lượt đăng ký gói 6 tháng sẽ đưa/,
    );
  });

  it("renders zero stats and no farm grid in the empty state", () => {
    render(<TrackerPage copy={getSiteContent("en").tracker} farms={[]} />);

    expect(screen.getAllByText("0")).toHaveLength(4);
    expect(screen.getByText("No farms to show yet")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Growth details for Farm/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a localized loading state with reserved space", () => {
    render(
      <TrackerPage
        copy={getSiteContent("vi").tracker}
        farms={[]}
        state="loading"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Đang tải hành trình của các nông trại…",
    );
    expect(
      document.querySelector(".tracker-state-skeleton"),
    ).toBeInTheDocument();
    expect(document.querySelector(".tracker-stats")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renders the localized error and retries without fake farms", () => {
    const retry = vi.fn();
    render(
      <TrackerPage
        copy={getSiteContent("vi").tracker}
        farms={[]}
        onRetry={retry}
        state="error"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Không thể tải hành trình nông trại",
    );
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", {
        name: /Thông tin phát triển của Nông trại/i,
      }),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      locale: "en",
      location: "Suoi Dai village, Lam Dong",
      name: "Green Valley Regenerative Community Farm and Learning Centre",
    },
    {
      locale: "vi",
      location: "Thôn Suối Dài, xã miền núi, tỉnh Lâm Đồng",
      name: "Nông trại Sinh thái Thuận Thiên và Cộng đồng Cao nguyên Lâm Đồng",
    },
    {
      locale: "en",
      location: "Suoi Dai village, Lam Dong",
      name: "RegenerativeCommunityFarmWithAnIntentionallyLongUnbrokenNameToken",
    },
  ] as const)(
    "keeps the full $locale farm name accessible while the card truncates visually",
    ({ locale, location, name }) => {
      const copy = getSiteContent(locale).tracker;
      const { container } = render(
        <TrackerPage copy={copy} farms={[farm(20, { name, location })]} />,
      );

      const cardTitle = screen.getByRole("heading", { level: 3, name });
      expect(cardTitle).toBeVisible();
      expect(cardTitle).toHaveTextContent(name);
      expect(cardTitle).toHaveAttribute("title", name);
      expect(screen.getByText(location)).toBeVisible();

      fireEvent.click(
        screen.getByRole("button", {
          name: copy.accessibility.farm.replace("{name}", name),
        }),
      );

      const dialogTitle = screen.getByRole("heading", { level: 2, name });
      const dialogBody = container.querySelector<HTMLElement>(
        ".farmer-dialog__body",
      );
      const dialogMedia = container.querySelector<HTMLElement>(
        ".farmer-dialog__media",
      );
      const dialogContent = container.querySelector<HTMLElement>(
        ".farmer-dialog__content",
      );
      expect(dialogTitle).toBeVisible();
      expect(dialogTitle).toHaveTextContent(name);
      expect(dialogTitle).not.toHaveAttribute("title");
      expect(dialogBody).toContainElement(dialogMedia);
      expect(dialogBody).toContainElement(dialogContent);
      expect(dialogMedia).toBeVisible();
      expect(dialogContent).toContainElement(dialogTitle);
    },
  );

  it("renders farm photos but keeps localized descriptions out of cards", () => {
    const image = {
      id: "image-1",
      url: "https://cdn.example.com/farms/green-farm.webp",
      width: 1200,
      height: 900,
      alt: "Green Farm in Da Lat",
      variants: [],
    };
    const { rerender } = render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { description: "A farm description.", image })]}
      />,
    );

    expect(screen.getByAltText(image.alt)).toHaveAttribute("src", image.url);
    expect(screen.queryByText("A farm description.")).not.toBeInTheDocument();

    rerender(
      <TrackerPage
        copy={getSiteContent("vi").tracker}
        farms={[
          farm(14, {
            description: "Mô tả nông trại bằng tiếng Việt.",
            image: null,
          }),
        ]}
      />,
    );
    expect(
      screen.queryByText("Mô tả nông trại bằng tiếng Việt."),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector(".tracker-avatar-fallback"),
    ).toBeInTheDocument();
  });

  it("falls back to the milestone icon when a farm image fails", () => {
    const image = {
      id: "image-1",
      url: "https://cdn.example.com/farms/broken.webp",
      width: 1200,
      height: 900,
      alt: "Broken farm photo",
      variants: [],
    };
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(20, { image })]}
      />,
    );

    fireEvent.error(screen.getByAltText(image.alt));

    expect(screen.queryByAltText(image.alt)).not.toBeInTheDocument();
    expect(
      document.querySelector(".tracker-avatar-fallback"),
    ).toHaveTextContent("🌳");
  });

  it("opens the dialog only from the localized detail trigger", () => {
    const copy = getSiteContent("en").tracker;
    const { container } = render(
      <TrackerPage copy={copy} farms={[farm(14)]} />,
    );

    const trigger = screen.getByRole("button", {
      name: "Growth details for Farm 14",
    });
    const card = container.querySelector(".fcard");
    const fieldFarm = container.querySelector(".tracker-field-scroll li");
    if (!card || !fieldFarm) throw new Error("Expected card and field farm");

    expect(card).not.toHaveAttribute("role");
    expect(card).not.toHaveAttribute("tabindex");
    expect(fieldFarm).not.toHaveAttribute("role");
    expect(fieldFarm).not.toHaveAttribute("tabindex");
    fireEvent.click(card);
    fireEvent.click(fieldFarm);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText(copy.farmerProfile)).toBeVisible();
    expect(within(dialog).getByText(copy.aboutFarmer)).toBeVisible();
    expect(
      within(dialog).getByText("A family farm growing with its community."),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: copy.closeFarmerDetails }),
    );

    expect(trigger).toHaveClass("detail-trigger");
    expect(trigger).toHaveAttribute("type", "button");
    expect(within(trigger).getByText("→")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("closes on Escape, backdrop, and close button while returning focus to the opener", async () => {
    const copy = getSiteContent("en").tracker;
    render(<TrackerPage copy={copy} farms={[farm(14)]} />);
    const card = screen.getByRole("button", {
      name: "Growth details for Farm 14",
    });

    fireEvent.click(card);
    const dialog = screen.getByRole("dialog");
    expect(document.body).toHaveClass("tracker-dialog-open");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(card).toHaveFocus());

    fireEvent.click(card);
    fireEvent.click(screen.getByRole("dialog"));
    await waitFor(() => expect(card).toHaveFocus());

    fireEvent.click(card);
    fireEvent.click(
      screen.getByRole("button", { name: copy.closeFarmerDetails }),
    );
    await waitFor(() => expect(card).toHaveFocus());
    expect(document.body).not.toHaveClass("tracker-dialog-open");
    expect(
      document.querySelector(".farmer-dialog-backdrop"),
    ).not.toBeInTheDocument();
  });

  it("omits narrow-screen primary media while retaining the full gallery", async () => {
    vi.stubGlobal("matchMedia", () => ({
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn(),
    }));
    const image = galleryImage(1);
    const { container } = render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { image, images: [image] })]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );

    await waitFor(() =>
      expect(container.querySelector(".farmer-dialog__media")).toBeNull(),
    );
    expect(container.querySelector(".farmer-gallery")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Open farm photo 1 of 1" }),
    ).toBeVisible();
  });

  it("uses the isolated custom dialog layer on narrow iOS without changing Android", async () => {
    vi.stubGlobal("matchMedia", () => ({
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("navigator", {
      maxTouchPoints: 5,
      platform: "iPhone",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
    });
    const image = galleryImage(1);
    const { container } = render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { image, images: [image] })]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );

    await waitFor(() =>
      expect(
        container.querySelector(".farmer-dialog-layer .farmer-dialog"),
      ).toBeVisible(),
    );
    expect(container.querySelector("dialog.farmer-dialog")).toBeNull();
    expect(container.querySelector(".farmer-gallery")).toBeVisible();
  });

  it("keeps long farmer descriptions in the dialog content region without changing media markup", () => {
    const copy = getSiteContent("en").tracker;
    const description = "A long description ".repeat(600);
    const { container } = render(
      <TrackerPage copy={copy} farms={[farm(14, { description })]} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );

    expect(
      container.querySelector(".farmer-dialog__description"),
    ).toHaveTextContent(/A long description/);
    expect(container.querySelector(".farmer-dialog__media")).toContainElement(
      container.querySelector(".farmer-dialog__fallback"),
    );
    expect(container.querySelector(".farmer-dialog__content")).toContainElement(
      container.querySelector(".farmer-dialog__description"),
    );
  });

  it.each([
    {
      locale: "en",
      name: "Long Copy Farm",
      description:
        "This farmer has cared for the land with the community for many seasons. ".repeat(
          160,
        ),
      trigger: "Growth details for Long Copy Farm",
    },
    {
      locale: "vi",
      name: "Nông trại Mô tả Dài",
      description:
        "Người nông dân này đã chăm sóc đất đai cùng cộng đồng qua nhiều mùa vụ. ".repeat(
          160,
        ),
      trigger: "Thông tin phát triển của Nông trại Mô tả Dài",
    },
  ] as const)(
    "keeps the $locale long description inside the About scroller while the gallery stays visible",
    ({ description, locale, name, trigger }) => {
      const image = galleryImage(1);
      const { container } = render(
        <TrackerPage
          copy={getSiteContent(locale).tracker}
          farms={[farm(14, { description, image, images: [image], name })]}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: trigger }));

      const aboutScroll = container.querySelector(
        ".farmer-dialog__about-scroll",
      );
      if (!(aboutScroll instanceof HTMLElement)) {
        throw new Error("Expected the About scroller to render");
      }
      expect(aboutScroll).toContainElement(
        container.querySelector(".farmer-dialog__description"),
      );
      expect(container.querySelector(".farmer-dialog__eyebrow")).toBeVisible();
      expect(container.querySelector(".farmer-dialog__name")).toBeVisible();
      expect(container.querySelector(".farmer-dialog__address")).toBeVisible();
      expect(
        container.querySelector(".farmer-dialog__about-label"),
      ).toBeVisible();
      expect(container.querySelector(".farmer-gallery")).toBeVisible();
    },
  );

  it("does not introduce overflow or fixed empty space for a short description", () => {
    const image = galleryImage(1);
    const { container } = render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[
          farm(14, {
            description: "A short farm description.",
            image,
            images: [image],
          }),
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );
    const aboutScroll = container.querySelector(".farmer-dialog__about-scroll");
    if (!(aboutScroll instanceof HTMLElement)) {
      throw new Error("Expected the About scroller to render");
    }

    expect(aboutScroll.scrollHeight).toBe(aboutScroll.clientHeight);
    expect(aboutScroll).not.toHaveAttribute("style");
    expect(container.querySelector(".farmer-gallery")).toBeVisible();
    expect(container.querySelector("dialog.farmer-dialog")).not.toHaveClass(
      "farmer-dialog--expand-about",
    );
  });

  it("uses only the exact v32 farmer dialog class hierarchy", () => {
    const image = galleryImage(1);
    const { container } = render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { image, images: [image] })]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );

    const dialog = container.querySelector("dialog.farmer-dialog");
    expect(dialog).not.toBeNull();
    expect(container.querySelector(".farmer-dialog-backdrop")).toBeVisible();
    if (!dialog) throw new Error("Expected the farmer dialog to render");
    expect(dialog).toHaveClass("farmer-dialog");
    expect(dialog).toContainElement(
      dialog?.querySelector(":scope > .farmer-dialog__close") ?? null,
    );
    const body = dialog?.querySelector(":scope > .farmer-dialog__body");
    const media = body?.querySelector(":scope > .farmer-dialog__media");
    const content = body?.querySelector(":scope > .farmer-dialog__content");
    const profile = content?.querySelector(":scope > .farmer-dialog__profile");
    expect(body).not.toBeNull();
    expect(media).toContainElement(
      media?.querySelector(":scope > .farmer-dialog__fallback") ?? null,
    );
    expect(media).toContainElement(
      media?.querySelector(":scope > .dialog-photo") ?? null,
    );
    expect(media).toContainElement(
      media?.querySelector(":scope > .dialog-photo-hint") ?? null,
    );
    expect(profile).toContainElement(
      profile?.querySelector(":scope > .farmer-dialog__eyebrow") ?? null,
    );
    expect(profile).toContainElement(
      profile?.querySelector(":scope > .farmer-dialog__name") ?? null,
    );
    expect(profile).toContainElement(
      profile?.querySelector(":scope > .farmer-dialog__address") ?? null,
    );
    const about = content?.querySelector(":scope > .farmer-dialog__about");
    expect(about).toContainElement(
      about?.querySelector(":scope > .farmer-dialog__about-label") ?? null,
    );
    const aboutScroll = about?.querySelector(
      ":scope > .farmer-dialog__about-scroll",
    );
    expect(aboutScroll).toContainElement(
      aboutScroll?.querySelector(":scope > .farmer-dialog__description") ??
        null,
    );
    expect(content).toContainElement(
      content?.querySelector(":scope > .farmer-gallery") ?? null,
    );

    const dialogClasses = [dialog, ...dialog.querySelectorAll("[class]")]
      .flatMap((element) => [...element.classList])
      .filter((className) => className.startsWith("tracker-dialog-"));
    expect(dialogClasses).toEqual([]);
  });

  it("uses localized Vietnamese farmer profile copy in the dialog", () => {
    const copy = getSiteContent("vi").tracker;
    render(
      <TrackerPage
        copy={copy}
        farms={[
          farm(14, {
            description: "Mô tả ngắn về nông trại.",
            location: "Đà Lạt",
            name: "Nông trại Xanh",
          }),
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Thông tin phát triển của Nông trại Xanh",
      }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      screen.getByRole("button", {
        name: "Thông tin phát triển của Nông trại Xanh",
      }),
    ).toBeVisible();
    expect(within(dialog).getByText("Thông tin nông trại")).toBeVisible();
    expect(within(dialog).getByText("Giới thiệu nông trại")).toBeVisible();
    expect(within(dialog).getByText("Mô tả ngắn về nông trại.")).toBeVisible();
  });

  it.each([
    ["en", "Farm photos", "View photo"],
    ["vi", "Ảnh nông trại", "Xem ảnh"],
  ] as const)(
    "renders localized one-photo dialog controls for %s without navigation",
    (locale, galleryLabel, viewPhoto) => {
      const image = galleryImage(1);
      const expectedCopy = localizedGalleryTestCopy[locale];
      render(
        <TrackerPage
          copy={getSiteContent(locale).tracker}
          farms={[farm(14, { image, images: [image] })]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: expectedCopy.trigger,
        }),
      );

      expect(screen.getByText(galleryLabel)).toBeVisible();
      const primary = screen.getByRole("button", { name: viewPhoto });
      expect(primary).toHaveClass("dialog-photo");
      expect(primary).toHaveAttribute("src", image.variants[1].url);
      fireEvent.click(primary);

      const lightbox = screen.getByRole("dialog", {
        name: expectedCopy.viewer,
      });
      expect(within(lightbox).getByRole("img")).toHaveAttribute(
        "src",
        image.url,
      );
      expect(
        lightbox.querySelector(".image-lightbox__nav--prev"),
      ).toHaveAttribute("hidden");
      expect(
        lightbox.querySelector(".image-lightbox__nav--next"),
      ).toHaveAttribute("hidden");
    },
  );

  it("opens the selected thumbnail and navigates with arrows", () => {
    const images = [galleryImage(1), galleryImage(2), galleryImage(3)];
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { image: images[0], images })]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );

    const secondThumbnail = screen.getByRole("button", {
      name: "Open farm photo 2 of 3",
    });
    expect(within(secondThumbnail).getByRole("presentation")).toHaveAttribute(
      "src",
      images[1].variants[0].url,
    );
    fireEvent.click(secondThumbnail);

    const lightbox = screen.getByRole("dialog", {
      name: "Farm photo viewer",
    });
    expect(within(lightbox).getByText("2 / 3")).toBeVisible();
    expect(within(lightbox).getByRole("img")).toHaveAttribute(
      "src",
      images[1].url,
    );

    fireEvent.keyDown(lightbox, { key: "ArrowRight" });
    expect(within(lightbox).getByText("3 / 3")).toBeVisible();
    fireEvent.keyDown(lightbox, { key: "ArrowLeft" });
    expect(within(lightbox).getByText("2 / 3")).toBeVisible();
  });

  it("swipes between photos at the 48px threshold and ignores mouse pointers", () => {
    const images = [galleryImage(1), galleryImage(2), galleryImage(3)];
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { image: images[0], images })]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "View photo" }));

    const lightbox = screen.getByRole("dialog", {
      name: "Farm photo viewer",
    });
    const stage = lightbox.querySelector(".image-lightbox__stage");
    expect(stage).not.toBeNull();

    fireEvent.pointerDown(stage!, { clientX: 200, pointerType: "touch" });
    fireEvent.pointerUp(stage!, { clientX: 153, pointerType: "touch" });
    expect(within(lightbox).getByText("1 / 3")).toBeVisible();

    fireEvent.pointerDown(stage!, { clientX: 200, pointerType: "touch" });
    fireEvent.pointerUp(stage!, { clientX: 152, pointerType: "touch" });
    expect(within(lightbox).getByText("2 / 3")).toBeVisible();

    fireEvent.pointerDown(stage!, { clientX: 100, pointerType: "touch" });
    fireEvent.pointerUp(stage!, { clientX: 148, pointerType: "touch" });
    expect(within(lightbox).getByText("1 / 3")).toBeVisible();

    fireEvent.pointerDown(stage!, { clientX: 200, pointerType: "mouse" });
    fireEvent.pointerUp(stage!, { clientX: 100, pointerType: "mouse" });
    expect(within(lightbox).getByText("1 / 3")).toBeVisible();
  });

  it("keeps the lightbox open on an active image failure and selects the nearest usable photo", () => {
    const images = [galleryImage(1), galleryImage(2), galleryImage(3)];
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { image: images[0], images })]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open farm photo 2 of 3" }),
    );

    const lightbox = screen.getByRole("dialog", {
      name: "Farm photo viewer",
    });
    fireEvent.error(within(lightbox).getByRole("img"));

    expect(lightbox).toBeVisible();
    expect(within(lightbox).getByRole("img")).toHaveAttribute(
      "src",
      images[2].url,
    );
    expect(within(lightbox).getByText("Farm 14")).toBeVisible();
    expect(within(lightbox).getByText("2 / 2")).toBeVisible();
    expect(
      lightbox.querySelector(".image-lightbox__nav--prev"),
    ).not.toHaveAttribute("hidden");
    expect(
      lightbox.querySelector(".image-lightbox__nav--next"),
    ).not.toHaveAttribute("hidden");
  });

  it("closes the lightbox and restores focus when every usable image fails", async () => {
    const images = [galleryImage(1), galleryImage(2)];
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { image: images[0], images })]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "View photo" }));

    const lightbox = screen.getByRole("dialog", {
      name: "Farm photo viewer",
    });
    fireEvent.error(within(lightbox).getByRole("img"));
    expect(within(lightbox).getByText("1 / 1")).toBeVisible();
    fireEvent.error(within(lightbox).getByRole("img"));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Farm photo viewer" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Close farm details" }),
    ).toHaveFocus();
    expect(screen.getByRole("dialog", { name: "Farm 14" })).toBeVisible();
  });

  it("closes only the lightbox and returns focus to its thumbnail", async () => {
    const images = [galleryImage(1), galleryImage(2)];
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(14, { image: images[0], images })]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 14" }),
    );
    const thumbnail = screen.getByRole("button", {
      name: "Open farm photo 2 of 2",
    });
    fireEvent.click(thumbnail);
    const lightbox = screen.getByRole("dialog", {
      name: "Farm photo viewer",
    });
    fireEvent.keyDown(lightbox, { key: "Escape" });
    await waitFor(() => expect(thumbnail).toHaveFocus());
    expect(screen.getByRole("dialog", { name: "Farm 14" })).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "Farm photo viewer" }),
    ).not.toBeInTheDocument();
  });

  it("opens the primary image by keyboard and falls back when every image fails", async () => {
    const images = [galleryImage(1), galleryImage(2)];
    const { container } = render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(20, { image: images[0], images })]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Growth details for Farm 20" }),
    );
    const primary = screen.getByRole("button", { name: "View photo" });
    fireEvent.keyDown(primary, { key: "Enter" });
    expect(
      screen.getByRole("dialog", { name: "Farm photo viewer" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }));
    await waitFor(() => expect(primary).toHaveFocus());

    fireEvent.error(primary);
    const nextPrimary = screen.getByRole("button", { name: "View photo" });
    fireEvent.error(nextPrimary);
    expect(
      screen.queryByRole("button", { name: "View photo" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Farm photos")).not.toBeInTheDocument();
    expect(
      container.querySelector(".farmer-dialog__fallback"),
    ).toHaveTextContent("🌳");
  });
});
