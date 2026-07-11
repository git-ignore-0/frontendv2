import { expect, test } from "@playwright/test";

const internalRoutes = [
  "/en",
  "/en/about",
  "/en/plants",
  "/en/animals",
  "/vi",
  "/vi/about",
  "/vi/plants",
  "/vi/animals",
];

for (const route of internalRoutes) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("store link is external and points to Farmbrite", async ({
  page,
  isMobile,
}) => {
  await page.goto("/vi");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  const link = page
    .getByRole("link", { name: /Cửa hàng.*mở trong tab mới/i })
    .first();
  await expect(link).toHaveAttribute(
    "href",
    "https://store.farmbrite.com/store/nntn",
  );
  await expect(link).toHaveAttribute("target", "_blank");
});

test("mobile menu opens, closes with Escape and returns focus", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile navigation behavior");
  await page.goto("/vi");
  const trigger = page.getByRole("button", { name: "Menu" });
  await trigger.click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).not.toBeVisible();
});

test("workshop and commerce UI are absent", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: /workshop/i })).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /add to cart|checkout|đăng nhập|giỏ hàng/i,
    }),
  ).toHaveCount(0);
  await expect(page.locator("form")).toHaveCount(0);
});

test("language switch keeps the corresponding route", async ({ page }) => {
  await page.goto("/en/plants");
  await page.getByRole("link", { name: /Language: Tiếng Việt/i }).click();
  await expect(page).toHaveURL(/\/vi\/plants$/);
  await expect(page.locator("h1")).toContainText("Nuôi đất");
});
