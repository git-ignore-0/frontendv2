import { NextResponse } from "next/server";
import { getTestimonial } from "@/lib/content-api";
import { parseTestimonialLocale } from "@/app/api/testimonials/validation";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params;
  const { searchParams } = new URL(request.url);
  const locale = parseTestimonialLocale(searchParams);

  if (locale === null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const data = await getTestimonial(uuid, locale);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 502 },
    );
  }
}
