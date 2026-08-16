import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CsaRoute, { generateMetadata } from "@/app/csa/[locale]/page";
import { accountApi } from "@/features/account/api";

vi.mock("@/features/account/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/account/api")>();
  return { ...actual, accountApi: vi.fn() };
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
      "FAQ",
    ],
    [
      "vi",
      "Thực phẩm tươi mỗi tuần, cùng nông dân vun bồi một tương lai tốt hơn.",
      "Câu hỏi thường gặp",
    ],
  ] as const)("renders the %s CSA page", async (locale, title, faqTitle) => {
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

  it.each([
    ["en", "Community Supported Agriculture"],
    ["vi", "Nông nghiệp cộng đồng"],
  ] as const)("keeps the %s CSA metadata title", async (locale, title) => {
    await expect(
      generateMetadata({ params: Promise.resolve({ locale }) }),
    ).resolves.toEqual({ title });
  });
});
