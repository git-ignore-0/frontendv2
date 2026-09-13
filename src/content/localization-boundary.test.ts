import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { workshopCopy } from "@/features/workshops/copy";
import { getCSAPurchaseCopy } from "@/features/membership/csa-purchase-copy";

const roots = ["src/app", "src/components", "src/features"];
const translatedAttributeNames = new Set([
  "alt",
  "aria-label",
  "eyebrow",
  "intro",
  "label",
  "placeholder",
  "title",
]);
const technicalStringTokens = new Set([
  "page",
  "privacy-policy",
  "term-conditions",
]);

function findTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? findTsxFiles(path)
      : extname(path) === ".tsx" && !/\.(?:test|spec)\.tsx$/u.test(path)
        ? [path]
        : [];
  });
}

function inlineCopySource(source: string, file: string) {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const findings: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const text = node.getText(ast).trim();
      if (/[A-Za-zÀ-ỹ]{2}/u.test(text)) findings.push(text);
    }
    if (
      ts.isJsxAttribute(node) &&
      translatedAttributeNames.has(node.name.getText(ast)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      node.initializer.text.trim().length > 0
    ) {
      findings.push(`${node.name.getText(ast)}=${node.initializer.text}`);
    }
    if (ts.isConditionalExpression(node)) {
      // className branches and CSS selectors are implementation tokens, not copy.
      const parent = node.parent;
      const classAttribute = ts.isJsxExpression(parent) ? parent.parent : null;
      if (
        classAttribute &&
        ts.isJsxAttribute(classAttribute) &&
        classAttribute.name.getText(ast) === "className"
      ) {
        ts.forEachChild(node, visit);
        return;
      }
      for (const branch of [node.whenTrue, node.whenFalse]) {
        if (
          ts.isStringLiteralLike(branch) &&
          /[A-Za-zÀ-ỹ]{2}/u.test(branch.text) &&
          !/^[.#][a-z]/iu.test(branch.text) &&
          !technicalStringTokens.has(branch.text)
        ) {
          findings.push(`conditional=${branch.text}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return { source, findings };
}

function inlineCopy(file: string) {
  return inlineCopySource(readFileSync(resolve(file), "utf8"), file);
}

describe("localization boundary", () => {
  it("still catches production-visible JSX copy while ignoring class and selector branches", () => {
    const source = `
      const example = <>
        <p>Visible copy</p>
        <input aria-label="Visible label" />
        <span>{locale === "vi" ? "Xin chào" : "Hello"}</span>
        <div className={selected ? "is-selected" : "is-idle"} />
      </>;
      const selector = selected ? ".item:enabled" : ".item:disabled";
    `;
    expect(inlineCopySource(source, "example.tsx").findings).toEqual([
      "Visible copy",
      "aria-label=Visible label",
      "conditional=Xin chào",
      "conditional=Hello",
    ]);
  });

  it("keeps the English and Vietnamese workshop dictionaries in sync", () => {
    expect(Object.keys(workshopCopy.en).sort()).toEqual(
      Object.keys(workshopCopy.vi).sort(),
    );
  });

  it("keeps CSA purchase copy keys and terms sections in sync across locales", () => {
    const english = getCSAPurchaseCopy("en");
    const vietnamese = getCSAPurchaseCopy("vi");
    expect(Object.keys(english).sort()).toEqual(Object.keys(vietnamese).sort());
    expect(english.terms.sections).toHaveLength(
      vietnamese.terms.sections.length,
    );
    expect(english.qrTitle).toBe("QR code");
    expect(vietnamese.qrTitle).toBe("Mã QR");
  });

  it("keeps translated copy out of every presentation file", () => {
    for (const file of roots.flatMap(findTsxFiles)) {
      const result = inlineCopy(file);
      expect(
        result.findings,
        `${file} contains inline user-facing copy`,
      ).toEqual([]);
      expect(
        result.source,
        `${file} uses the removed binary locale helper`,
      ).not.toMatch(/\bk\(locale/u);
    }
  });
});
