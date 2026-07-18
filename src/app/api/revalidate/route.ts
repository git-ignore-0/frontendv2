import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.CONTENT_REVALIDATE_SECRET || "";
  const timestamp = request.headers.get("x-nfv-timestamp") || "";
  const received =
    request.headers.get("x-nfv-signature")?.replace(/^sha256=/, "") || "";
  const raw = Buffer.from(await request.arrayBuffer());
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(raw)
    .digest("hex");
  const valid =
    secret.length >= 32 &&
    age <= 300 &&
    received.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  if (!valid)
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  let body: { tags?: unknown };
  try {
    body = JSON.parse(raw.toString("utf8")) as { tags?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter(
          (item): item is string =>
            typeof item === "string" && item.length > 0 && item.length <= 200,
        )
        .slice(0, 20)
    : [];
  tags.forEach((tag) => revalidateTag(tag));
  return NextResponse.json({ revalidated: tags });
}
