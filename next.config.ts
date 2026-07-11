import type { NextConfig } from "next";
import { siteConfig } from "./src/config/site";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/about", destination: "/en/about", permanent: true },
      { source: "/plants", destination: "/en/plants", permanent: true },
      { source: "/animals", destination: "/en/animals", permanent: true },
      { source: "/about-us", destination: "/en/about", permanent: true },
      { source: "/contact-us", destination: "/en#contact", permanent: true },
      { source: "/plant", destination: "/en/plants", permanent: true },
      { source: "/animal", destination: "/en/animals", permanent: true },
      {
        source: "/privacy-policy",
        destination: "/en/privacy-policy",
        permanent: true,
      },
      {
        source: "/term-conditions",
        destination: "/en/term-conditions",
        permanent: true,
      },
      {
        source: "/store",
        destination: siteConfig.links.store,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
