import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/share/ref/[code]/opengraph-image/route";
import { getSiteContent } from "@/content/site-content";
import { referralOpenGraphImageCopy } from "@/features/referrals/referral-share-content";

describe("referral Open Graph image", () => {
  it.each(["en", "vi"] as const)(
    "renders a public localized %s image without referral-code text",
    async (locale) => {
      const code = "NFV2345678";
      const response = await GET(
        new NextRequest(
          `https://www.naturalfarmingvietnam.com/share/ref/${code}/opengraph-image?locale=${locale}`,
        ),
        { params: Promise.resolve({ code }) },
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
      expect(response.headers.get("cache-control")).toBe(
        "public, max-age=86400, immutable",
      );
      const imageCopy = referralOpenGraphImageCopy(locale);
      expect(imageCopy.title).toBe(
        getSiteContent(locale).referralShareLanding.title,
      );
      expect(Object.values(imageCopy).join(" ")).not.toContain(code);
    },
  );

  it("returns 404 for an invalid referral code", async () => {
    const response = await GET(
      new NextRequest(
        "https://www.naturalfarmingvietnam.com/share/ref/invalid/opengraph-image?locale=en",
      ),
      { params: Promise.resolve({ code: "invalid" }) },
    );

    expect(response.status).toBe(404);
  });
});
