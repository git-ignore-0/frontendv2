import { afterEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/auth/account/route";

describe("Core account redirect", () => {
  afterEach(() => {
    delete process.env.AUTH_ORIGIN;
  });

  it("sends account management to Django Core", () => {
    process.env.AUTH_ORIGIN = "http://127.0.0.1:8000";

    const response = GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:8000/account",
    );
  });
});
