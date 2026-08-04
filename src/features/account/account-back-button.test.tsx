import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/content/site-content";
import {
  AccountBackButton,
  accountBackFallbacks,
} from "@/features/account/account-presentation";

const navigation = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));
const copy = getSiteContent("en").account;

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/account/en/invited");
  Object.defineProperty(window.history, "length", {
    configurable: true,
    value: 1,
  });
  Object.defineProperty(document, "referrer", {
    configurable: true,
    value: "",
  });
});

afterEach(cleanup);

describe("level-two account back navigation", () => {
  it("keeps the explicit parent route for every level-two page", () => {
    expect(accountBackFallbacks("en")).toEqual({
      invited: "/account/en/referral",
      redemptions: "/account/en/rewards",
      membershipUsage: "/account/en/membership",
    });
  });

  it.each([
    [copy.invitedBack, "/account/en/referral"],
    [copy.backToRewards, "/account/en/rewards"],
    [copy.backToMembership, "/account/en/membership"],
  ])("replaces with %s's explicit parent", (label, fallbackHref) => {
    render(
      <AccountBackButton fallbackHref={fallbackHref} label={label} showLabel />,
    );

    fireEvent.click(screen.getByRole("button", { name: label }));

    expect(navigation.replace).toHaveBeenCalledWith(fallbackHref);
    expect(navigation.back).not.toHaveBeenCalled();
  });
});
