import { NextResponse } from "next/server";
import { testimonialsPage } from "@/lib/content-api";
import {
  parseBoundedInteger,
  parseTestimonialFilter,
  parseTestimonialLocale,
} from "@/app/api/testimonials/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = parseTestimonialLocale(searchParams);
  const type = parseTestimonialFilter(searchParams);
  const page = parseBoundedInteger(searchParams, "page", 1, 10_000);
  const pageSize = parseBoundedInteger(searchParams, "page_size", 12, 50);

  if (locale === null || type === null || page === null || pageSize === null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await testimonialsPage(locale, type, page, pageSize);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 502 },
    );
  }
}
