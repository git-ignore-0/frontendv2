import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReferralFloatingAction } from "@/components/referral-floating-action";
import { getSiteContent } from "@/content/site-content";

const navigation = vi.hoisted(() => ({ pathname: "/vi" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

afterEach(() => {
  cleanup();
  navigation.pathname = "/vi";
});

describe("referral floating action", () => {
  it("links public tabs to the localized referral page", () => {
    const label = getSiteContent("en").common.referralFab;
    render(<ReferralFloatingAction label={label} locale="en" />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      "/account/en/referral",
    );
  });

  it("stays hidden throughout the account area", () => {
    navigation.pathname = "/account/vi/points";
    const label = getSiteContent("vi").common.referralFab;
    render(<ReferralFloatingAction label={label} locale="vi" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
