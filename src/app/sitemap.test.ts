import { describe, expect, it, vi } from "vitest";

import sitemap from "@/app/sitemap";
import { siteConfig } from "@/config/site";

const contentApi = vi.hoisted(() => ({ getWorkshops: vi.fn() }));

vi.mock("@/lib/content-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content-api")>();
  return { ...actual, getWorkshops: contentApi.getWorkshops };
});

describe("sitemap", () => {
  it("uses only canonical CSA URLs and language alternates", async () => {
    contentApi.getWorkshops.mockResolvedValue([]);

    const entries = await sitemap();
    const csaEntries = entries.filter((entry) => entry.url.includes("/csa/"));

    expect(csaEntries).toEqual([
      expect.objectContaining({
        url: `${siteConfig.url}/csa/en`,
        alternates: {
          languages: {
            en: `${siteConfig.url}/csa/en`,
            vi: `${siteConfig.url}/csa/vi`,
          },
        },
      }),
      expect.objectContaining({
        url: `${siteConfig.url}/csa/vi`,
        alternates: {
          languages: {
            en: `${siteConfig.url}/csa/en`,
            vi: `${siteConfig.url}/csa/vi`,
          },
        },
      }),
    ]);
    expect(entries.map((entry) => entry.url)).not.toContain(
      `${siteConfig.url}/en/csa`,
    );
    expect(entries.map((entry) => entry.url)).not.toContain(
      `${siteConfig.url}/vi/csa`,
    );
  });
});
