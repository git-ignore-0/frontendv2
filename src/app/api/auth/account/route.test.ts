import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/auth/account/route";

describe("Core account redirect", () => {
  beforeEach(() => {
    process.env.AUTH_ORIGIN = "http://127.0.0.1:8000";
    process.env.PUBLIC_SITE_ORIGIN = "http://localhost:3000";
  });

  afterEach(() => {
    delete process.env.AUTH_ORIGIN;
    delete process.env.PUBLIC_SITE_ORIGIN;
  });

  it("sends account management to Django Core with the current public path", () => {
    const response = GET(
      new NextRequest(
        "http://localhost:3000/api/auth/account?returnTo=%2Fplants%2Fvi%3Ftab%3Dinputs",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:8000/account?return_to=http%3A%2F%2Flocalhost%3A3000%2Fplants%2Fvi%3Ftab%3Dinputs",
    );
  });

  it("rejects an external return target", () => {
    const response = GET(
      new NextRequest(
        "http://localhost:3000/api/auth/account?returnTo=https%3A%2F%2Fattacker.example",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:8000/account?return_to=http%3A%2F%2Flocalhost%3A3000%2F",
    );
  });
});
