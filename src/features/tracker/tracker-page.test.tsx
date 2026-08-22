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
  return {
    id: `farm-${signupCount}`,
    name: `Farm ${signupCount}`,
    location: "Da Lat",
    description: "A family farm growing with its community.",
    image: null,
    signup_count: signupCount,
    sort_order: signupCount,
    ...overrides,
  };
}

afterEach(cleanup);

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

  it("calculates farm, cumulative signup, and leader stats", () => {
    render(
      <TrackerPage
        copy={getSiteContent("en").tracker}
        farms={[farm(9), farm(10), farm(29), farm(30)]}
      />,
    );

    expect(
      screen.getByText("FARMERS IN THE GROUP").previousSibling,
    ).toHaveTextContent("4");
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
      name: /Farm 14: 14 total signups/i,
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
    expect(within(card).getByText("/ 30 signups")).toBeVisible();
    for (const tick of ["0", "10", "20", "30"]) {
      expect(within(card).getByText(tick)).toBeInTheDocument();
    }
  });

  it("shows next-milestone guidance and the completed leader state", () => {
    const { rerender } = render(
      <TrackerPage copy={getSiteContent("en").tracker} farms={[farm(29)]} />,
    );
    const nextSignup = screen.getByText("1 more signup");
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

  it("renders zero stats and no farm grid in the empty state", () => {
    render(<TrackerPage copy={getSiteContent("en").tracker} farms={[]} />);

    expect(screen.getAllByText("0")).toHaveLength(3);
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

  it("keeps long Vietnamese farm identity visible for CSS wrapping", () => {
    const name = "Nông trại Sinh thái Thuận Thiên và Cộng đồng Cao nguyên";
    const location = "Thôn Suối Dài, xã miền núi có tên rất dài, tỉnh Lâm Đồng";
    render(
      <TrackerPage
        copy={getSiteContent("vi").tracker}
        farms={[farm(20, { name, location })]}
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name })).toBeVisible();
    expect(screen.getByText(location)).toBeVisible();
    expect(
      screen
        .getByRole("heading", { level: 3, name })
        .closest(".tracker-farm-heading"),
    ).not.toBeNull();
  });

  it("renders farm photos but keeps localized descriptions out of cards", () => {
    const image = {
      id: "image-1",
      url: "https://cdn.example.com/farms/green-farm.webp",
      width: 1200,
      height: 900,
      alt: "Green Farm in Da Lat",
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
      container.querySelector(".tracker-dialog-description"),
    ).toHaveTextContent(/A long description/);
    expect(container.querySelector(".tracker-dialog-media")).toContainElement(
      container.querySelector(".tracker-dialog-fallback"),
    );
    expect(container.querySelector(".tracker-dialog-content")).toContainElement(
      container.querySelector(".tracker-dialog-description"),
    );
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
    expect(within(dialog).getByText("Hồ sơ nông trại")).toBeVisible();
    expect(
      within(dialog).getByText("Giới thiệu về nông trại này"),
    ).toBeVisible();
    expect(within(dialog).getByText("Mô tả ngắn về nông trại.")).toBeVisible();
  });
});
