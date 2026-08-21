import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";
import { ContentApiConfigurationError } from "@/lib/content-api";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("tracker retry proxy configuration failures", () => {
  it("preserves the production content API configuration error", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CONTENT_API_ORIGIN", "");

    await expect(
      GET(
        new Request("http://localhost/api/tracker-farms?locale=en&retry=nonce"),
      ),
    ).rejects.toBeInstanceOf(ContentApiConfigurationError);
  });
});
