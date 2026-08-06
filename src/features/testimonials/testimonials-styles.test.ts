import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/app/globals.css"), "utf8");

function declarationBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];
}

describe("Testimonials typography scope", () => {
  it("uses the body font only for the Testimonials page title", () => {
    expect(declarationBlock(".testimonials-page-intro h1")).toContain(
      "font-family: var(--font-body), sans-serif",
    );
    expect(declarationBlock("h1,\nh2,\nh3,\n.display")).toContain(
      "font-family: var(--font-display), Georgia, serif",
    );
  });
});
