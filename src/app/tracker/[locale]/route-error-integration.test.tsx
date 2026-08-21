import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as retryTrackerFarms } from "@/app/api/tracker-farms/route";
import TrackerRoute from "./page";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const recoveredFarm = {
  id: "recovered-farm",
  name: "Recovered Farm",
  location: "Da Lat",
  description: "",
  image: null,
  signup_count: 14,
  sort_order: 0,
};

const successfulResponse = {
  ok: true,
  json: async () => ({ data: [recoveredFarm] }),
};

async function expectTrackerErrorAndRecovery(
  fetchMock: ReturnType<typeof vi.fn>,
) {
  vi.stubGlobal("fetch", fetchMock);
  render(await TrackerRoute({ params: Promise.resolve({ locale: "en" }) }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "We could not load the farm tracker",
  );
  expect(screen.queryByText("No farms to show yet")).not.toBeInTheDocument();

  const retryResponse = await retryTrackerFarms(
    new Request("http://localhost/api/tracker-farms?locale=en&retry=nonce"),
  );

  expect(retryResponse.status).toBe(200);
  await expect(retryResponse.json()).resolves.toEqual({
    data: [recoveredFarm],
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls[1][1]).toEqual({ cache: "no-store" });
}

describe("tracker route API failures", () => {
  it.each([
    [
      "network failure",
      () =>
        vi
          .fn()
          .mockRejectedValueOnce(new Error("offline"))
          .mockResolvedValueOnce(successfulResponse),
    ],
    [
      "non-success response",
      () =>
        vi
          .fn()
          .mockResolvedValueOnce({ ok: false, status: 503 })
          .mockResolvedValueOnce(successfulResponse),
    ],
    [
      "invalid payload",
      () =>
        vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [{ id: "invalid" }] }),
          })
          .mockResolvedValueOnce(successfulResponse),
    ],
  ])(
    "renders an error for a %s and recovers through a fresh retry request",
    async (_name, createFetchMock) => {
      await expectTrackerErrorAndRecovery(createFetchMock());
    },
  );
});
