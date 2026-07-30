export type AccountUpstreamTarget = {
  path: string;
  requiresSession: boolean;
};

export function accountUpstreamTarget(
  path: string[],
  method: "GET" | "POST",
): AccountUpstreamTarget | null {
  if (path.length === 1) {
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
  if (
    method === "GET" &&
    path.length === 2 &&
    path[0] === "redemptions" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      path[1],
    )
  ) {
    return {
      path: `/api/v1/referrals/redemptions/${path[1]}`,
      requiresSession: true,
    };
  }
  return null;
}
