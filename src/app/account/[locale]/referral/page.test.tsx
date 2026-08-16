import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({
  publicSiteOrigin: () => "https://site.example.test",
}));

import AccountReferralRoute from "@/app/account/[locale]/referral/page";

describe("account referral route", () => {
  it("normalizes a valid referral query without looking it up", async () => {
    const element = await AccountReferralRoute({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        ref: "nfv2345678",
        returnTo: "/workshops/en",
      }),
    });

    expect(element.props.pendingReferralCode).toBe("NFV2345678");
    expect(element.props.returnTo).toBe("/workshops/en");
  });

  it.each(["invalid", "NFV23456I8"])(
    "ignores an invalid referral query: %s",
    async (ref) => {
      const element = await AccountReferralRoute({
        params: Promise.resolve({ locale: "vi" }),
        searchParams: Promise.resolve({ ref }),
      });

      expect(element.props.pendingReferralCode).toBeUndefined();
    },
  );
});
