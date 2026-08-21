import {
  cleanup,
  fireEvent,
  render,
  screen,
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
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
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

    const card = screen.getByRole("article");
    expect(
      within(card).getByText(label, { selector: ".tracker-stage-badge span" }),
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
    expect(
      within(screen.getByRole("article")).getByText("/ 30 signups"),
    ).toBeVisible();
    for (const tick of ["0", "10", "20", "30"]) {
      expect(
        within(screen.getByRole("article")).getByText(tick),
      ).toBeInTheDocument();
    }
  });

  it("shows next-milestone guidance and the completed leader state", () => {
    const { rerender } = render(
      <TrackerPage copy={getSiteContent("en").tracker} farms={[farm(29)]} />,
    );
    const nextSignup = screen.getByText("1 more signup");
    expect(nextSignup).toBeVisible();
    expect(nextSignup.tagName).toBe("STRONG");

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
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
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
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
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
});
