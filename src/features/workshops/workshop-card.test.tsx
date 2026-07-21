import { render, screen } from "@testing-library/react";
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
  it("shows the status supplied by the backend", () => {
    render(<WorkshopCard workshop={workshop} locale="vi" />);

    expect(screen.getByText("Đang diễn ra")).toBeInTheDocument();
  });
});
