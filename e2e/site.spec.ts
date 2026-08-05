import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

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

const reward = {
  id: "11111111-1111-4111-8111-111111111111",
  point_cost: 100,
  image: {
    id: "22222222-2222-4222-8222-222222222222",
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='360'/%3E",
    width: 480,
    height: 360,
    variants: [],
  },
  position: 1,
  requested_locale: "vi",
  content_locale: "vi",
  is_fallback: false,
  name: "Rau theo mùa",
  short_description: "Rau đang có tại nông trại.",
};

async function mockRewardCatalog(page: Page, signedIn: boolean) {
  await page.route("**/api/account/account", (route) =>
    route.fulfill(
      signedIn
        ? {
            json: {
              data: {
                referral_code: "NFV1234567",
                referrer: null,
                can_submit_referral_code: true,
                points_balance: 120,
                invited_count: 1,
              },
            },
          }
        : { status: 401, json: { error: "unauthorized" } },
    ),
  );
  await page.route("**/api/account/rewards?**", (route) =>
    route.fulfill({
      json: {
        data: [reward],
        meta: { page: 1, page_size: 30, total: 1 },
      },
    }),
  );
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

test("nested account routes keep their shape when switching language", async ({
  page,
}) => {
  await page.goto("/account/vi/rewards");
  await expect(
    page.getByRole("link", { name: /Ngôn ngữ: English/i }),
  ).toHaveAttribute("href", "/account/en/rewards");
  await page.goto("/account/vi/referral");
  await expect(
    page.getByRole("link", { name: /Ngôn ngữ: English/i }),
  ).toHaveAttribute("href", "/account/en/referral");
});

test("referral action is available outside account and hidden inside it", async ({
  page,
}) => {
  await page.goto("/vi");
  await expect(
    page.getByRole("link", { name: "Giới thiệu bạn, nhận quà" }),
  ).toHaveAttribute("href", "/account/vi/referral");

  await page.goto("/account/vi/referral");
  await expect(
    page.getByRole("heading", { name: "Giới thiệu bạn, nhận quà" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Chương trình hoạt động thế nào?",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Điều kiện nhận điểm" }),
  ).toBeVisible();
  await expect(page.getByText("100", { exact: true })).toBeVisible();
  await expect(page.getByText("+50", { exact: true })).toBeVisible();
  await expect(page.getByText(/giá trị từ 300\.000₫/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Giới thiệu bạn, nhận quà" }),
  ).toHaveCount(0);
});

test("anonymous visitors can browse the reward catalog without program copy", async ({
  page,
}) => {
  await mockRewardCatalog(page, false);
  await page.goto("/account/vi/rewards");

  await expect(
    page.getByRole("heading", { name: "Danh sách quà" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Chương trình hoạt động thế nào?" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Rau theo mùa" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Đăng nhập để đổi Rau theo mùa" }),
  ).toHaveAttribute("href", /returnTo=%2Faccount%2Fvi%2Frewards/);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
});

test("reward confirmation stays open and submits only once during a rapid click", async ({
  page,
}) => {
  await mockRewardCatalog(page, true);
  let releasePost: (() => void) | undefined;
  const postGate = new Promise<void>((resolve) => {
    releasePost = resolve;
  });
  let postCount = 0;
  await page.route("**/api/account/redemptions", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    postCount += 1;
    await postGate;
    await route.fulfill({
      status: 201,
      json: {
        data: {
          redemption: {
            id: "33333333-3333-4333-8333-333333333333",
            reward_id: reward.id,
            reward_name_vi_snapshot: reward.name,
            reward_name_en_snapshot: "Seasonal vegetables",
            reward_name: reward.name,
            point_cost_snapshot: reward.point_cost,
            status: "pending",
            rejection_message: "",
            created_at: "2026-07-30T00:00:00Z",
            contacted_at: null,
            completed_at: null,
            rejected_at: null,
            updated_at: "2026-07-30T00:00:00Z",
          },
          balance: 20,
          idempotent_replay: false,
        },
      },
    });
  });

  await page.goto("/account/vi/rewards");
  await page.getByRole("button", { name: "Đổi Rau theo mùa" }).click();
  const dialog = page.getByRole("dialog", { name: "Xác nhận đổi quà" });
  const confirm = dialog.getByRole("button", { name: "Xác nhận đổi quà" });
  await confirm.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect.poll(() => postCount).toBe(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Đang gửi…" }),
  ).toBeDisabled();

  releasePost?.();
  await expect(page.getByText("Đã nhận yêu cầu đổi quà")).toBeVisible();
  await expect(dialog).toHaveCount(0);
  expect(postCount).toBe(1);
});

test("store link always uses the internal locale route", async ({
  page,
  isMobile,
}, testInfo) => {
  const usesMobileMenu = isMobile || testInfo.project.name === "tablet";
  await page.goto("/vi");
  if (usesMobileMenu) await page.getByRole("button", { name: "Menu" }).click();
  const navigation = page.getByRole("navigation", {
    name: usesMobileMenu ? "Điều hướng di động" : "Điều hướng chính",
  });
  const store = navigation.getByRole("link", { name: "Cửa hàng" });
  await expect(store).toHaveAttribute("href", "/store/vi");
  await expect(store).not.toHaveAttribute("target");
  await expect(store).not.toHaveAttribute("rel");
});

test("forum remains external and follows the internal Store link", async ({
  page,
  isMobile,
  request,
}, testInfo) => {
  const usesMobileMenu = isMobile || testInfo.project.name === "tablet";
  const settings = await getSiteSettings(request);
  const forumSetting = settings.links.find((link) => link.kind === "forum");
  await page.goto("/vi");
  if (usesMobileMenu) await page.getByRole("button", { name: "Menu" }).click();

  const navigation = page.getByRole("navigation", {
    name: usesMobileMenu ? "Điều hướng di động" : "Điều hướng chính",
  });
  const store = navigation.getByRole("link", { name: /Cửa hàng/i });
  const forum = navigation.getByRole("link", { name: /Diễn đàn/i });

  if (!forumSetting) {
    await expect(forum).toHaveCount(0);
    return;
  }

  await expect(forum).toHaveAttribute("href", forumSetting.url);
  await expect(forum).toHaveAttribute("target", "_blank");
  await expect(forum).toHaveAttribute("rel", "noreferrer");
  await expect(store).toHaveAttribute("href", "/store/vi");
  await expect(store).not.toHaveAttribute("target");
  const labels = await navigation.getByRole("link").allTextContents();
  const storeIndex = labels.findIndex((label) => label.includes("Cửa hàng"));
  const forumIndex = labels.findIndex((label) => label.includes("Diễn đàn"));
  expect(forumIndex).toBe(storeIndex + 1);
});

test("Store navigation works from Home, header, mobile menu, and footer", async ({
  isMobile,
  page,
}, testInfo) => {
  const usesMobileMenu = isMobile || testInfo.project.name === "tablet";
  await page.goto("/en");

  await page.locator(".section-forest").getByRole("link").click();
  await expect(page).toHaveURL(/\/store\/en$/);
  await page.goBack();

  if (usesMobileMenu) {
    await page.getByRole("button", { name: "Menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Store" })
      .click();
  } else {
    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Store" })
      .click();
  }
  await expect(page).toHaveURL(/\/store\/en$/);
  await page.goBack();

  await page
    .getByRole("navigation", { name: "Footer navigation" })
    .getByRole("link", { name: "Store" })
    .click();
  await expect(page).toHaveURL(/\/store\/en$/);
});

test("Store guide is responsive and its FAQ works by keyboard", async ({
  isMobile,
  page,
}, testInfo) => {
  const viewport =
    testInfo.project.name === "mobile"
      ? { width: 360, height: 900 }
      : testInfo.project.name === "tablet"
        ? { width: 768, height: 1024 }
        : { width: 1440, height: 1000 };
  await page.setViewportSize(viewport);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/store/en");
  await expect(
    page.getByRole("heading", { name: "Shop Natural Farming Vietnam" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Language: Tiếng Việt/i }),
  ).toHaveAttribute("href", "/store/vi");
  await expect(page.locator("main main")).toHaveCount(0);
  await expect(page.locator(".store-card")).toHaveCount(3);
  const cardBoxes = await page.locator(".store-card").evaluateAll((cards) =>
    cards.map((card) => {
      const box = card.getBoundingClientRect();
      return { left: box.left, top: box.top };
    }),
  );
  if (isMobile) {
    expect(new Set(cardBoxes.map((box) => Math.round(box.top))).size).toBe(3);
  } else {
    expect(new Set(cardBoxes.map((box) => Math.round(box.top))).size).toBe(1);
  }
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);

  const first = page.getByRole("button", {
    name: "How do I choose my weekly CSA items?",
  });
  const second = page.getByRole("button", {
    name: "What does |C mean?",
  });
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(second).toHaveAttribute("aria-expanded", "false");
  await second.focus();
  await page.keyboard.press("Enter");
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  const secondPanelId = await second.getAttribute("aria-controls");
  await expect(page.locator(`#${secondPanelId}`)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(second).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(`#${secondPanelId}`)).toBeHidden();

  for (const link of await page
    .locator('.store-card a, a[href^="https://zalo.me/"]')
    .all()) {
    await expect(link).not.toHaveAttribute("target");
    await expect(link).not.toHaveAttribute("rel");
  }
  if (isMobile) {
    const referral = page.locator(".referral-floating-action");
    for (const action of await page.locator(".store-card .store-btn").all()) {
      await action.evaluate((element) => {
        const root = document.documentElement;
        const previousScrollBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        element.scrollIntoView({ block: "center" });
        root.style.scrollBehavior = previousScrollBehavior;
      });
      const actionBox = await action.boundingBox();
      const referralBox = await referral.boundingBox();
      expect(actionBox).not.toBeNull();
      expect(referralBox).not.toBeNull();
      const overlaps =
        (actionBox?.x ?? 0) <
          (referralBox?.x ?? 0) + (referralBox?.width ?? 0) &&
        (actionBox?.x ?? 0) + (actionBox?.width ?? 0) > (referralBox?.x ?? 0) &&
        (actionBox?.y ?? 0) <
          (referralBox?.y ?? 0) + (referralBox?.height ?? 0) &&
        (actionBox?.y ?? 0) + (actionBox?.height ?? 0) > (referralBox?.y ?? 0);
      expect(overlaps, (await action.textContent()) ?? "Store action").toBe(
        false,
      );
    }
  }
  expect(errors).toEqual([]);
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

  const detailLink = page
    .locator(".workshop-calendar-card .workshop-title-link")
    .first();
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

test("account has a usable unauthenticated state without overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/account/vi");
  const heading = page.getByRole("heading", {
    name: "Đăng nhập để xem tài khoản",
  });
  await expect(heading).toBeVisible();
  const signIn = page.locator("#main").getByRole("link", { name: "Đăng nhập" });
  await expect(signIn).toHaveAttribute("href", /returnTo=%2Faccount%2Fvi/);
  await signIn.focus();
  await expect(signIn).toBeFocused();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test("legacy locale-prefix routes redirect to locale suffix routes", async ({
  page,
}) => {
  await page.goto("/en/animals");
  await expect(page).toHaveURL(/\/animals\/en$/);
});
