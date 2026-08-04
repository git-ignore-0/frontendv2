import { describe, expect, it } from "vitest";

import { accountUpstreamTarget } from "@/features/account/bff-path";

const redemptionId = "22222222-2222-4222-8222-222222222222";

describe("account BFF allowlist", () => {
  it("maps only the account endpoints used by the public frontend", () => {
    expect(accountUpstreamTarget(["rewards"], "GET")?.path).toBe(
      "/api/v1/public/rewards",
    );
    expect(accountUpstreamTarget(["rewards"], "GET")?.requiresSession).toBe(
      false,
    );
    expect(accountUpstreamTarget(["redemptions"], "GET")?.path).toBe(
      "/api/v1/referrals/redemptions",
    );
    expect(accountUpstreamTarget(["redemptions"], "GET")?.requiresSession).toBe(
      true,
    );
    expect(
      accountUpstreamTarget(["redemptions", redemptionId], "GET")?.path,
    ).toBe(`/api/v1/referrals/redemptions/${redemptionId}`);
  });

  it("rejects arbitrary paths and malformed redemption identifiers", () => {
    expect(accountUpstreamTarget(["admin", "redemptions"], "GET")).toBeNull();
    expect(
      accountUpstreamTarget(["redemptions", "not-a-uuid"], "GET"),
    ).toBeNull();
    expect(
      accountUpstreamTarget(["redemptions", redemptionId, "reject"], "POST"),
    ).toBeNull();
  });

  it("restricts each route to the backend method it needs", () => {
    expect(accountUpstreamTarget(["rewards"], "POST")).toBeNull();
    expect(accountUpstreamTarget(["account"], "POST")).toBeNull();
    expect(accountUpstreamTarget(["submit-code"], "GET")).toBeNull();
    expect(accountUpstreamTarget(["submit-code"], "POST")?.path).toBe(
      "/api/v1/referrals/submit-code",
    );
    expect(accountUpstreamTarget(["redemptions"], "POST")?.path).toBe(
      "/api/v1/referrals/redemptions",
    );
    expect(
      accountUpstreamTarget(["redemptions", redemptionId], "POST"),
    ).toBeNull();
  });

  it("allowlists only the exact Membership endpoints and methods", () => {
    expect(accountUpstreamTarget(["membership-packages"], "GET")).toEqual({
      path: "/api/v1/public/membership-packages",
      requiresSession: false,
    });
    expect(
      accountUpstreamTarget(["membership-payment-availability"], "GET"),
    ).toEqual({
      path: "/api/v1/public/membership-payment-availability",
      requiresSession: false,
    });
    expect(accountUpstreamTarget(["memberships", "requests"], "GET")).toEqual({
      path: "/api/v1/memberships/requests",
      requiresSession: true,
    });
    expect(accountUpstreamTarget(["memberships", "requests"], "POST")).toEqual({
      path: "/api/v1/memberships/requests",
      requiresSession: true,
    });
    expect(accountUpstreamTarget(["memberships", "current"], "GET")?.path).toBe(
      "/api/v1/memberships/current",
    );
    expect(accountUpstreamTarget(["memberships", "quota"], "GET")?.path).toBe(
      "/api/v1/memberships/quota",
    );
    expect(accountUpstreamTarget(["memberships", "usage"], "GET")?.path).toBe(
      "/api/v1/memberships/usage",
    );
    expect(
      accountUpstreamTarget(
        ["memberships", "requests", redemptionId, "payment-submitted"],
        "POST",
      ),
    ).toEqual({
      path: `/api/v1/memberships/requests/${redemptionId}/payment-submitted`,
      requiresSession: true,
    });
    expect(accountUpstreamTarget(["membership-packages"], "POST")).toBeNull();
    expect(
      accountUpstreamTarget(["membership-payment-availability"], "POST"),
    ).toBeNull();
    expect(accountUpstreamTarget(["memberships", "quota"], "POST")).toBeNull();
    expect(
      accountUpstreamTarget(
        ["memberships", "requests", "not-a-uuid", "payment-submitted"],
        "POST",
      ),
    ).toBeNull();
    expect(
      accountUpstreamTarget(
        ["memberships", "requests", redemptionId, "approve"],
        "POST",
      ),
    ).toBeNull();
  });
});
