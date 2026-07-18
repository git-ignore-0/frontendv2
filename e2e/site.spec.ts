import { expect, test, type APIRequestContext } from "@playwright/test";

type SiteSettings = {
  email: string;
  is_email_enabled: boolean;
  phone_display: string;
  is_phone_enabled: boolean;
  links: Array<{ kind: string; url: string }>;
};

async function getSiteSettings(request: APIRequestContext) {
  const response = await request.get(
    "http://127.0.0.1:8000/api/v1/public/site-settings?locale=vi",
  );
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { data: SiteSettings }).data;
}

function phoneHref(value: string) {
  const digits = value.replace(/\D/g, "");
  return value.trim().startsWith("+") ? `tel:+${digits}` : `tel:${digits}`;
}

const internalRoutes = [
  "/en",
  "/about/en",
  "/plants/en",
  "/animals/en",
  "/workshops/en",
  "/vi",
  "/about/vi",
  "/plants/vi",
  "/animals/vi",
  "/workshops/vi",
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

test("store link follows the public site settings", async ({
  page,
  isMobile,
  request,
}) => {
  const settings = await getSiteSettings(request);
  const store = settings.links.find((link) => link.kind === "store");
  await page.goto("/vi");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  const link = page
    .getByRole("link", { name: /Cửa hàng.*mở trong tab mới/i })
    .first();
  if (store) {
    await expect(link).toHaveAttribute("href", store.url);
    await expect(link).toHaveAttribute("target", "_blank");
  } else {
    await expect(link).toHaveCount(0);
  }
});

test("forum follows store when both links are enabled", async ({
  page,
  isMobile,
  request,
}) => {
  const settings = await getSiteSettings(request);
  const storeSetting = settings.links.find((link) => link.kind === "store");
  const forumSetting = settings.links.find((link) => link.kind === "forum");
  await page.goto("/vi");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();

  const navigation = page.getByRole("navigation", {
    name: isMobile ? "Điều hướng di động" : "Điều hướng chính",
  });
  const store = navigation.getByRole("link", { name: /Cửa hàng/i });
  const forum = navigation.getByRole("link", { name: /Diễn đàn/i });

  if (!forumSetting) {
    await expect(forum).toHaveCount(0);
    return;
  }

  await expect(forum).toHaveAttribute("href", forumSetting.url);
  await expect(forum).toHaveAttribute("target", "_blank");
  if (!storeSetting) return;

  await expect(store).toHaveAttribute("href", storeSetting.url);
  await expect(store).toHaveAttribute("target", "_blank");
  const labels = await navigation.getByRole("link").allTextContents();
  const storeIndex = labels.findIndex((label) => label.includes("Cửa hàng"));
  const forumIndex = labels.findIndex((label) => label.includes("Diễn đàn"));
  expect(forumIndex).toBe(storeIndex + 1);
});

test("contact details and official social links are actionable", async ({
  page,
  request,
}) => {
  const settings = await getSiteSettings(request);
  expect(settings.links.some((link) => link.kind === "google_maps")).toBe(
    false,
  );
  await page.goto("/vi");

  const email = page.locator(`a[href="mailto:${settings.email}"]`).first();
  if (settings.is_email_enabled && settings.email) {
    await expect(email).toBeVisible();
  } else {
    await expect(email).toHaveCount(0);
  }

  const telephone = page
    .locator(`a[href="${phoneHref(settings.phone_display)}"]`)
    .first();
  if (settings.is_phone_enabled && settings.phone_display) {
    await expect(telephone).toBeVisible();
  } else {
    await expect(telephone).toHaveCount(0);
  }

  const facebook = page.getByRole("link", { name: /Facebook.*tab mới/i });
  const youtube = page.getByRole("link", { name: /YouTube.*tab mới/i });
  const facebookSetting = settings.links.find(
    (link) => link.kind === "facebook",
  );
  const youtubeSetting = settings.links.find((link) => link.kind === "youtube");
  if (facebookSetting) {
    await expect(facebook.first()).toHaveAttribute("href", facebookSetting.url);
    await expect(facebook.first()).toHaveAttribute("target", "_blank");
  } else {
    await expect(facebook).toHaveCount(0);
  }
  if (youtubeSetting) {
    await expect(youtube.first()).toHaveAttribute("href", youtubeSetting.url);
    await expect(youtube.first()).toHaveAttribute("target", "_blank");
  } else {
    await expect(youtube).toHaveCount(0);
  }

  const organization = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  );
  expect(organization).toMatchObject({ "@type": "Organization" });
  if (settings.is_email_enabled && settings.email)
    expect(organization.email).toBe(settings.email);
  if (settings.is_phone_enabled && settings.phone_display)
    expect(organization.telephone).toBe(
      phoneHref(settings.phone_display).replace("tel:", ""),
    );
  expect(organization.sameAs).toEqual(
    [facebookSetting?.url, youtubeSetting?.url].filter(Boolean),
  );
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

test("workshop navigation is present without commerce controls", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(
    page.getByRole("link", { name: /workshop/i }).first(),
  ).toHaveAttribute("href", "/workshops/en");
  await expect(
    page.getByRole("button", {
      name: /add to cart|checkout|đăng nhập|giỏ hàng/i,
    }),
  ).toHaveCount(0);
  await expect(page.locator("form")).toHaveCount(0);
});

test("long workshop content stays inside the content column", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The mobile layout uses a single column");
  await page.setViewportSize({ width: 1035, height: 980 });
  await page.goto("/workshops/vi");

  const detailLink = page.locator(".workshop-card h3 a").first();
  test.skip((await detailLink.count()) === 0, "No published workshop fixture");
  await detailLink.click();
  await expect(page.locator(".workshop-main")).toBeVisible();

  const offenders = await page
    .locator(".workshop-prose *")
    .evaluateAll((elements) => {
      const main = document
        .querySelector(".workshop-main")
        ?.getBoundingClientRect();
      if (!main) return ["missing workshop content column"];
      return elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            (rect.left < main.left - 1 || rect.right > main.right + 1)
          );
        })
        .map(
          (element) =>
            element.textContent?.trim().slice(0, 80) || element.tagName,
        );
    });

  expect(offenders).toEqual([]);
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
