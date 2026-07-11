import { expect, test } from "@playwright/test";

const internalRoutes = [
  "/en",
  "/about/en",
  "/plants/en",
  "/animals/en",
  "/vi",
  "/about/vi",
  "/plants/vi",
  "/animals/vi",
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

test("contact details and official social links are actionable", async ({
  page,
}) => {
  await page.goto("/vi");

  await expect(
    page.getByRole("link", { name: /naturalfarming@vietnam\.com/i }).first(),
  ).toHaveAttribute("href", "mailto:naturalfarming@vietnam.com");
  await expect(
    page.getByRole("link", { name: /\+84 97 151 91 85/i }).first(),
  ).toHaveAttribute("href", "tel:+84971519185");

  const facebook = page.getByRole("link", { name: /Facebook.*tab mới/i });
  const youtube = page.getByRole("link", { name: /YouTube.*tab mới/i });
  await expect(facebook.first()).toHaveAttribute(
    "href",
    "https://www.facebook.com/naturalfarmingvn/",
  );
  await expect(youtube.first()).toHaveAttribute(
    "href",
    "https://www.youtube.com/@naturalfarmingvietnam",
  );
  await expect(facebook.first()).toHaveAttribute("target", "_blank");
  await expect(youtube.first()).toHaveAttribute("target", "_blank");

  const organization = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  );
  expect(organization).toMatchObject({
    "@type": "Organization",
    email: "naturalfarming@vietnam.com",
    telephone: "+84971519185",
    sameAs: [
      "https://www.facebook.com/naturalfarmingvn/",
      "https://www.youtube.com/@naturalfarmingvietnam",
    ],
  });
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
    page.getByRole("navigation", {
      name: /Mobile navigation|Điều hướng di động/i,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("navigation", {
      name: /Mobile navigation|Điều hướng di động/i,
    }),
  ).not.toBeVisible();
});

test("mobile menu stays visible when opened at the bottom of a page", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile navigation behavior");
  await page.goto("/plants/vi");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const trigger = page.getByRole("button", { name: "Menu" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeInViewport();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  const bounds = await dialog.boundingBox();
  expect(bounds?.y).toBe(0);
});

test("plant input codes do not overlap their names on mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile layout regression");
  await page.goto("/plants/en#inputs");

  for (const summary of await page.locator(".premium-inputs summary").all()) {
    const code = await summary.locator("strong").boundingBox();
    const name = await summary.locator("span").boundingBox();
    expect(code).not.toBeNull();
    expect(name).not.toBeNull();
    expect(code!.x + code!.width).toBeLessThanOrEqual(name!.x);
  }
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
  await page.goto("/plants/en");
  await page.getByRole("link", { name: /Language: Tiếng Việt/i }).click();
  await expect(page).toHaveURL(/\/plants\/vi$/);
  await expect(page.locator("h1")).toContainText("Nuôi đất");
});

test("localized shell exposes the active language", async ({ page }) => {
  await page.goto("/about/vi");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.locator("[data-locale-shell]")).toHaveAttribute(
    "lang",
    "vi",
  );
});

test("legacy locale-prefix routes redirect to locale suffix routes", async ({
  page,
}) => {
  await page.goto("/en/animals");
  await expect(page).toHaveURL(/\/animals\/en$/);
});
