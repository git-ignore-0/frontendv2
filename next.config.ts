import type { NextConfig } from "next";
import { siteConfig } from "./src/config/site";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/about", destination: "/about/en", permanent: true },
      { source: "/plants", destination: "/plants/en", permanent: true },
      { source: "/animals", destination: "/animals/en", permanent: true },
      { source: "/about-us", destination: "/about/en", permanent: true },
      { source: "/contact-us", destination: "/en#contact", permanent: true },
      { source: "/plant", destination: "/plants/en", permanent: true },
      { source: "/animal", destination: "/animals/en", permanent: true },
      {
        source: "/privacy-policy",
        destination: "/privacy-policy/en",
        permanent: true,
      },
      {
        source: "/term-conditions",
        destination: "/term-conditions/en",
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
