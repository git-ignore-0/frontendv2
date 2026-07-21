import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const baseURL = "http://127.0.0.1:3000";
const routes = [
  "/en",
  "/about/en",
  "/plants/en",
  "/animals/en",
  "/vi",
  "/about/vi",
  "/plants/vi",
  "/animals/vi",
  "/workshops/en",
  "/workshops/vi",
];
const viewports = [
  { name: "mobile-320", width: 320, height: 800 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "pre-md-767", width: 767, height: 900 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "pre-xl-1279", width: 1279, height: 900 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "wide-1920", width: 1920, height: 1080 },
];

await fs.mkdir("artifacts/visual-audit", { recursive: true });
const browser = await chromium.launch();
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    failedRequests.push(`${request.method()} ${request.url()}`),
  );

  for (const route of routes) {
    await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    const images = page.locator("img");
    for (let index = 0; index < (await images.count()); index += 1) {
      await images.nth(index).scrollIntoViewIfNeeded();
    }
    await page.waitForFunction(() =>
      [...document.images].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    const audit = await page.evaluate(() => {
      const root = document.documentElement;
      const offenders = [...document.querySelectorAll("body *")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            text: element.textContent?.trim().slice(0, 70) ?? "",
            className:
              typeof element.className === "string"
                ? element.className.slice(0, 120)
                : "",
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter(
          (item) =>
            item.width > 0 &&
            (item.left < -1 || item.right > root.clientWidth + 1),
        )
        .slice(0, 12);
      return {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        offenders,
        headings: [...document.querySelectorAll("h1,h2,h3")].map(
          (heading) => heading.textContent?.trim() ?? "",
        ),
        missingImages: [...document.images]
          .filter((image) => !image.complete || image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
      };
    });
    const slug = route.slice(1).replaceAll("/", "-");
    const shouldCapture =
      ["mobile-320", "tablet-768", "desktop-1440", "wide-1920"].includes(
        viewport.name,
      ) &&
      (route === "/en" ||
        ["mobile-320", "desktop-1440"].includes(viewport.name));
    if (shouldCapture) {
      await page.screenshot({
        path: `artifacts/visual-audit/${slug}-${viewport.name}.png`,
        fullPage: true,
      });
    }
    results.push({
      route,
      viewport: viewport.name,
      ...audit,
      consoleErrors: [...consoleErrors],
      failedRequests: [...failedRequests],
    });
    consoleErrors.length = 0;
    failedRequests.length = 0;
  }
  await context.close();
}

await browser.close();
await fs.writeFile(
  "artifacts/visual-audit/results.json",
  JSON.stringify(results, null, 2),
);
const failures = results.filter(
  (result) =>
    result.clientWidth !== result.scrollWidth ||
    result.consoleErrors.length > 0 ||
    result.failedRequests.length > 0 ||
    result.missingImages.length > 0,
);
console.log(
  JSON.stringify(
    {
      checks: results.length,
      failures,
      screenshots: (await fs.readdir("artifacts/visual-audit")).filter((file) =>
        file.endsWith(".png"),
      ),
    },
    null,
    2,
  ),
);
