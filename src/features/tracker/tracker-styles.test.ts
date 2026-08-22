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

  it("uses a standalone route boundary without the website shell", () => {
    expect(layout).toContain('className="tracker-standalone"');
    expect(layout).not.toContain("LocaleShell");
    expect(layout).not.toContain("site-header");
    expect(layout).not.toContain("footer");
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

  it("wraps long farm names and locations", () => {
    expect(
      declarationBlock(".tracker-standalone .tracker-farm-heading h3"),
    ).toContain("overflow-wrap: anywhere");
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
    expect(
      declarationBlock(".tracker-standalone .tracker-farmer-dialog"),
    ).toContain("width: min(760px, calc(100vw - 40px))");
    expect(
      declarationBlock(".tracker-standalone .tracker-dialog-body"),
    ).toContain("grid-template-columns: minmax(260px, 300px) minmax(0, 1fr)");
    expect(
      declarationBlock(".tracker-standalone .tracker-dialog-body"),
    ).toContain("height: 370px");
    expect(
      declarationBlock(".tracker-standalone .tracker-dialog-media"),
    ).toContain("max-height: 370px");
    expect(
      declarationBlock(".tracker-standalone .tracker-dialog-photo"),
    ).toContain("object-position: center");
    expect(
      declarationBlock(".tracker-standalone .tracker-dialog-content"),
    ).toContain("overflow-y: auto");
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.tracker-farmer-dialog\s*\{\s*width: calc\(100vw - 20px\)/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.tracker-dialog-body\s*\{\s*height: 100%;\s*min-height: 0;[\s\S]*?grid-template-columns: 1fr/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\)[\s\S]*?\.tracker-standalone \.tracker-dialog-media\s*\{\s*height: clamp\(205px, 31dvh, 255px\)/,
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
