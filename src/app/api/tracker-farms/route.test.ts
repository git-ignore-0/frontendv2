import { afterEach, describe, expect, it, vi } from "vitest";

const contentApi = vi.hoisted(() => ({
  getTrackerFarmsResult: vi.fn(),
}));

vi.mock("@/lib/content-api", () => contentApi);

import { GET } from "./route";

afterEach(() => vi.clearAllMocks());

describe("tracker retry proxy", () => {
  it("rejects unsupported locales without calling the backend", async () => {
    const response = await GET(
      new Request("http://localhost/api/tracker-farms?locale=fr&retry=nonce"),
    );

    expect(response.status).toBe(400);
    expect(contentApi.getTrackerFarmsResult).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", "http://localhost/api/tracker-farms?locale=en"],
    ["empty", "http://localhost/api/tracker-farms?locale=en&retry="],
  ])(
    "rejects a %s retry nonce without calling the backend",
    async (_case, url) => {
      const response = await GET(new Request(url));

      expect(response.status).toBe(400);
      expect(contentApi.getTrackerFarmsResult).not.toHaveBeenCalled();
    },
  );

  it("uses a request-level cache bypass and returns validated farms", async () => {
    const farm = {
      id: "farm-1",
      name: "Green Farm",
      location: "Da Lat",
      signup_count: 14,
      sort_order: 0,
    };
    contentApi.getTrackerFarmsResult.mockResolvedValue({
      ok: true,
      farms: [farm],
    });

    const response = await GET(
      new Request("http://localhost/api/tracker-farms?locale=en&retry=nonce"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(contentApi.getTrackerFarmsResult).toHaveBeenCalledWith("en", {
      bypassCache: true,
    });
    await expect(response.json()).resolves.toEqual({ data: [farm] });
  });

  it("returns a non-cacheable failure without invalidating shared data", async () => {
    contentApi.getTrackerFarmsResult.mockResolvedValue({ ok: false });

    const response = await GET(
      new Request("http://localhost/api/tracker-farms?locale=vi&retry=nonce"),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
