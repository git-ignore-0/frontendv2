import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkshopDetail } from "@/features/workshops/workshop-detail-page";
import type { PublicWorkshop } from "@/lib/content-api";

function workshop(registrationUrl: string | null): PublicWorkshop {
  return {
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
    status: "upcoming",
    registration_url: registrationUrl,
    title: "Đất sống",
    summary: "Workshop thực hành",
    body: { type: "doc", content: [{ type: "paragraph" }] },
  };
}

describe("workshop registration action", () => {
  it("does not show a registration action when no URL was configured", () => {
    const { container } = render(
      <WorkshopDetail workshop={workshop(null)} locale="vi" preview />,
    );

    expect(
      within(container).queryByRole("link", { name: /đăng ký/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the registration action when registration is open and has a URL", () => {
    const { container } = render(
      <WorkshopDetail
        workshop={workshop("https://forms.example.com/register")}
        locale="vi"
        preview
      />,
    );

    for (const link of within(container).getAllByRole("link", {
      name: /đăng ký/i,
    })) {
      expect(link).toHaveAttribute(
        "href",
        "https://forms.example.com/register",
      );
    }
  });

  it("does not show registration after the workshop has ended", () => {
    const { container } = render(
      <WorkshopDetail
        workshop={{
          ...workshop("https://forms.example.com/register"),
          status: "completed",
        }}
        locale="vi"
        preview
      />,
    );

    expect(
      within(container).queryByRole("link", { name: /đăng ký/i }),
    ).not.toBeInTheDocument();
  });
});
