export const siteConfig = {
  name: "Natural Farming Vietnam",
  url: "https://naturalfarmingvietnam.com",
  contact: {
    email: "naturalfarming@vietnam.com",
    phone: "+84 97 151 91 85",
  },
  links: {
    store: "https://store.farmbrite.com/store/nntn",
    facebook: "https://www.facebook.com/naturalfarmingvn/",
    youtube: "https://www.youtube.com/@naturalfarmingvietnam",
  },
} as const;

export const contactEmailHref = `mailto:${siteConfig.contact.email}`;
