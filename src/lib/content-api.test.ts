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

function trackerFarmPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Green Farm",
    location: "Da Lat",
    description: "A family farm.",
    image: {
      id: "22222222-2222-4222-8222-222222222222",
      url: "https://cdn.example.com/farms/green-farm.webp",
      width: 1200,
      height: 900,
      alt: "Green Farm in Da Lat",
    },
    signup_count: 14,
    one_month_signup_count: 4,
    sort_order: 2,
    ...overrides,
  };
}

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
            trackerFarmPayload({
              id:
                locale === "en"
                  ? "11111111-1111-4111-8111-111111111111"
                  : "33333333-3333-4333-8333-333333333333",
              name: locale === "en" ? "Green Farm" : "Nông trại Xanh",
              location: locale === "en" ? "Da Lat" : "Đà Lạt",
              description:
                locale === "en" ? "A family farm." : "Nông trại gia đình.",
              image: {
                id: "22222222-2222-4222-8222-222222222222",
                url: "https://cdn.example.com/farms/green-farm.webp",
                width: 1200,
                height: 900,
                alt:
                  locale === "en"
                    ? "Green Farm in Da Lat"
                    : "Nông trại Xanh ở Đà Lạt",
              },
            }),
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
          id:
            locale === "en"
              ? "11111111-1111-4111-8111-111111111111"
              : "33333333-3333-4333-8333-333333333333",
          name: locale === "en" ? "Green Farm" : "Nông trại Xanh",
          location: locale === "en" ? "Da Lat" : "Đà Lạt",
          description:
            locale === "en" ? "A family farm." : "Nông trại gia đình.",
          image: {
            id: "22222222-2222-4222-8222-222222222222",
            url: "https://cdn.example.com/farms/green-farm.webp",
            width: 1200,
            height: 900,
            alt:
              locale === "en"
                ? "Green Farm in Da Lat"
                : "Nông trại Xanh ở Đà Lạt",
            variants: [],
          },
          images: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              url: "https://cdn.example.com/farms/green-farm.webp",
              width: 1200,
              height: 900,
              alt:
                locale === "en"
                  ? "Green Farm in Da Lat"
                  : "Nông trại Xanh ở Đà Lạt",
              variants: [],
            },
          ],
          signup_count: 14,
          one_month_signup_count: 4,
          sort_order: 2,
        },
      ]);
    },
  );

  it.each([
    ["missing", undefined],
    ["null", null],
  ])("falls back to zero when the one-month count is %s", async (_, value) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [trackerFarmPayload({ one_month_signup_count: value })],
        }),
      }),
    );

    const [result] = await getTrackerFarms("en");

    expect(result.one_month_signup_count).toBe(0);
  });

  it("parses an ordered tracker gallery with responsive variants", async () => {
    const first = {
      id: "22222222-2222-4222-8222-222222222222",
      url: "https://cdn.example.com/farms/first.webp",
      width: 1600,
      height: 1200,
      alt: "Green Farm",
      variants: [
        {
          url: "https://cdn.example.com/farms/first-480.webp",
          width: 480,
          height: 360,
        },
        {
          url: "https://cdn.example.com/farms/first-960.webp",
          width: 960,
          height: 720,
        },
      ],
    };
    const second = {
      ...first,
      id: "33333333-3333-4333-8333-333333333333",
      url: "https://cdn.example.com/farms/second.webp",
      variants: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [trackerFarmPayload({ image: first, images: [first, second] })],
        }),
      }),
    );

    await expect(getTrackerFarmsResult("en")).resolves.toEqual({
      ok: true,
      farms: [
        expect.objectContaining({ image: first, images: [first, second] }),
      ],
    });
  });

  it("normalizes a legacy tracker image into a one-photo gallery", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [trackerFarmPayload()] }),
      }),
    );

    const result = await getTrackerFarmsResult("en");
    expect(result).toEqual({
      ok: true,
      farms: [
        expect.objectContaining({
          image: expect.objectContaining({ variants: [] }),
          images: [expect.objectContaining({ variants: [] })],
        }),
      ],
    });
  });

  it("rejects an invalid image inside the tracker gallery", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            trackerFarmPayload({
              images: [
                {
                  id: "bad-gallery-image",
                  url: "https://cdn.example.com/farms/bad.webp",
                  width: 1200,
                  height: 900,
                  alt: "Bad image",
                  variants: [{ width: 480, height: 360 }],
                },
              ],
            }),
          ],
        }),
      }),
    );

    await expect(getTrackerFarmsResult("en")).resolves.toEqual({ ok: false });
  });

  it("rejects a new gallery image without variants", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            trackerFarmPayload({
              images: [
                {
                  id: "gallery-image-without-variants",
                  url: "https://cdn.example.com/farms/gallery.webp",
                  width: 1200,
                  height: 900,
                  alt: "Green Farm",
                },
              ],
            }),
          ],
        }),
      }),
    );

    await expect(getTrackerFarmsResult("en")).resolves.toEqual({ ok: false });
  });

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

  it.each([
    ["null", null],
    ["missing", undefined],
  ])(
    "normalizes a %s tracker description to an empty string",
    async (_case, description) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            data: [trackerFarmPayload({ description, image: null })],
          }),
        }),
      );

      await expect(getTrackerFarmsResult("en")).resolves.toEqual({
        ok: true,
        farms: [expect.objectContaining({ description: "", image: null })],
      });
    },
  );

  it.each([
    [
      "a missing image field",
      {
        id: "22222222-2222-4222-8222-222222222222",
        width: 1200,
        height: 900,
        alt: "Green Farm",
      },
    ],
    [
      "an invalid image id",
      {
        id: 42,
        url: "https://cdn.example.com/farms/green-farm.webp",
        width: 1200,
        height: 900,
        alt: "Green Farm",
      },
    ],
    [
      "an invalid image URL",
      {
        id: "22222222-2222-4222-8222-222222222222",
        url: "not-a-url",
        width: 1200,
        height: 900,
        alt: "Green Farm",
      },
    ],
    [
      "an invalid image width",
      {
        id: "22222222-2222-4222-8222-222222222222",
        url: "https://cdn.example.com/farms/green-farm.webp",
        width: 0,
        height: 900,
        alt: "Green Farm",
      },
    ],
    [
      "an invalid image height",
      {
        id: "22222222-2222-4222-8222-222222222222",
        url: "https://cdn.example.com/farms/green-farm.webp",
        width: 1200,
        height: -1,
        alt: "Green Farm",
      },
    ],
  ])("rejects a tracker payload with %s", async (_case, image) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [trackerFarmPayload({ image })],
        }),
      }),
    );

    await expect(getTrackerFarmsResult("en")).resolves.toEqual({ ok: false });
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
