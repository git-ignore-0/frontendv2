export type AccountUpstreamTarget = {
  path: string;
  session: "none" | "optional" | "required";
  trackerCookie?: boolean;
  query?: "contract-reference" | "membership-contract" | "contract-pdf";
};

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function accountUpstreamTarget(
  path: string[],
  method: "GET" | "POST",
): AccountUpstreamTarget | null {
  if (path.length === 1) {
    if (path[0] === "membership-packages" && method === "GET")
      return {
        path: "/api/v1/public/membership-packages",
        session: "none",
      };
    if (path[0] === "csa-purchase-requests" && method === "POST")
      return {
        path: "/api/v1/public/csa-purchase-requests",
        session: "optional",
      };
    if (path[0] === "administrative-provinces" && method === "GET")
      return {
        path: "/api/v1/administrative-units/provinces",
        session: "none",
      };
    if (path[0] === "administrative-wards" && method === "GET")
      return {
        path: "/api/v1/administrative-units/wards",
        session: "none",
      };
    if (path[0] === "rewards" && method === "GET")
      return { path: "/api/v1/public/rewards", session: "none" };
    if (
      ["account", "invited-users", "points"].includes(path[0]) &&
      method === "GET"
    ) {
      return {
        path: `/api/v1/referrals/${path[0]}`,
        session: "required",
      };
    }
    if (path[0] === "submit-code" && method === "POST")
      return {
        path: "/api/v1/referrals/submit-code",
        session: "required",
      };
    if (path[0] === "redemptions")
      return {
        path: "/api/v1/referrals/redemptions",
        session: "required",
      };
  }
  if (
    method === "GET" &&
    path.length === 2 &&
    path[0] === "csa-contracts" &&
    path[1] === "verify"
  ) {
    return {
      path: "/api/v1/public/csa-contracts/verify",
      session: "none",
      query: "contract-reference",
    };
  }
  if (
    method === "GET" &&
    path.length === 3 &&
    path[0] === "memberships" &&
    uuidPattern.test(path[1]) &&
    path[2] === "contract"
  ) {
    return {
      path: `/api/v1/memberships/${path[1]}/contract`,
      session: "required",
      query: "membership-contract",
    };
  }
  if (
    method === "GET" &&
    path.length === 4 &&
    path[0] === "memberships" &&
    uuidPattern.test(path[1]) &&
    path[2] === "contract" &&
    path[3] === "pdf"
  ) {
    return {
      path: `/api/v1/memberships/${path[1]}/contract/pdf`,
      session: "required",
      query: "contract-pdf",
    };
  }
  if (
    method === "POST" &&
    path.length === 2 &&
    path[0] === "csa-contract-tracker" &&
    path[1] === "lookup"
  ) {
    return {
      path: "/api/v1/public/csa-contract-tracker/lookup",
      session: "none",
      trackerCookie: true,
    };
  }
  if (
    method === "GET" &&
    path.length === 2 &&
    path[0] === "csa-contract-tracker" &&
    path[1] === "contract"
  ) {
    return {
      path: "/api/v1/public/csa-contract-tracker/contract",
      session: "none",
      trackerCookie: true,
    };
  }
  if (
    method === "GET" &&
    path.length === 3 &&
    path[0] === "csa-contract-tracker" &&
    path[1] === "contract" &&
    path[2] === "pdf"
  ) {
    return {
      path: "/api/v1/public/csa-contract-tracker/contract/pdf",
      session: "none",
      trackerCookie: true,
    };
  }
  if (path.length === 2 && path[0] === "memberships") {
    if (method === "GET" && ["current", "quota", "usage"].includes(path[1])) {
      return {
        path: `/api/v1/memberships/${path[1]}`,
        session: "required",
      };
    }
  }
  if (
    method === "GET" &&
    path.length === 2 &&
    path[0] === "redemptions" &&
    uuidPattern.test(path[1])
  ) {
    return {
      path: `/api/v1/referrals/redemptions/${path[1]}`,
      session: "required",
    };
  }
  if (
    method === "POST" &&
    path.length === 3 &&
    path[0] === "csa-purchase-requests" &&
    uuidPattern.test(path[1]) &&
    path[2] === "confirm-payment"
  ) {
    return {
      path: `/api/v1/public/csa-purchase-requests/${path[1]}/confirm-payment`,
      session: "optional",
    };
  }
  return null;
}
