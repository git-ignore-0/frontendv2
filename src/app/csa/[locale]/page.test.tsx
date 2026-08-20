import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CsaRoute, { generateMetadata } from "@/app/csa/[locale]/page";
import { accountApi } from "@/features/account/api";
import { farmsUrlFromSettings, getSiteSettings } from "@/lib/content-api";

vi.mock("@/features/account/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/account/api")>();
  return { ...actual, accountApi: vi.fn() };
});
vi.mock("@/lib/content-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content-api")>();
  return {
    ...actual,
    farmsUrlFromSettings: vi.fn(),
    getSiteSettings: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("canonical CSA route", () => {
  it("rejects an unsupported locale", async () => {
    await expect(
      CsaRoute({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow();
  });

  it.each([
    [
      "en",
      "Fresh food each week, supporting farmers for a better future.",
      "Ordering FAQ",
    ],
    [
      "vi",
      "Thực phẩm tươi mỗi tuần, cùng nông dân vun bồi một tương lai tốt hơn.",
      "Câu Hỏi Thường Gặp Về Đặt Hàng",
    ],
  ] as const)("renders the %s CSA page", async (locale, title, faqTitle) => {
    vi.mocked(getSiteSettings).mockResolvedValue({
      email: "",
      is_email_enabled: false,
      phone_display: "",
      is_phone_enabled: false,
      links: [],
    });
    vi.mocked(farmsUrlFromSettings).mockReturnValue(undefined);
    vi.mocked(accountApi).mockResolvedValue({
      data: [],
      meta: { page: 1, page_size: 30, total: 0 },
    });

    render(await CsaRoute({ params: Promise.resolve({ locale }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: faqTitle })).toBeVisible();
  });

  it.each(["en", "vi"] as const)(
    "passes the configured farms URL to the %s page",
    async (locale) => {
      const settings = {
        email: "",
        is_email_enabled: false,
        phone_display: "",
        is_phone_enabled: false,
        links: [],
      };
      vi.mocked(getSiteSettings).mockResolvedValue(settings);
      vi.mocked(farmsUrlFromSettings).mockReturnValue(
        "https://farms.example.com/visit",
      );

      const result = await CsaRoute({
        params: Promise.resolve({ locale }),
      });

      expect(getSiteSettings).toHaveBeenCalledWith(locale);
      expect(farmsUrlFromSettings).toHaveBeenCalledWith(settings);
      expect(result.props.farmsUrl).toBe("https://farms.example.com/visit");
      expect(result.props.locale).toBe(locale);
    },
  );

  it.each([
    ["en", "Community Supported Agriculture"],
    ["vi", "Nông nghiệp cộng đồng"],
  ] as const)("keeps the %s CSA metadata title", async (locale, title) => {
    await expect(
      generateMetadata({ params: Promise.resolve({ locale }) }),
    ).resolves.toEqual({ title });
  });
});
