import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import StoreRoute from "@/app/store/[locale]/page";

afterEach(cleanup);

describe("canonical Store route", () => {
  it.each([
    ["en", "Shop Natural Farming Vietnam"],
    ["vi", "Cửa hàng Natural Farming Vietnam"],
  ] as const)(
    "renders /store/%s with its translated heading",
    async (locale, heading) => {
      render(await StoreRoute({ params: Promise.resolve({ locale }) }));

      expect(
        screen.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
    },
  );
});
