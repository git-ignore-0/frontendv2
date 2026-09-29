import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/app/globals.css"), "utf8");
const layout = readFileSync(
  resolve("src/app/tracker/[locale]/layout.tsx"),
  "utf8",
);
const icon = readFileSync(
  resolve("src/features/tracker/tracker-icon.tsx"),
  "utf8",
);
const legend = readFileSync(
  resolve("src/features/tracker/milestone-legend.tsx"),
  "utf8",
);

function declarationBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];
}

describe("tracker responsive style contract", () => {
  it("keeps shared content tables horizontally scrollable on mobile", () => {
    expect(declarationBlock(".table-wrap")).toContain("overflow: auto");
    expect(declarationBlock("table")).toContain("min-width: 42rem");
  });

  it("uses the shared website shell without a standalone page background", () => {
    expect(layout).toContain('className="tracker-standalone"');
    expect(layout).toContain("LocaleShell");
    expect(declarationBlock(".tracker-standalone")).not.toContain(
      "min-height: 100vh",
    );
    expect(declarationBlock(".tracker-standalone")).not.toContain(
      "background:",
    );
    expect(
      declarationBlock(".tracker-standalone .tracker-page"),
    ).toBeUndefined();
  });

  it("contains horizontal overflow inside the field strip", () => {
    expect(declarationBlock(".tracker-standalone")).toContain(
      "overflow-x: hidden",
    );
    expect(
      declarationBlock(".tracker-standalone .tracker-field-section"),
    ).toContain("overflow: hidden");
    expect(
      declarationBlock(".tracker-standalone .tracker-field-scroll"),
    ).toContain("overflow-x: auto");
    expect(
      declarationBlock(".tracker-standalone .tracker-field-scroll"),
    ).toContain("overscroll-behavior-x: contain");
  });

  it("uses the reference 2-column desktop, 4-column wide, and 1-column mobile grid", () => {
    expect(
      declarationBlock(".tracker-standalone .tracker-farm-grid"),
    ).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(css).toMatch(
      /@media \(min-width: 1200px\)[\s\S]*?\.tracker-standalone \.tracker-farm-grid\s*\{\s*grid-template-columns: repeat\(4,/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.tracker-farm-grid\s*\{\s*grid-template-columns: 1fr/,
    );
  });

  it("lays out four signup stats without horizontal overflow", () => {
    expect(declarationBlock(".tracker-standalone .tracker-stats")).toContain(
      "grid-template-columns: repeat(4, minmax(0, 1fr))",
    );
    expect(declarationBlock(".tracker-standalone .tracker-stat")).toContain(
      "min-width: 0",
    );
    expect(declarationBlock(".tracker-standalone .tracker-stat dt")).toContain(
      "overflow-wrap: anywhere",
    );
    expect(css).toMatch(
      /@media \(max-width: 900px\)[\s\S]*?\.tracker-standalone \.tracker-stats\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.tracker-stats\s*\{\s*grid-template-columns: 1fr/,
    );
  });

  it("keeps both signup counts in a responsive two-column layout", () => {
    const count = declarationBlock(".tracker-standalone .tracker-count");
    const label = declarationBlock(".tracker-standalone .tracker-count-label");
    const labelPart = declarationBlock(
      ".tracker-standalone .tracker-count-label-part",
    );
    expect(count).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(count).toContain("gap: 16px");
    expect(css).toMatch(
      /\.tracker-standalone \.tracker-count-secondary\s*\{\s*text-align: right;/,
    );
    expect(label).toContain("white-space: nowrap");
    expect(labelPart).toContain("display: inline");
    expect(css).toMatch(
      /@container tracker-farm-card \(max-width: 380px\)[\s\S]*?\.tracker-standalone \.tracker-count-label\s*\{[\s\S]*?white-space: normal;[\s\S]*?\.tracker-standalone \.tracker-count-label-part\s*\{[\s\S]*?display: block;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 380px\)[\s\S]*?\.tracker-standalone \.tracker-count-value span,[\s\S]*?\.tracker-standalone \.tracker-count-label\s*\{\s*font-size: 12px/,
    );
  });

  it("truncates card names to one line while preserving wrapping locations", () => {
    const cardName = declarationBlock(
      ".tracker-standalone .tracker-farm-heading h3",
    );
    expect(cardName).toContain("max-width: 100%");
    expect(cardName).toContain("overflow: hidden");
    expect(cardName).toContain("text-overflow: ellipsis");
    expect(cardName).toContain("white-space: nowrap");
    expect(
      declarationBlock(".tracker-standalone .tracker-farm-location"),
    ).toContain("overflow-wrap: anywhere");
  });

  it("uses the approved emoji icons instead of SVG artwork", () => {
    expect(icon).toContain('seed: "🌰"');
    expect(icon).toContain('sprout: "🌱"');
    expect(icon).toContain('harvest: "🌳"');
    expect(icon).toContain("tracker-mother-tree");
    expect(icon).not.toContain("<svg");
  });

  it("scopes every tracker class selector under the standalone boundary", () => {
    const selectors = css.match(/^.*\.tracker-[^{]+\{/gm) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    expect(
      selectors.every(
        (selector) =>
          selector.includes(".tracker-standalone") ||
          selector.includes("@keyframes tracker-"),
      ),
    ).toBe(true);
  });

  it("matches the reference typography and card geometry", () => {
    expect(declarationBlock(".tracker-standalone")).toContain(
      'BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    );
    expect(
      declarationBlock(".tracker-standalone .tracker-farm-card"),
    ).toContain("border-radius: 20px");
    expect(declarationBlock(".tracker-standalone .tracker-progress")).toContain(
      "height: 14px",
    );
    expect(declarationBlock(".tracker-standalone .tracker-shell")).toContain(
      "width: min(100%, 1320px)",
    );
    const stageLabel = declarationBlock(
      ".tracker-standalone .tracker-stage-badge",
    );
    expect(stageLabel).toContain("align-self: flex-start");
    expect(stageLabel).toContain("width: fit-content");
    expect(stageLabel).toContain("max-width: 100%");
  });

  it("matches the v32 farmer detail trigger and keeps field farms static", () => {
    const trigger = declarationBlock(".tracker-standalone .detail-trigger");
    const action = declarationBlock(".tracker-standalone .fcard .card-action");
    const cardHover = declarationBlock(
      ".tracker-standalone .tracker-farm-card:hover",
    );

    expect(trigger).toContain("background: var(--tracker-dark)");
    expect(trigger).toContain("border-radius: 11px");
    expect(trigger).toContain("padding: 10px 13px");
    expect(trigger).toContain("font-size: 12.5px");
    expect(trigger).toContain("font-weight: 750");
    expect(trigger).toContain("gap: 8px");
    expect(trigger).toContain("box-shadow: 0 4px 10px rgba(18, 50, 31, 0.14)");
    expect(action).toContain("margin-top: auto");
    expect(action).toContain("padding-top: 18px");
    expect(action).toContain("justify-content: flex-end");
    expect(cardHover).toContain("border-color: #d7e1d0");
    expect(cardHover).toContain(
      "box-shadow: 0 10px 24px rgba(18, 50, 31, 0.1)",
    );
    expect(cardHover).not.toContain("transform:");
    expect(
      declarationBlock(".tracker-standalone .tracker-field-scroll li"),
    ).toContain("cursor: default");
    expect(css).not.toContain("tracker-farm-card-trigger");
    expect(css).not.toContain("tracker-card-action");
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.detail-trigger\s*\{\s*padding: 10px 13px;\s*font-size: 12px/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.fcard \.card-action\s*\{\s*padding-top: 16px/,
    );
  });

  it("keeps the farmer dialog responsive at desktop and mobile widths", () => {
    const content = declarationBlock(
      ".tracker-standalone .farmer-dialog__content",
    );
    const about = declarationBlock(".tracker-standalone .farmer-dialog__about");
    const aboutScroll = declarationBlock(
      ".tracker-standalone .farmer-dialog__about-scroll",
    );
    const dialogName = declarationBlock(
      ".tracker-standalone .farmer-dialog__name",
    );

    expect(declarationBlock(".tracker-standalone .farmer-dialog")).toContain(
      "width: min(980px, 88vw)",
    );
    expect(declarationBlock(".tracker-standalone .farmer-dialog")).toContain(
      "height: max-content",
    );
    expect(declarationBlock(".tracker-standalone .farmer-dialog")).toContain(
      "max-height: 90vh",
    );
    expect(declarationBlock(".tracker-standalone .farmer-dialog")).toContain(
      "max-height: 90dvh",
    );
    expect(css).toMatch(
      /@media \(min-width: 1100px\)[\s\S]*?\.tracker-standalone \.farmer-dialog\s*\{\s*width: min\(980px, 88vw\)/,
    );
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog__body"),
    ).toContain("grid-template-columns: minmax(260px, 300px) minmax(0, 1fr)");
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog__body"),
    ).toContain("grid-template-rows: minmax(0, 1fr)");
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog__body"),
    ).toContain("height: auto");
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog__body"),
    ).toContain("max-height: 90dvh");
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog__body"),
    ).toContain("overflow: hidden");
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog__media"),
    ).toContain("min-height: 370px");
    expect(
      declarationBlock(
        ".tracker-standalone .farmer-dialog__media .dialog-photo",
      ),
    ).toContain("object-fit: cover");
    expect(content).toContain("min-height: 0");
    expect(content).toContain("min-width: 0");
    expect(content).toContain("overflow: hidden");
    expect(dialogName).toContain("width: 100%");
    expect(dialogName).toContain("min-width: 0");
    expect(dialogName).toContain("max-width: 100%");
    expect(dialogName).toContain("display: -webkit-box");
    expect(dialogName).toContain("flex: 0 0 auto");
    expect(dialogName).toContain("overflow: hidden");
    expect(dialogName).toContain("text-overflow: ellipsis");
    expect(dialogName).toContain("white-space: normal");
    expect(dialogName).toContain("overflow-wrap: anywhere");
    expect(dialogName).toContain("-webkit-box-orient: vertical");
    expect(dialogName).toContain("-webkit-line-clamp: 3");
    expect(about).toContain("flex: 1 1 auto");
    expect(about).toContain("min-height: 0");
    expect(aboutScroll).not.toContain("max-height");
    expect(aboutScroll).toContain("overflow-y: auto");
    expect(aboutScroll).not.toMatch(/(^|\n)\s*height:/);
    expect(css).not.toContain(".tracker-standalone .tracker-farmer-dialog");
    expect(css).not.toContain(".tracker-standalone .tracker-dialog-body");
    expect(css).not.toContain(".tracker-standalone .tracker-dialog-media");
    expect(css).not.toContain(".tracker-standalone .tracker-dialog-content");
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.farmer-dialog\s*\{\s*width: calc\(100vw - 20px\)/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.farmer-dialog\s*\{[\s\S]*?max-width: calc\(100vw - 20px\)/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.farmer-dialog__body\s*\{\s*display: flex;\s*flex-direction: column;[\s\S]*?max-height: 90dvh/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.farmer-dialog__media\s*\{\s*flex: 0 0 160px;[\s\S]*?height: 160px/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.farmer-dialog__about-scroll\s*\{[\s\S]*?min-height: 0;[\s\S]*?overflow-y: auto/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\) and \(max-height: 650px\)[\s\S]*?\.tracker-standalone \.farmer-dialog__name\s*\{\s*font-size: 24px/,
    );
    expect(css).toContain(".farmer-dialog--expand-about");
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog-backdrop"),
    ).toContain("position: fixed");
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog-backdrop"),
    ).toContain("height: 100dvh");
    expect(
      declarationBlock(".tracker-standalone .farmer-dialog-backdrop"),
    ).toContain("z-index: 100");
    expect(css).toContain("min-height: min(148px, 20dvh)");
    expect(css).toContain("min-height: min(96px, 20dvh)");
    expect(css).toMatch(
      /@media \(max-height: 600px\)[\s\S]*?\.tracker-standalone\s+\.farmer-dialog--expand-about\s+\.farmer-dialog__about-scroll\s*\{\s*min-height: 24px/,
    );
  });

  it("uses the exact v32 system font stack throughout both dialogs", () => {
    const systemFont =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    const farmerDialog = declarationBlock(
      ".tracker-standalone .farmer-dialog",
    )?.replace(/\s+/g, " ");
    const lightbox = declarationBlock(
      ".tracker-standalone .image-lightbox",
    )?.replace(/\s+/g, " ");

    expect(farmerDialog).toContain(`font-family: ${systemFont}`);
    expect(lightbox).toContain(`font-family: ${systemFont}`);
    expect(css).toMatch(
      /\.tracker-standalone \.farmer-dialog \*,\s*\.tracker-standalone \.image-lightbox \*\s*\{\s*font-family: inherit;/,
    );
  });

  it("matches the v32 gallery and lightbox style contract", () => {
    const gallery = declarationBlock(
      ".tracker-standalone .farmer-gallery__rail",
    );
    const thumbnail = declarationBlock(
      ".tracker-standalone .farmer-gallery__thumb",
    );
    const lightbox = declarationBlock(".tracker-standalone .image-lightbox");
    const lightboxImage = declarationBlock(
      ".tracker-standalone .image-lightbox__image",
    );

    expect(gallery).toContain("overflow-x: auto");
    expect(gallery).toContain("overscroll-behavior-x: contain");
    expect(thumbnail).toContain("flex: 0 0 82px");
    expect(thumbnail).toContain("width: 82px");
    expect(thumbnail).toContain("height: 64px");
    expect(lightbox).toContain("width: min(1180px, calc(100vw - 32px))");
    expect(lightbox).toContain("height: min(860px, calc(100dvh - 32px))");
    expect(lightbox).toContain("background: #0d1710");
    expect(lightboxImage).toContain("object-fit: contain");
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.image-lightbox\s*\{\s*width: 100vw;[\s\S]*?height: 100dvh;[\s\S]*?border-radius: 0/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.tracker-standalone \*/,
    );
  });

  it("keeps milestone chip labels at the reference semibold weight", () => {
    expect(legend).not.toContain("<strong>{milestoneCopy.label}</strong>");
    expect(
      declarationBlock(".tracker-standalone .tracker-legend li"),
    ).toContain("font-weight: 600");
  });

  it("matches the reference demo-note geometry and production colors", () => {
    const block = declarationBlock(".tracker-standalone .tracker-demo-note");

    expect(block).toContain("background: #fff7e6");
    expect(block).toContain("border: 1px solid var(--tracker-gold)");
    expect(block).toContain("border-radius: 14px");
    expect(block).toContain(
      "padding: clamp(12px, 1.6vw, 16px) clamp(14px, 2.5vw, 22px)",
    );
    expect(block).toContain("margin: clamp(20px, 3vw, 28px) 0");
    expect(block).toContain("font-size: clamp(12.5px, 1.2vw, 14px)");
    expect(block).toContain("line-height: 1.55");
    expect(block).toContain("text-align: center");
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.tracker-demo-note\s*\{\s*margin: 18px 0;\s*border-radius: 12px/,
    );
  });

  it("keeps tracker CSS out of the website shell selectors", () => {
    expect(css).not.toMatch(
      /\[data-locale-shell\][^{]*\.tracker-(page|standalone)/,
    );
  });

  it("respects reduced motion", () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.tracker-progress > span/,
    );
  });
});
