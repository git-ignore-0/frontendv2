import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const trackerCss = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
).replaceAll("</style>", "<\\/style>");

const fixtures = {
  en: {
    about: "About this farmer",
    eyebrow: "Farmer profile",
    gallery: "Farm photos",
    location:
      "Village 7, Tuyen Lam highland growing region, Da Lat, Lam Dong, Vietnam",
    name: "Green Valley Regenerative Community Learning and Demonstration Farm Collective",
    description:
      "This farmer has cared for the soil together with the local community through many growing seasons. ".repeat(
        80,
      ),
  },
  vi: {
    about: "Về người nông dân này",
    eyebrow: "Hồ sơ người nông dân",
    gallery: "Ảnh nông trại",
    location:
      "Thôn 7, vùng canh tác cao nguyên Tuyền Lâm, Đà Lạt, Lâm Đồng, Việt Nam",
    name: "Nông trại cộng đồng canh tác tái sinh và học tập thực hành bền vững Thung Lũng Xanh",
    description:
      "Người nông dân này đã chăm sóc đất đai cùng cộng đồng địa phương qua nhiều mùa vụ. ".repeat(
        80,
      ),
  },
} as const;

async function renderDialog(page: Page, locale: keyof typeof fixtures) {
  const fixture = fixtures[locale];
  await page.setContent(`
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${trackerCss}</style>
    <main class="tracker-standalone">
      <dialog aria-labelledby="tracker-farmer-dialog-name" class="farmer-dialog">
        <button class="farmer-dialog__close" type="button">×</button>
        <div class="farmer-dialog__body">
          <div class="farmer-dialog__media">
            <div class="farmer-dialog__fallback">🌱</div>
            <img
              alt="${fixture.name}"
              class="dialog-photo"
              height="900"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900'%3E%3Crect width='1200' height='900' fill='%23dcebd6'/%3E%3C/svg%3E"
              width="1200"
            />
            <span class="dialog-photo-hint">⌕ View photo</span>
          </div>
          <div class="farmer-dialog__content">
            <p class="farmer-dialog__eyebrow">${fixture.eyebrow}</p>
            <h2 class="farmer-dialog__name" id="tracker-farmer-dialog-name">${fixture.name}</h2>
            <p class="farmer-dialog__address"><span>📍</span><span>${fixture.location}</span></p>
            <div class="farmer-dialog__about">
              <p class="farmer-dialog__about-label">${fixture.about}</p>
              <div class="farmer-dialog__about-scroll">
                <p class="farmer-dialog__description">${fixture.description}</p>
              </div>
            </div>
            <section class="farmer-gallery">
              <div class="farmer-gallery__head">
                <p class="farmer-gallery__label">${fixture.gallery}</p>
                <span class="farmer-gallery__count">3</span>
              </div>
              <div class="farmer-gallery__rail">
                <button class="farmer-gallery__thumb" type="button"></button>
                <button class="farmer-gallery__thumb" type="button"></button>
                <button class="farmer-gallery__thumb" type="button"></button>
              </div>
            </section>
          </div>
        </div>
      </dialog>
    </main>
  `);
  await page
    .locator(".farmer-dialog")
    .evaluate((dialog) => (dialog as HTMLDialogElement).showModal());
  await expect(page.locator(".farmer-dialog")).toHaveCSS("transform", "none");
}

async function dialogMetrics(page: Page) {
  return page.evaluate(() => {
    const required = <T extends Element>(selector: string) => {
      const element = document.querySelector<T>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      return element;
    };
    const dialog = required<HTMLDialogElement>(".farmer-dialog");
    const body = required<HTMLElement>(".farmer-dialog__body");
    const media = required<HTMLElement>(".farmer-dialog__media");
    const content = required<HTMLElement>(".farmer-dialog__content");
    const name = required<HTMLElement>(".farmer-dialog__name");
    const about = required<HTMLElement>(".farmer-dialog__about-scroll");
    const description = required<HTMLElement>(".farmer-dialog__description");
    const gallery = required<HTMLElement>(".farmer-gallery");
    const dialogRect = dialog.getBoundingClientRect();
    const galleryRect = gallery.getBoundingClientRect();
    const lineHeight = Number.parseFloat(
      getComputedStyle(description).lineHeight,
    );
    about.scrollTop = about.scrollHeight;
    return {
      aboutClientHeight: about.clientHeight,
      aboutLineHeight: lineHeight,
      aboutOverflowY: getComputedStyle(about).overflowY,
      aboutScrollHeight: about.scrollHeight,
      aboutScrolled: about.scrollTop > 0,
      bodyOverflowDelta: body.scrollHeight - body.clientHeight,
      bodyOverflowY: getComputedStyle(body).overflowY,
      contentOverflowDelta: content.scrollHeight - content.clientHeight,
      contentOverflowY: getComputedStyle(content).overflowY,
      dialogHeight: dialogRect.height,
      dialogOverflowDelta: dialog.scrollHeight - dialog.clientHeight,
      dialogOverflowY: getComputedStyle(dialog).overflowY,
      galleryInsideDialog: galleryRect.bottom <= dialogRect.bottom + 1,
      galleryVisible:
        galleryRect.height > 0 && getComputedStyle(gallery).display !== "none",
      mediaHeight: media.getBoundingClientRect().height,
      nameLines:
        name.getBoundingClientRect().height /
        Number.parseFloat(getComputedStyle(name).lineHeight),
      pageOverflowsHorizontally:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      viewportHeight: window.innerHeight,
    };
  });
}

for (const locale of ["en", "vi"] as const) {
  test(`${locale} long About copy retains one readable line at 375x812`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await renderDialog(page, locale);

    const metrics = await dialogMetrics(page);
    expect(metrics.aboutClientHeight).toBeGreaterThanOrEqual(
      metrics.aboutLineHeight,
    );
    expect(metrics.aboutScrollHeight).toBeGreaterThan(
      metrics.aboutClientHeight,
    );
    expect(metrics.aboutOverflowY).toBe("auto");
    expect(metrics.aboutScrolled).toBe(true);
    expect(metrics.galleryVisible).toBe(true);
    expect(metrics.galleryInsideDialog).toBe(true);
    expect(metrics.dialogHeight).toBeLessThanOrEqual(
      metrics.viewportHeight * 0.7 + 1,
    );
    expect(metrics.mediaHeight).toBe(160);
    expect(metrics.nameLines).toBeGreaterThan(2);
    expect(metrics.nameLines).toBeLessThanOrEqual(3.05);
    expect(metrics.dialogOverflowY).toBe("hidden");
    expect(metrics.bodyOverflowY).toBe("hidden");
    expect(metrics.contentOverflowY).toBe("hidden");
    expect(metrics.dialogOverflowDelta).toBeLessThanOrEqual(2);
    expect(metrics.bodyOverflowDelta).toBeLessThanOrEqual(1);
    expect(metrics.contentOverflowDelta).toBeLessThanOrEqual(1);
    expect(metrics.pageOverflowsHorizontally).toBe(false);
  });
}

test("long About copy retains one readable line at 320x720", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await renderDialog(page, "en");

  const metrics = await dialogMetrics(page);
  expect(metrics.aboutClientHeight).toBeGreaterThanOrEqual(
    metrics.aboutLineHeight,
  );
  expect(metrics.aboutScrollHeight).toBeGreaterThan(metrics.aboutClientHeight);
  expect(metrics.galleryVisible).toBe(true);
  expect(metrics.galleryInsideDialog).toBe(true);
  expect(metrics.dialogHeight).toBeLessThanOrEqual(
    metrics.viewportHeight * 0.7 + 1,
  );
  expect(metrics.mediaHeight).toBe(130);
  expect(metrics.dialogOverflowY).toBe("hidden");
  expect(metrics.bodyOverflowY).toBe("hidden");
  expect(metrics.contentOverflowY).toBe("hidden");
  expect(metrics.pageOverflowsHorizontally).toBe(false);
});

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]) {
  test(`long About copy remains bounded at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await renderDialog(page, "en");

    const metrics = await dialogMetrics(page);
    expect(metrics.aboutClientHeight).toBeGreaterThanOrEqual(
      metrics.aboutLineHeight,
    );
    expect(metrics.aboutScrollHeight).toBeGreaterThan(
      metrics.aboutClientHeight,
    );
    expect(metrics.galleryVisible).toBe(true);
    expect(metrics.galleryInsideDialog).toBe(true);
    expect(metrics.dialogHeight).toBeLessThanOrEqual(
      metrics.viewportHeight * 0.7 + 1,
    );
    expect(metrics.dialogOverflowY).toBe("hidden");
    expect(metrics.bodyOverflowY).toBe("hidden");
    expect(metrics.contentOverflowY).toBe("hidden");
    expect(metrics.dialogOverflowDelta).toBeLessThanOrEqual(2);
    expect(metrics.bodyOverflowDelta).toBeLessThanOrEqual(1);
    expect(metrics.contentOverflowDelta).toBeLessThanOrEqual(1);
    expect(metrics.pageOverflowsHorizontally).toBe(false);
  });
}
