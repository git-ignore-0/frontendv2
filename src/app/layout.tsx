import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import { siteConfig } from "@/config/site";
import { defaultLocale, isLocale } from "@/lib/i18n";
import "./globals.css";

const body = localFont({
  src: [
    { path: "../assets/fonts/NotoSans-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/NotoSans-SemiBold.ttf", weight: "600" },
    { path: "../assets/fonts/NotoSans-Bold.ttf", weight: "700" },
  ],
  variable: "--font-body",
  display: "swap",
});
const display = localFont({
  src: [
    { path: "../assets/fonts/NotoSerif-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/NotoSerif-SemiBold.ttf", weight: "600" },
    { path: "../assets/fonts/NotoSerif-Bold.ttf", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Natural Farming Vietnam",
    template: "%s · Natural Farming Vietnam",
  },
  description:
    "Natural farming knowledge rooted in living soil, healthy plants, animals and communities.",
  icons: { icon: "/images/logo-mark.png" },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestedLocale = (await headers()).get("x-site-locale");
  const locale =
    requestedLocale && isLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.contact.email,
    telephone: "+84971519185",
    sameAs: [siteConfig.links.facebook, siteConfig.links.youtube],
  };
  return (
    <html lang={locale} className={`${body.variable} ${display.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </body>
    </html>
  );
}
