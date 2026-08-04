import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => navigation);

import AccountRoute from "@/app/account/[locale]/page";

beforeEach(() => {
  vi.clearAllMocks();
  navigation.redirect.mockImplementation((href: string) => {
    throw new Error(`redirect:${href}`);
  });
  navigation.notFound.mockImplementation(() => {
    throw new Error("not-found");
  });
});

describe("account root route", () => {
  it.each([
    ["en", "/en"],
    ["vi", "/vi"],
  ])("redirects /account/%s to its localized home", async (locale, home) => {
    await expect(
      AccountRoute({ params: Promise.resolve({ locale }) }),
    ).rejects.toThrow(`redirect:${home}`);
    expect(navigation.redirect).toHaveBeenCalledWith(home);
  });

  it("keeps invalid locales on the existing not-found path", async () => {
    await expect(
      AccountRoute({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("not-found");
    expect(navigation.redirect).not.toHaveBeenCalled();
  });
});
