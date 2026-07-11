import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/#contact", permanent: true },
      { source: "/plant", destination: "/plants", permanent: true },
      { source: "/animal", destination: "/animals", permanent: true },
      {
        source: "/store",
        destination: "https://store.farmbrite.com/store/nntn",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
