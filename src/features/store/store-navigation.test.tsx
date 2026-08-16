import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/site-footer";
import { getSiteContent } from "@/content/site-content";
import Home from "@/features/pages/home-page";
import type { PublicSiteSettings } from "@/lib/content-api";

const contentApi = vi.hoisted(() => ({
  getSiteSettings: vi.fn(),
  getWorkshops: vi.fn(),
}));

vi.mock("@/lib/content-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content-api")>();
  return {
    ...actual,
    getSiteSettings: contentApi.getSiteSettings,
    getWorkshops: contentApi.getWorkshops,
  };
});

const emptySettings: PublicSiteSettings = {
  email: "",
  is_email_enabled: false,
  phone_display: "",
  is_phone_enabled: false,
  links: [],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Store navigation", () => {
  it("keeps the footer Store link internal when the backend Store URL is missing", () => {
    render(<SiteFooter locale="en" settings={emptySettings} />);

    const storeLink = screen.getByRole("link", { name: "Store" });
    expect(storeLink).toHaveAttribute("href", "/store/en");
    expect(storeLink).not.toHaveAttribute("target");
    expect(storeLink).not.toHaveAttribute("rel");

    expect(screen.getByRole("link", { name: "CSA" })).toHaveAttribute(
      "href",
      "/csa/en",
    );
  });

  it("keeps the Home Store CTA internal when the backend Store URL is missing", async () => {
    contentApi.getSiteSettings.mockResolvedValue(emptySettings);
    contentApi.getWorkshops.mockResolvedValue([]);

    render(await Home({ params: Promise.resolve({ locale: "vi" }) }));

    expect(
      screen.getByRole("link", {
        name: getSiteContent("vi").home.storeCta,
      }),
    ).toHaveAttribute("href", "/store/vi");
  });

  it("keeps Forum external without making Store depend on its backend setting", () => {
    render(
      <SiteFooter
        locale="vi"
        settings={{
          ...emptySettings,
          links: [
            {
              id: 1,
              kind: "forum",
              label: "Forum",
              url: "https://forum.example.com",
              position: 1,
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Cửa hàng" })).toHaveAttribute(
      "href",
      "/store/vi",
    );
    const forumLink = screen.getByRole("link", {
      name: /Diễn đàn/,
    });
    expect(forumLink).toHaveAttribute("href", "https://forum.example.com");
    expect(forumLink).toHaveAttribute("target", "_blank");
    expect(forumLink).toHaveAttribute("rel", "noreferrer");
  });
});
