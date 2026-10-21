import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/app/globals.css"), "utf8");
const layout = readFileSync(resolve("src/app/layout.tsx"), "utf8");

function declarationBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];
}

describe("header controls style contract", () => {
  it("loads and applies the reference language typography", () => {
    expect(layout).toContain("@fontsource-variable/inter/wght.css");

    const language = declarationBlock(".header-text-btn");
    expect(language).toContain(
      'font-family:\n    "Inter Variable", "Inter", "Noto Sans Variable", "Noto Sans", Arial,\n    sans-serif',
    );
    expect(language).toContain("font-size: 11px");
    expect(language).toContain("font-weight: 600");
    expect(language).toContain("line-height: 1.55");
    expect(language).toContain("letter-spacing: -0.005em");
    expect(language).toContain("padding: 8px 1px");
    expect(language).toContain("margin-right: 8px");
    expect(language).toContain("color: #526059");
  });

  it("keeps the reference account trigger geometry and palette", () => {
    const trigger = declarationBlock(".icon-btn");
    expect(trigger).toContain("width: 36px");
    expect(trigger).toContain("height: 36px");
    expect(trigger).toContain("min-width: 36px");
    expect(trigger).toContain("min-height: 36px");
    expect(trigger).toContain("border: 1px solid #e0e6dc");
    expect(trigger).toContain("border-radius: 4px");
    expect(trigger).toContain("background: transparent");
    expect(trigger).toContain("color: #25332b");
  });

  it("keeps the reference desktop header height", () => {
    const header = declarationBlock(".header-inner");
    expect(header).toContain("height: 58px");
    expect(header).toContain("min-height: 58px");
  });
});
