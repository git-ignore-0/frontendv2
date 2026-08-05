import { describe, expect, it, vi } from "vitest";

import LegacyStorePage from "@/app/[locale]/store/page";

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => navigation);

describe("legacy Store route", () => {
  it.each(["en", "vi"] as const)(
    "permanently redirects /%s/store to the canonical route",
    async (locale) => {
      await LegacyStorePage({ params: Promise.resolve({ locale }) });

      expect(navigation.permanentRedirect).toHaveBeenCalledWith(
        `/store/${locale}`,
      );
    },
  );
});
