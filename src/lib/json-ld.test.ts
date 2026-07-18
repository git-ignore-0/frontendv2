import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./json-ld";

describe("JSON-LD serialization", () => {
  it("cannot terminate the script element through CMS text", () => {
    const result = serializeJsonLd({
      name: "</script><script>alert(1)</script>",
    });

    expect(result).not.toContain("<");
    expect(result).toContain("\\u003c/script>");
  });
});
