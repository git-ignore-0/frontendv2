import { describe, expect, it, vi } from "vitest";

import LegacyTestimonialsPage from "@/app/[locale]/testimonials/page";

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => navigation);

describe("legacy Testimonials route", () => {
  it.each(["en", "vi"] as const)(
    "permanently redirects /%s/testimonials to the canonical route",
    async (locale) => {
      await LegacyTestimonialsPage({ params: Promise.resolve({ locale }) });

      expect(navigation.permanentRedirect).toHaveBeenCalledWith(
        `/testimonials/${locale}`,
      );
    },
  );
});
