import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

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

function findTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? findTsxFiles(path)
      : extname(path) === ".tsx"
        ? [path]
        : [];
  });
}

function inlineCopy(file: string) {
  const source = readFileSync(resolve(file), "utf8");
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
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return { source, findings };
}

describe("localization boundary", () => {
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
