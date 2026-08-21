import { afterEach, describe, expect, it, vi } from "vitest";

import {
  contentApiOrigin,
  farmsUrlFromSettings,
  getFeaturedTestimonials,
  getSiteSettings,
  getTestimonial,
  getTrackerFarms,
  getTrackerFarmsResult,
  getWorkshopPreview,
  getWorkshops,
  linkFromSettings,
  type PublicSiteSettings,
  type PublicWorkshop,
} from "./content-api";

const settings: PublicSiteSettings = {
  email: "contact@example.com",
  is_email_enabled: true,
  phone_display: "",
  is_phone_enabled: false,
  links: [
    {
      id: 1,
      kind: "forum",
      label: "Forum",
      url: "https://forum.example.com",
      position: 1,
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("content API", () => {
  it("validates the configured backend origin", () => {
    vi.stubEnv("CONTENT_API_ORIGIN", "https://auth.naturalfarmingvietnam.com/");
    expect(contentApiOrigin()).toBe("https://auth.naturalfarmingvietnam.com");

    vi.stubEnv(
      "CONTENT_API_ORIGIN",
      "https://auth.naturalfarmingvietnam.com/api",
    );
    expect(() => contentApiOrigin()).toThrow(/origin/i);
  });

  it("requires an explicit backend origin in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CONTENT_API_ORIGIN", "");

    await expect(getSiteSettings("vi")).rejects.toThrow(
      /required in production/i,
    );
  });

  it("does not resurrect a link omitted by the settings API", () => {
    expect(linkFromSettings(settings, "forum")).toBe(
      "https://forum.example.com",
    );
    expect(linkFromSettings(settings, "store")).toBeUndefined();
  });

  it("returns only a valid HTTP(S) farms URL", () => {
    expect(farmsUrlFromSettings(settings)).toBeUndefined();
    const withFarms = (url: string): PublicSiteSettings => ({
      ...settings,
      links: [
        ...settings.links,
        {
          id: 2,
          kind: "farms",
          label: "See our farms",
          url,
          position: 2,
        },
      ],
    });

    expect(farmsUrlFromSettings(withFarms("https://farms.example.com"))).toBe(
      "https://farms.example.com",
    );
    expect(
      farmsUrlFromSettings(withFarms("ftp://farms.example.com")),
    ).toBeUndefined();
    expect(farmsUrlFromSettings(withFarms("not a URL"))).toBeUndefined();
  });

  it("loads every workshop page", async () => {
    const workshop = { id: "workshop" } as PublicWorkshop;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: Array(50).fill(workshop),
          meta: { page: 1, page_size: 50, total: 51 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [workshop],
          meta: { page: 2, page_size: 50, total: 51 },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getWorkshops("vi", "past");

    expect(result).toHaveLength(51);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("page=2");
  });

  it.each(["en", "vi"] as const)(
    "loads and parses the public tracker contract for %s",
    async (locale) => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: `farm-${locale}`,
              name: locale === "en" ? "Green Farm" : "Nông trại Xanh",
              location: locale === "en" ? "Da Lat" : "Đà Lạt",
              signup_count: 14,
              sort_order: 2,
              is_visible: true,
            },
          ],
        }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await getTrackerFarms(locale);

      expect(fetchMock).toHaveBeenCalledWith(
        `http://127.0.0.1:8000/api/v1/public/tracker-farms?locale=${locale}`,
        expect.objectContaining({
          next: { tags: ["tracker-farms"], revalidate: 300 },
        }),
      );
      expect(result).toEqual([
        {
          id: `farm-${locale}`,
          name: locale === "en" ? "Green Farm" : "Nông trại Xanh",
          location: locale === "en" ? "Da Lat" : "Đà Lạt",
          signup_count: 14,
          sort_order: 2,
        },
      ]);
    },
  );

  it("returns an empty tracker list for an empty API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      }),
    );

    await expect(getTrackerFarms("en")).resolves.toEqual([]);
  });

  it("distinguishes a successful empty tracker response from failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      }),
    );

    await expect(getTrackerFarmsResult("en")).resolves.toEqual({
      ok: true,
      farms: [],
    });
  });

  it("returns a tracker failure result for network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(getTrackerFarmsResult("vi")).resolves.toEqual({ ok: false });
  });

  it("returns a tracker failure result for non-success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(getTrackerFarmsResult("en")).resolves.toEqual({ ok: false });
  });

  it("returns a tracker failure result for an invalid payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "invalid" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getTrackerFarmsResult("en", { bypassCache: true }),
    ).resolves.toEqual({ ok: false });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/public/tracker-farms?locale=en",
      { cache: "no-store" },
    );
  });

  it("continues to surface tracker origin configuration errors", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CONTENT_API_ORIGIN", "");

    await expect(getTrackerFarmsResult("en")).rejects.toThrow(
      /required in production/i,
    );
  });

  it("fails safely when the tracker API or payload is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(getTrackerFarms("vi")).resolves.toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: "invalid" }] }),
      }),
    );
    await expect(getTrackerFarms("en")).resolves.toEqual([]);
  });

  it("encodes a preview token exactly once", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "preview" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getWorkshopPreview("revision%3Atimestamp%3Asignature", "vi");

    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain(
      "revision%3Atimestamp%3Asignature?locale=vi",
    );
    expect(requestedUrl).not.toContain("%253A");
  });

  it("fails closed instead of restoring hidden contact details when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await getSiteSettings("vi");

    expect(result.email).toBe("");
    expect(result.phone_display).toBe("");
    expect(result.is_email_enabled).toBe(false);
    expect(result.is_phone_enabled).toBe(false);
    expect(result.links).toEqual([]);
  });

  it("surfaces featured testimonial failures so the proxy can return 502", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(getFeaturedTestimonials("vi")).rejects.toThrow(/503/);
  });

  it("returns null only for a missing testimonial detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    await expect(getTestimonial("missing", "en")).resolves.toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );
    await expect(getTestimonial("unavailable", "en")).rejects.toThrow(/502/);
  });
});
