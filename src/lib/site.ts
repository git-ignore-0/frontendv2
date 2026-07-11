export const siteConfig = {
  name: "Natural Farming Vietnam",
  description:
    "Cùng thiên nhiên nuôi dưỡng đất, cây trồng, vật nuôi và cộng đồng.",
  url: "https://naturalfarmingvietnam.com",
  storeUrl: "https://store.farmbrite.com/store/nntn",
  email: "naturalfarming@vietnam.com",
  phone: "+84 97 151 91 85",
  location: "Bến Tre, Việt Nam",
} as const;

export const mainNavigation = [
  { href: "/", label: "Trang chủ" },
  { href: "/about", label: "Giới thiệu" },
  { href: "/plants", label: "Cây trồng" },
  { href: "/animals", label: "Vật nuôi" },
] as const;
