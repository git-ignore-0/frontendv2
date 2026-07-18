import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));

import { POST } from "./route";

const secret = "a".repeat(64);

function signedRequest(body: string, validSignature = true) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto
    .createHmac("sha256", validSignature ? secret : "wrong-secret")
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-NFV-Timestamp": timestamp,
      "X-NFV-Signature": `sha256=${signature}`,
    },
    body,
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  revalidateTag.mockReset();
});

describe("content revalidation webhook", () => {
  it("rejects a request with the wrong signature", async () => {
    vi.stubEnv("CONTENT_REVALIDATE_SECRET", secret);

    const response = await POST(signedRequest('{"tags":["workshops"]}', false));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates bounded non-empty tags from a signed request", async () => {
    vi.stubEnv("CONTENT_REVALIDATE_SECRET", secret);

    const response = await POST(
      signedRequest('{"tags":["workshops","","workshop:living-soil"]}'),
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenCalledWith("workshops");
    expect(revalidateTag).toHaveBeenCalledWith("workshop:living-soil");
  });

  it("returns a client error for malformed signed JSON", async () => {
    vi.stubEnv("CONTENT_REVALIDATE_SECRET", secret);

    const response = await POST(signedRequest("{"));

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
