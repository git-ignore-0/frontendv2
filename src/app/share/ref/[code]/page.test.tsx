import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => navigation);
vi.mock("@/lib/auth/config", () => ({
  publicSiteOrigin: () => "https://www.naturalfarmingvietnam.com",
}));

import ReferralShareLanding, {
  generateMetadata,
} from "@/app/share/ref/[code]/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("public referral share landing", () => {
  it.each([
    [
      "en",
      "Naturally grown food, shared with care.",
      "Discover naturally grown food from Natural Farming Vietnam, where every purchase helps support and train the next generation of Vietnamese farmers.",
      "Explore Natural Farming Vietnam",
    ],
    [
      "vi",
      "Nông sản thuận tự nhiên, sẻ chia bằng sự quan tâm.",
      "Khám phá nông sản được canh tác tự nhiên từ Natural Farming Vietnam, nơi mỗi lần mua hàng góp phần hỗ trợ và đào tạo thế hệ nông dân Việt Nam tiếp theo.",
      "Khám phá Natural Farming Vietnam",
    ],
  ] as const)(
    "renders localized %s content, direct CTA, and crawler metadata",
    async (locale, title, description, cta) => {
      const props = routeProps("nfv2345678", locale);
      render(await ReferralShareLanding(props));

      expect(
        screen.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      expect(screen.getByRole("link", { name: cta })).toHaveAttribute(
        "href",
        `/ref/NFV2345678?locale=${locale}`,
      );

      const metadata = await generateMetadata(props);
      const openGraph = metadata.openGraph as {
        title: string;
        description: string;
        url: string;
        type: string;
        images: Array<{ url: string; alt: string }>;
      };
      const twitter = metadata.twitter as {
        card: string;
        images: string[];
      };
      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(description);
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(openGraph).toMatchObject({
        title,
        description,
        type: "website",
        url: `https://www.naturalfarmingvietnam.com/share/ref/NFV2345678?locale=${locale}`,
      });
      expect(openGraph.images[0].url).toBe(
        `https://www.naturalfarmingvietnam.com/share/ref/NFV2345678/opengraph-image?locale=${locale}`,
      );
      expect(openGraph.images[0].alt).toBeTruthy();
      expect(twitter.card).toBe("summary_large_image");
      expect(twitter.images).toEqual([openGraph.images[0].url]);
    },
  );

  it("returns notFound for an invalid referral-code format", async () => {
    await expect(
      ReferralShareLanding(routeProps("NFV23456I8", "en")),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(navigation.notFound).toHaveBeenCalledOnce();
  });

  it("stays public and server-rendered without account calls or redirects", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const source = readFileSync(
      resolve("src/app/share/ref/[code]/page.tsx"),
      "utf8",
    );

    render(await ReferralShareLanding(routeProps("NFV2345678", "en")));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/accountApi|useAccountSummary/u);
    expect(source).not.toMatch(/\bredirect\s*\(/u);
  });
});

function routeProps(code: string, locale: string) {
  return {
    params: Promise.resolve({ code }),
    searchParams: Promise.resolve({ locale }),
  };
}
