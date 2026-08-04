import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkshopCard } from "@/features/workshops/workshop-card";
import type { PublicWorkshop } from "@/lib/content-api";

const workshop: PublicWorkshop = {
  id: "workshop-id",
  slug: "living-soil",
  requested_locale: "vi",
  content_locale: "vi",
  available_locales: ["vi"],
  is_fallback: false,
  default_locale: "vi",
  start_at: "2026-08-10T02:00:00Z",
  end_at: "2026-08-10T07:00:00Z",
  event_timezone: "Asia/Ho_Chi_Minh",
  status: "ongoing",
  registration_url: null,
  title: "Đất sống",
  summary: "Workshop thực hành",
};

describe("workshop card", () => {
  it("shows its status, local date tile, title and detail link", () => {
    const { container } = render(
      <WorkshopCard workshop={workshop} locale="vi" />,
    );

    expect(screen.getByText("Đang diễn ra")).toBeInTheDocument();
    expect(container.querySelector(".workshop-date-day")).toHaveTextContent(
      "10",
    );
    expect(container.querySelector(".workshop-date-month")).toHaveTextContent(
      "8",
    );
    expect(screen.getByRole("link", { name: "Đất sống" })).toHaveAttribute(
      "href",
      "/workshops/living-soil/vi",
    );
    expect(screen.getByRole("link", { name: "Xem chi tiết" })).toHaveAttribute(
      "href",
      "/workshops/living-soil/vi",
    );
  });

  it("keeps the fallback note visible", () => {
    render(
      <WorkshopCard workshop={{ ...workshop, is_fallback: true }} locale="vi" />,
    );

    expect(
      screen.getByText("Nội dung này hiện chỉ có bằng tiếng Anh."),
    ).toBeInTheDocument();
  });

  it("renders the responsive calendar row without changing the detail href", () => {
    const { container } = render(
      <WorkshopCard
        workshop={workshop}
        locale="vi"
        titleTag="h4"
        calendar
      />,
    );

    expect(container.querySelector("article")).toHaveClass(
      "workshop-calendar-card",
    );
    const desktopStatus = container.querySelector(".workshop-meta-status");
    const mobileStatus = container.querySelector(".workshop-date-status");
    expect(desktopStatus).toHaveTextContent("Đang diễn ra");
    expect(mobileStatus).toBeInTheDocument();
    expect(mobileStatus).toHaveTextContent("Đang diễn ra");
    expect(container.querySelector(".workshop-date-day")).toHaveTextContent(
      "10",
    );
    expect(container.querySelector(".workshop-date-month")).toHaveTextContent(
      "Tháng 8",
    );
    const title = within(container).getByRole("heading", { level: 4 });
    expect(title).toHaveTextContent("Đất sống");
    expect(within(title).getByRole("link", { name: "Đất sống" })).toHaveAttribute(
      "href",
      "/workshops/living-soil/vi",
    );
    expect(
      within(container).getByRole("link", { name: "Xem chi tiết" }),
    ).toHaveAttribute("href", "/workshops/living-soil/vi");
  });
});
