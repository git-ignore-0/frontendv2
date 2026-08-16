import { describe, expect, it, vi } from "vitest";

import LegacyCsaPage from "@/app/[locale]/csa/page";

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => navigation);

describe("legacy CSA route", () => {
  it.each(["en", "vi"] as const)(
    "permanently redirects /%s/csa to the canonical route",
    async (locale) => {
      await LegacyCsaPage({ params: Promise.resolve({ locale }) });

      expect(navigation.permanentRedirect).toHaveBeenCalledWith(
        `/csa/${locale}`,
      );
    },
  );
});
