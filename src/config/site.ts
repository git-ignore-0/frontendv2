export const siteConfig = {
  name: "Natural Farming Vietnam",
  url: "https://naturalfarmingvietnam.com",
  contact: {
    email: "info@naturalfarmingvietnam.com",
    phone: null,
    address: null,
  },
  links: {
    store: "https://store.farmbrite.com/store/nntn",
  },
} as const;

export const contactEmailHref = `mailto:${siteConfig.contact.email}`;
