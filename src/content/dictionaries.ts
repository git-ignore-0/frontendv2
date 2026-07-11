import type { Locale } from "@/lib/i18n";

export const dictionaries = {
  en: {
    skip: "Skip to content",
    nav: {
      home: "Home",
      about: "About",
      plants: "Plants",
      animals: "Animals",
      store: "Store",
    },
    menu: "Menu",
    close: "Close menu",
    language: "Language",
    external: "opens in a new tab",
    contact: "Connect",
    review:
      "Editorial note: technical material has been carefully transferred from the legacy site. Verify practical instructions with an experienced practitioner and relevant local professionals.",
    footer:
      "A living knowledge home for soil, plants, animals and farming communities in Vietnam.",
    rights: "Natural Farming Vietnam. Knowledge grows through observation.",
  },
  vi: {
    skip: "Đi đến nội dung",
    nav: {
      home: "Trang chủ",
      about: "Về chúng tôi",
      plants: "Cây trồng",
      animals: "Vật nuôi",
      store: "Cửa hàng",
    },
    menu: "Menu",
    close: "Đóng menu",
    language: "Ngôn ngữ",
    external: "mở trong tab mới",
    contact: "Kết nối",
    review:
      "Lưu ý biên tập: nội dung kỹ thuật đã được chuyển cẩn thận từ website cũ. Hãy xác minh hướng dẫn thực hành với người có kinh nghiệm và chuyên gia địa phương phù hợp.",
    footer:
      "Ngôi nhà kiến thức sống dành cho đất, cây trồng, vật nuôi và cộng đồng nông nghiệp Việt Nam.",
    rights: "Natural Farming Vietnam. Kiến thức lớn lên từ quan sát.",
  },
} as const satisfies Record<Locale, object>;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
