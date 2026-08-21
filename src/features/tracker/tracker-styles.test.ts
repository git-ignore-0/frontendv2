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

function declarationBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];
}

describe("tracker responsive style contract", () => {
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
