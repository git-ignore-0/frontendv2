import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

import CSAPurchaseEntry from "@/app/csa/purchase/page";
import CSAContractTrackerEntry from "@/app/csa/track/page";
import { defaultLocale, localizedPath } from "@/lib/i18n";

describe("CSA default-locale entry routes", () => {
  beforeEach(() => redirect.mockClear());

  it("redirects purchase to the configured default locale", async () => {
    await CSAPurchaseEntry({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenCalledWith(
      localizedPath(defaultLocale, "/csa/purchase"),
    );
  });

  it("redirects tracker to the configured default locale", async () => {
    await CSAContractTrackerEntry({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenCalledWith(
      localizedPath(defaultLocale, "/csa/track"),
    );
  });

  it.each([
    ["purchase", CSAPurchaseEntry, "/csa/purchase"],
    ["tracker", CSAContractTrackerEntry, "/csa/track"],
  ] as const)("preserves query parameters for %s", async (_, entry, path) => {
    await entry({
      searchParams: Promise.resolve({
        reference: "CSA-ABC123",
        source: ["qr", "email"],
      }),
    });

    expect(redirect).toHaveBeenCalledWith(
      `${localizedPath(defaultLocale, path)}?reference=CSA-ABC123&source=qr&source=email`,
    );
  });
});
