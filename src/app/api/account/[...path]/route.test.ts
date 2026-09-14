import { describe, expect, it } from "vitest";

import { accountUpstreamTarget } from "@/features/account/bff-path";

const redemptionId = "22222222-2222-4222-8222-222222222222";

describe("account BFF allowlist", () => {
  it("maps only the account endpoints used by the public frontend", () => {
    expect(accountUpstreamTarget(["rewards"], "GET")?.path).toBe(
      "/api/v1/public/rewards",
    );
    expect(accountUpstreamTarget(["rewards"], "GET")?.session).toBe("none");
    expect(accountUpstreamTarget(["redemptions"], "GET")?.path).toBe(
      "/api/v1/referrals/redemptions",
    );
    expect(accountUpstreamTarget(["redemptions"], "GET")?.session).toBe(
      "required",
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
    const membershipId = "44444444-4444-4444-8444-444444444444";
    expect(accountUpstreamTarget(["membership-packages"], "GET")).toEqual({
      path: "/api/v1/public/membership-packages",
      session: "none",
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
    expect(accountUpstreamTarget(["membership-packages"], "POST")).toBeNull();
    expect(
      accountUpstreamTarget(["membership-payment-availability"], "POST"),
    ).toBeNull();
    expect(
      accountUpstreamTarget(["membership-payment-availability"], "GET"),
    ).toBeNull();
    expect(
      accountUpstreamTarget(["memberships", "requests"], "GET"),
    ).toBeNull();
    expect(
      accountUpstreamTarget(["memberships", "requests"], "POST"),
    ).toBeNull();
    expect(accountUpstreamTarget(["memberships", "quota"], "POST")).toBeNull();
    expect(
      accountUpstreamTarget(["memberships", membershipId, "contract"], "GET"),
    ).toEqual({
      path: `/api/v1/memberships/${membershipId}/contract`,
      session: "required",
      query: "membership-contract",
    });
    expect(
      accountUpstreamTarget(
        ["memberships", membershipId, "contract", "pdf"],
        "GET",
      ),
    ).toEqual({
      path: `/api/v1/memberships/${membershipId}/contract/pdf`,
      session: "required",
      query: "contract-pdf",
    });
    expect(
      accountUpstreamTarget(["memberships", "not-a-uuid", "contract"], "GET"),
    ).toBeNull();
    expect(
      accountUpstreamTarget(
        ["memberships", membershipId, "contract", "original"],
        "GET",
      ),
    ).toBeNull();
    expect(
      accountUpstreamTarget(["memberships", membershipId, "contract"], "POST"),
    ).toBeNull();
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

  it("allowlists only the public CSA purchase and administrative-unit contracts", () => {
    expect(accountUpstreamTarget(["administrative-provinces"], "GET")).toEqual({
      path: "/api/v1/administrative-units/provinces",
      session: "none",
    });
    expect(accountUpstreamTarget(["administrative-wards"], "GET")).toEqual({
      path: "/api/v1/administrative-units/wards",
      session: "none",
    });
    expect(accountUpstreamTarget(["csa-purchase-requests"], "POST")).toEqual({
      path: "/api/v1/public/csa-purchase-requests",
      session: "optional",
    });
    expect(accountUpstreamTarget(["csa-payment-quotes"], "POST")).toEqual({
      path: "/api/v1/public/csa-payment-quotes",
      session: "optional",
      query: "none",
    });
    expect(
      accountUpstreamTarget(
        ["csa-purchase-requests", "confirm-transfer"],
        "POST",
      ),
    ).toEqual({
      path: "/api/v1/public/csa-purchase-requests/confirm-transfer",
      session: "optional",
      query: "none",
    });
    expect(
      accountUpstreamTarget(
        ["csa-purchase-requests", redemptionId, "confirm-payment"],
        "POST",
      ),
    ).toEqual({
      path: `/api/v1/public/csa-purchase-requests/${redemptionId}/confirm-payment`,
      session: "optional",
    });
    expect(accountUpstreamTarget(["csa-purchase-requests"], "GET")).toBeNull();
    expect(
      accountUpstreamTarget(
        ["csa-purchase-requests", "not-a-uuid", "confirm-payment"],
        "POST",
      ),
    ).toBeNull();
  });

  it("allowlists only the exact CSA contract tracker routes and methods", () => {
    expect(
      accountUpstreamTarget(["csa-contract-tracker", "lookup"], "POST"),
    ).toEqual({
      path: "/api/v1/public/csa-contract-tracker/lookup",
      session: "none",
      trackerCookie: true,
    });
    expect(
      accountUpstreamTarget(["csa-contract-tracker", "contract"], "GET"),
    ).toEqual({
      path: "/api/v1/public/csa-contract-tracker/contract",
      session: "none",
      trackerCookie: true,
    });
    expect(
      accountUpstreamTarget(["csa-contract-tracker", "contract", "pdf"], "GET"),
    ).toEqual({
      path: "/api/v1/public/csa-contract-tracker/contract/pdf",
      session: "none",
      trackerCookie: true,
    });
    expect(
      accountUpstreamTarget(["csa-contract-tracker", "lookup"], "GET"),
    ).toBeNull();
    expect(
      accountUpstreamTarget(
        ["csa-contract-tracker", "contract", "pdf", "secret"],
        "GET",
      ),
    ).toBeNull();
    expect(
      accountUpstreamTarget(
        ["csa-contract-tracker", "contract", "not-pdf"],
        "GET",
      ),
    ).toBeNull();
  });

  it("allowlists only GET for public CSA contract verification", () => {
    expect(accountUpstreamTarget(["csa-contracts", "verify"], "GET")).toEqual({
      path: "/api/v1/public/csa-contracts/verify",
      session: "none",
      query: "contract-reference",
    });
    expect(
      accountUpstreamTarget(["csa-contracts", "verify"], "POST"),
    ).toBeNull();
    expect(accountUpstreamTarget(["csa-contracts"], "GET")).toBeNull();
    expect(
      accountUpstreamTarget(["csa-contracts", "verify", "pdf"], "GET"),
    ).toBeNull();
  });
});
