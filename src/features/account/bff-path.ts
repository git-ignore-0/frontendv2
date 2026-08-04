export type AccountUpstreamTarget = {
  path: string;
  requiresSession: boolean;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function accountUpstreamTarget(
  path: string[],
  method: "GET" | "POST",
): AccountUpstreamTarget | null {
  if (path.length === 1) {
    if (path[0] === "membership-packages" && method === "GET")
      return {
        path: "/api/v1/public/membership-packages",
        requiresSession: false,
      };
    if (path[0] === "membership-payment-availability" && method === "GET")
      return {
        path: "/api/v1/public/membership-payment-availability",
        requiresSession: false,
      };
    if (path[0] === "rewards" && method === "GET")
      return { path: "/api/v1/public/rewards", requiresSession: false };
    if (
      ["account", "invited-users", "points"].includes(path[0]) &&
      method === "GET"
    ) {
      return {
        path: `/api/v1/referrals/${path[0]}`,
        requiresSession: true,
      };
    }
    if (path[0] === "submit-code" && method === "POST")
      return {
        path: "/api/v1/referrals/submit-code",
        requiresSession: true,
      };
    if (path[0] === "redemptions")
      return {
        path: "/api/v1/referrals/redemptions",
        requiresSession: true,
      };
  }
  if (path.length === 2 && path[0] === "memberships") {
    if (path[1] === "requests")
      return { path: "/api/v1/memberships/requests", requiresSession: true };
    if (method === "GET" && ["current", "quota", "usage"].includes(path[1])) {
      return {
        path: `/api/v1/memberships/${path[1]}`,
        requiresSession: true,
      };
    }
  }
  if (
    method === "POST" &&
    path.length === 4 &&
    path[0] === "memberships" &&
    path[1] === "requests" &&
    uuidPattern.test(path[2]) &&
    path[3] === "payment-submitted"
  ) {
    return {
      path: `/api/v1/memberships/requests/${path[2]}/payment-submitted`,
      requiresSession: true,
    };
  }
  if (
    method === "GET" &&
    path.length === 2 &&
    path[0] === "redemptions" &&
    uuidPattern.test(path[1])
  ) {
    return {
      path: `/api/v1/referrals/redemptions/${path[1]}`,
      requiresSession: true,
    };
  }
  return null;
}
