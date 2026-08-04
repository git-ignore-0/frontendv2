import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));

import MembershipRoute from "@/app/account/[locale]/membership/page";
import AccountPointsRoute from "@/app/account/[locale]/points/page";

type RouteGateElement = {
  props: { returnPath: string };
};

describe("level-one AccountRouteGate continuations", () => {
  it.each([
    [AccountPointsRoute, "points"],
    [MembershipRoute, "membership"],
  ])("preserves validated returnTo for %s", async (route, segment) => {
    const element = (await route({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ returnTo: "/workshops/en" }),
    })) as RouteGateElement;

    expect(element.props.returnPath).toBe(
      `/account/en/${segment}?returnTo=%2Fworkshops%2Fen`,
    );
  });

  it.each([
    [AccountPointsRoute, "https://outside.example/path"],
    [MembershipRoute, "/workshops/%E0%A4%A"],
  ])(
    "sanitizes invalid returnTo before passing it to AccountRouteGate",
    async (route, returnTo) => {
      const element = (await route({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ returnTo }),
      })) as RouteGateElement;

      expect(element.props.returnPath).toMatch(
        /^\/account\/en\/(?:points|membership)\?returnTo=%2Fen$/,
      );
      expect(element.props.returnPath).not.toContain("outside.example");
      expect(element.props.returnPath).not.toContain("%E0%A4%A");
    },
  );
});
