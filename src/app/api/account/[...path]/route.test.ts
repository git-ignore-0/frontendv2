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
    expect(accountUpstreamTarget(["redemptions", redemptionId], "GET")?.path).toBe(
      `/api/v1/referrals/redemptions/${redemptionId}`,
    );
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
});
