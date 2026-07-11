import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "@/components/ui/external-link";
import { mainNavigation, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-forest-deep text-warm">
      <div className="site-container grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:py-20">
        <div>
          <Image
            src="/images/logo-mark.png"
            width={90}
            height={101}
            alt=""
            className="h-20 w-auto"
          />
          <p className="mt-5 max-w-sm font-display text-2xl leading-snug text-rice">
            Cùng thiên nhiên nuôi dưỡng sự sống.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-young">
            Khám phá
          </h2>
          <ul className="mt-5 grid gap-2">
            {mainNavigation.slice(1).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm text-rice hover:text-straw"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <ExternalLink
                href={siteConfig.storeUrl}
                className="inline-flex min-h-11 items-center gap-2 text-sm text-rice hover:text-straw"
              >
                Cửa hàng
              </ExternalLink>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-young">
            Kết nối
          </h2>
          <address className="text-rice/80 mt-5 grid text-sm not-italic leading-7">
            <span>{siteConfig.location}</span>
            <a
              href={`mailto:${siteConfig.email}`}
              className="break-all hover:text-straw"
            >
              {siteConfig.email}
            </a>
            <a href="tel:+84971519185" className="hover:text-straw">
              {siteConfig.phone}
            </a>
          </address>
          <p className="text-rice/55 mt-4 text-xs leading-5">
            Thông tin kế thừa từ website cũ, cần xác nhận trước khi xuất bản.
          </p>
        </div>
      </div>
      <div className="border-warm/10 border-t">
        <div className="site-container text-rice/60 flex flex-col gap-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Natural Farming Vietnam</span>
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center hover:text-straw"
          >
            Chính sách riêng tư
          </Link>
        </div>
      </div>
    </footer>
  );
}
