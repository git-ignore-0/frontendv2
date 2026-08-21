import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const featureDirectory = dirname(fileURLToPath(import.meta.url));

describe("public tracker retry design", () => {
  it("does not expose a tracker cache-invalidation action", () => {
    const removedAction = resolve(featureDirectory, "tracker-retry.ts");
    const retrySources = [
      resolve(featureDirectory, "tracker-state.tsx"),
      resolve(featureDirectory, "tracker-retry-boundary.tsx"),
      resolve(featureDirectory, "../../app/tracker/[locale]/page.tsx"),
      resolve(featureDirectory, "../../app/api/tracker-farms/route.ts"),
    ].map((path) => readFileSync(path, "utf8"));

    expect(existsSync(removedAction)).toBe(false);
    expect(retrySources.join("\n")).not.toMatch(/revalidateTag|next\/cache/);
    expect(retrySources.join("\n")).toContain('cache: "no-store"');
  });
});
