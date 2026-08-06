import { NextResponse } from "next/server";
import { getFeaturedTestimonials } from "@/lib/content-api";
import { parseTestimonialLocale } from "@/app/api/testimonials/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = parseTestimonialLocale(searchParams);

  if (locale === null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const data = await getFeaturedTestimonials(locale);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 502 },
    );
  }
}
