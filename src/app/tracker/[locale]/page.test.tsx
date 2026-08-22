import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TrackerRoute, { generateMetadata } from "./page";
import {
  getTrackerFarmsResult,
  type PublicTrackerFarm,
} from "@/lib/content-api";

const retryControls = vi.hoisted(() => ({
  fetch: vi.fn(),
}));

vi.mock("@/lib/content-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content-api")>();
  return { ...actual, getTrackerFarmsResult: vi.fn() };
});

const farm: PublicTrackerFarm = {
  id: "farm-1",
  name: "Green Valley Farm",
  location: "Da Lat",
  description: "",
  image: null,
  signup_count: 14,
  sort_order: 0,
};

const localizedFarm = {
  en: { name: "Green Valley Farm", location: "Da Lat" },
  vi: { name: "Nông trại Thung Lũng Xanh", location: "Đà Lạt" },
} as const;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("tracker route", () => {
  it("rejects unsupported locales", async () => {
    await expect(
      TrackerRoute({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow();
  });

  it.each([
    ["en", "From Seed to Harvest — CSA Growth Tracker"],
    ["vi", "Từ hạt giống đến mùa thu hoạch — Hành trình phát triển CSA"],
  ] as const)(
    "renders /tracker/%s with localized copy",
    async (locale, title) => {
      vi.mocked(getTrackerFarmsResult).mockResolvedValue({
        ok: true,
        farms: [{ ...farm, ...localizedFarm[locale] }],
      });

      render(await TrackerRoute({ params: Promise.resolve({ locale }) }));

      expect(getTrackerFarmsResult).toHaveBeenCalledWith(locale);
      expect(
        screen.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
    },
  );

  it.each([
    ["en", "From Seed to Harvest — CSA Growth Tracker"],
    ["vi", "Từ hạt giống đến mùa thu hoạch — Hành trình phát triển CSA"],
  ] as const)("uses the localized %s metadata", async (locale, title) => {
    await expect(
      generateMetadata({ params: Promise.resolve({ locale }) }),
    ).resolves.toEqual(
      expect.objectContaining({
        title,
        description: expect.any(String),
      }),
    );
  });

  it("renders the safe empty state when the API helper returns no farms", async () => {
    vi.mocked(getTrackerFarmsResult).mockResolvedValue({
      ok: true,
      farms: [],
    });

    render(await TrackerRoute({ params: Promise.resolve({ locale: "en" }) }));

    expect(screen.getByText("No farms to show yet")).toBeVisible();
    expect(
      screen.queryByRole("list", { name: /farm growth details/i }),
    ).not.toBeInTheDocument();
  });

  it("renders an API failure as an error instead of an empty database", async () => {
    vi.mocked(getTrackerFarmsResult).mockResolvedValue({ ok: false });

    render(await TrackerRoute({ params: Promise.resolve({ locale: "en" }) }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not load the farm tracker",
    );
    expect(screen.queryByText("No farms to show yet")).not.toBeInTheDocument();
  });

  it("bypasses the request cache on retry and can recover from an API failure", async () => {
    vi.mocked(getTrackerFarmsResult).mockResolvedValue({ ok: false });
    retryControls.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [farm] }),
    });
    vi.stubGlobal("fetch", retryControls.fetch);
    render(await TrackerRoute({ params: Promise.resolve({ locale: "en" }) }));

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(retryControls.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/tracker-farms\?locale=en&retry=\d+$/),
        { cache: "no-store" },
      );
      expect(screen.getByRole("heading", { name: farm.name })).toBeVisible();
    });

    expect(getTrackerFarmsResult).toHaveBeenCalledTimes(1);
  });

  it("keeps the localized error state when the retry proxy payload is invalid", async () => {
    vi.mocked(getTrackerFarmsResult).mockResolvedValue({ ok: false });
    retryControls.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "invalid" }] }),
    });
    vi.stubGlobal("fetch", retryControls.fetch);
    render(await TrackerRoute({ params: Promise.resolve({ locale: "vi" }) }));

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    await waitFor(() => {
      expect(retryControls.fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Không thể tải hành trình nông trại",
      );
    });
    expect(
      screen.queryByRole("button", {
        name: /Thông tin phát triển của Nông trại/i,
      }),
    ).not.toBeInTheDocument();
  });
});
