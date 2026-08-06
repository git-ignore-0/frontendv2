import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import TestimonialsRoute from "@/app/testimonials/[locale]/page";

afterEach(cleanup);

describe("canonical Testimonials route", () => {
  it.each([
    ["en", "Stories from farms and tables"],
    ["vi", "Câu chuyện từ nông trại và bàn ăn"],
  ] as const)("renders /testimonials/%s", async (locale, heading) => {
    render(await TestimonialsRoute({ params: Promise.resolve({ locale }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
  });
});
