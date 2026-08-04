import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => navigation);

import AccountRedemptionDetailRoute from "@/app/account/[locale]/redemptions/[id]/page";

beforeEach(() => {
  vi.clearAllMocks();
  navigation.redirect.mockImplementation((href: string) => {
    throw new Error(`redirect:${href}`);
  });
  navigation.notFound.mockImplementation(() => {
    throw new Error("not-found");
  });
});

describe("legacy redemption detail route", () => {
  it.each(["en", "vi"])(
    "redirects the old %s detail URL to redemption history",
    async (locale) => {
      await expect(
        AccountRedemptionDetailRoute({
          params: Promise.resolve({ locale, id: "redemption-id" }),
        }),
      ).rejects.toThrow(`redirect:/account/${locale}/redemptions`);
      expect(navigation.redirect).toHaveBeenCalledWith(
        `/account/${locale}/redemptions`,
      );
    },
  );

  it("keeps invalid locales on the existing not-found path", async () => {
    await expect(
      AccountRedemptionDetailRoute({
        params: Promise.resolve({ locale: "fr", id: "redemption-id" }),
      }),
    ).rejects.toThrow("not-found");
    expect(navigation.redirect).not.toHaveBeenCalled();
  });
});
