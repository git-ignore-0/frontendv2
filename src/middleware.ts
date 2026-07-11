import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const candidate = segments.at(-1) ?? segments.at(0);
  const locale = candidate && isLocale(candidate) ? candidate : defaultLocale;
  const headers = new Headers(request.headers);
  headers.set("x-site-locale", locale);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
