import type { Locale } from "@/lib/i18n";

const en = {
  common: {
    skip: "Skip to content",
    menu: "Menu",
    close: "Close menu",
    language: "Language",
    external: "opens in a new tab",
    contact: "Connect",
    primaryNavigation: "Primary navigation",
    mobileNavigation: "Mobile navigation",
    footerNavigation: "Footer navigation",
    homeLabel: "Natural Farming Vietnam home",
    nav: {
      home: "Home",
      about: "About",
      plants: "Plants",
      animals: "Animals",
      store: "Store",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
    },
    review:
      "Editorial note: technical material has been carefully transferred from the legacy site. Verify practical instructions with an experienced practitioner and relevant local professionals.",
    footer:
      "A living knowledge home for soil, plants, animals and farming communities in Vietnam.",
    footerNote: "For learning, collaboration and farm conversations.",
    rights: "Natural Farming Vietnam. Knowledge grows through observation.",
    onThisPage: "On this page",
    brandTagline: "Living Soil · From soil, life begins",
    notFound: {
      eyebrow: "404",
      title: "This path has not taken root.",
      body: "The page you are looking for does not exist.",
      cta: "Return home",
    },
  },
  home: {
    heroEyebrow: "Living Soil · From soil, life begins",
    systemsEyebrow: "01 · Living systems",
    pillarsEyebrow: "02 · Soil to community",
    plantLabel: "Plants",
    animalLabel: "Animals",
    communityLabel: "Community",
    storeEyebrow: "03 · Farmbrite",
    contactEyebrow: "04 · Connect",
    title: "Life begins in living soil.",
    intro:
      "Natural Farming works with local ecosystems to nurture soil, resilient plants, healthy animals and farming communities.",
    heroAlt: "Aerial view of the tropical Natural Farming Vietnam farm",
    primary: "Discover our approach",
    secondary: "Explore the knowledge",
    what: "What is Natural Farming?",
    whatBody:
      "A way of observing and cultivating that begins with the relationships already present in a place: soil structure, organic matter, roots, microorganisms, animals and people.",
    principles: [
      [
        "Nurture soil life",
        "Build the conditions for roots and soil organisms to work together.",
      ],
      [
        "Use local resources",
        "Return suitable farm materials to useful biological cycles.",
      ],
      [
        "Reduce dependency",
        "Learn to make careful decisions with fewer external inputs.",
      ],
      [
        "Observe before acting",
        "Start small, read changes and adapt to the local context.",
      ],
    ],
    pillars: "One farm, connected lives.",
    plantTitle: "Plants begin below ground",
    plantBody:
      "Explore soil, microorganisms and the inputs commonly discussed in Natural Farming.",
    plantCta: "Explore plants",
    animalTitle: "Care shaped by natural behavior",
    animalBody:
      "Learn how housing, bedding, feed and observation support animal wellbeing.",
    animalCta: "Explore animals",
    peopleTitle: "Knowledge grows between people",
    peopleBody:
      "Natural Farming Vietnam connects practical observation with shared learning.",
    peopleCta: "Meet the project",
    storeTitle: "The store lives somewhere else.",
    storeBody:
      "Products, prices and checkout are handled by our dedicated Farmbrite store. This website stays focused on the project and its knowledge.",
    storeCta: "Visit the store",
    contactTitle: "Let’s grow knowledge together.",
    contactBody:
      "Connect with the project about learning, collaboration or applying Natural Farming in your context.",
  },
  about: {
    heroEyebrow: "About · Our story",
    purposeEyebrow: "01 · Purpose",
    valuesEyebrow: "02 · Values",
    storyEyebrow: "03 · Our story",
    metadataTitle: "About",
    title: "Rooted in place. Open to learning.",
    intro:
      "Natural Farming Vietnam is a project exploring how careful observation, local resources and shared practice can nourish land and life.",
    heroAlt: "A farmer working in a sunlit field",
    mission: "Our reason for being",
    body: [
      "Modern farming can place pressure on soil, biodiversity and farmer independence. Natural Farming offers a practical lens: understand the ecology of a place, use what is locally available and intervene with care.",
      "The project brings together cultivation, animal care, observation and learning. Its Christian roots inform a commitment to stewardship, while its knowledge and invitation remain open to everyone.",
    ],
    values: "How we approach the work",
    cards: [
      [
        "Observe",
        "Read the land, animals and seasonal change before choosing an intervention.",
      ],
      [
        "Regenerate",
        "Return organic resources to living cycles and protect the conditions for life.",
      ],
      [
        "Share",
        "Treat knowledge as a practice strengthened through transparent learning.",
      ],
      [
        "Adapt",
        "Respect that climate, culture and each farm require contextual decisions.",
      ],
    ],
    truth: "A story still being documented",
    truthBody:
      "Confirmed milestones, team profiles, partner names and operating regions have not yet been supplied for publication. This section deliberately avoids invented claims and is ready for project-owner content.",
    gardenAlt: "Tropical garden at Natural Farming Vietnam",
    cta: "Start a conversation",
  },
  legal: {
    privacy: {
      title: "Privacy Policy",
      description:
        "Privacy information for the Natural Farming Vietnam website.",
    },
    terms: {
      title: "Terms & Conditions",
      description:
        "Terms governing use of the Natural Farming Vietnam website.",
    },
    eyebrow: "Website information",
    pendingTitle: "Content pending legal review",
    pendingBody:
      "The legacy website contains placeholder text rather than a valid policy. Natural Farming Vietnam is reviewing the official content before publication. Please contact us if you have a privacy or website-use question in the meantime.",
    sourceNote:
      "This notice deliberately replaces invalid Lorem Ipsum content found on the legacy page; no legal terms have been invented.",
    contactCta: "Contact Natural Farming Vietnam",
  },
} as const;

type LocalizedShape<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? readonly LocalizedShape<Item>[]
    : { [Key in keyof T]: LocalizedShape<T[Key]> };

export type SiteContent = LocalizedShape<typeof en>;

const vi: SiteContent = {
  common: {
    skip: "Đi đến nội dung",
    menu: "Menu",
    close: "Đóng menu",
    language: "Ngôn ngữ",
    external: "mở trong tab mới",
    contact: "Kết nối",
    primaryNavigation: "Điều hướng chính",
    mobileNavigation: "Điều hướng di động",
    footerNavigation: "Điều hướng chân trang",
    homeLabel: "Trang chủ Natural Farming Vietnam",
    nav: {
      home: "Trang chủ",
      about: "Về chúng tôi",
      plants: "Cây trồng",
      animals: "Vật nuôi",
      store: "Cửa hàng",
      privacy: "Chính sách quyền riêng tư",
      terms: "Điều khoản & Điều kiện",
    },
    review:
      "Lưu ý biên tập: nội dung kỹ thuật đã được chuyển cẩn thận từ website cũ. Hãy xác minh hướng dẫn thực hành với người có kinh nghiệm và chuyên gia địa phương phù hợp.",
    footer:
      "Ngôi nhà kiến thức sống dành cho đất, cây trồng, vật nuôi và cộng đồng nông nghiệp Việt Nam.",
    footerNote: "Dành cho trao đổi học tập, hợp tác và câu chuyện nông trại.",
    rights: "Natural Farming Vietnam. Kiến thức lớn lên từ quan sát.",
    onThisPage: "Trong trang này",
    brandTagline: "Đất sống · Từ đất, sự sống bắt đầu",
    notFound: {
      eyebrow: "404",
      title: "Lối đi này chưa bén rễ.",
      body: "Trang bạn đang tìm không tồn tại.",
      cta: "Về trang chủ",
    },
  },
  home: {
    heroEyebrow: "Đất sống · Từ đất, sự sống bắt đầu",
    systemsEyebrow: "01 · Hệ sống",
    pillarsEyebrow: "02 · Từ đất đến cộng đồng",
    plantLabel: "Cây trồng",
    animalLabel: "Vật nuôi",
    communityLabel: "Cộng đồng",
    storeEyebrow: "03 · Farmbrite",
    contactEyebrow: "04 · Kết nối",
    title: "Sự sống bắt đầu từ đất sống.",
    intro:
      "Nông nghiệp tự nhiên cùng hệ sinh thái bản địa nuôi dưỡng đất, cây trồng bền bỉ, vật nuôi khỏe mạnh và cộng đồng nông nghiệp.",
    heroAlt:
      "Toàn cảnh trên cao của nông trại nhiệt đới Natural Farming Vietnam",
    primary: "Khám phá cách tiếp cận",
    secondary: "Khám phá kho kiến thức",
    what: "Natural Farming là gì?",
    whatBody:
      "Một cách quan sát và canh tác bắt đầu từ các mối quan hệ đã có ở mỗi nơi: cấu trúc đất, vật liệu hữu cơ, rễ, vi sinh vật, vật nuôi và con người.",
    principles: [
      [
        "Nuôi dưỡng sự sống trong đất",
        "Tạo điều kiện để rễ cây và sinh vật đất cùng làm việc.",
      ],
      [
        "Dùng nguồn lực bản địa",
        "Đưa vật liệu phù hợp tại nông trại trở lại các vòng tuần hoàn sinh học.",
      ],
      [
        "Giảm sự phụ thuộc",
        "Học cách đưa ra quyết định thận trọng với ít đầu vào bên ngoài hơn.",
      ],
      [
        "Quan sát trước khi hành động",
        "Bắt đầu nhỏ, đọc thay đổi và thích nghi với bối cảnh địa phương.",
      ],
    ],
    pillars: "Một nông trại, những sự sống kết nối.",
    plantTitle: "Cây bắt đầu từ dưới mặt đất",
    plantBody:
      "Khám phá đất, vi sinh vật và các đầu vào thường gặp trong Natural Farming.",
    plantCta: "Khám phá cây trồng",
    animalTitle: "Chăm sóc theo tập tính tự nhiên",
    animalBody:
      "Tìm hiểu cách chuồng trại, nền lót, thức ăn và quan sát hỗ trợ phúc lợi vật nuôi.",
    animalCta: "Khám phá vật nuôi",
    peopleTitle: "Kiến thức lớn lên giữa con người",
    peopleBody:
      "Natural Farming Vietnam kết nối quan sát thực hành với việc học hỏi cùng nhau.",
    peopleCta: "Tìm hiểu dự án",
    storeTitle: "Cửa hàng ở một không gian riêng.",
    storeBody:
      "Sản phẩm, giá và thanh toán được xử lý tại cửa hàng Farmbrite. Website này tập trung vào dự án và kiến thức.",
    storeCta: "Đến cửa hàng",
    contactTitle: "Cùng nhau nuôi lớn tri thức.",
    contactBody:
      "Kết nối với dự án về học tập, hợp tác hoặc áp dụng Natural Farming trong bối cảnh của bạn.",
  },
  about: {
    heroEyebrow: "Về chúng tôi · Câu chuyện",
    purposeEyebrow: "01 · Mục đích",
    valuesEyebrow: "02 · Giá trị",
    storyEyebrow: "03 · Câu chuyện",
    metadataTitle: "Về chúng tôi",
    title: "Bám rễ tại nơi chốn. Rộng mở để học hỏi.",
    intro:
      "Natural Farming Vietnam là dự án khám phá cách quan sát thận trọng, nguồn lực bản địa và thực hành chung có thể nuôi dưỡng đất và sự sống.",
    heroAlt: "Người nông dân làm việc trên cánh đồng trong nắng",
    mission: "Lý do chúng tôi hiện diện",
    body: [
      "Nông nghiệp hiện đại có thể tạo áp lực lên đất, đa dạng sinh học và tính tự chủ của người nông dân. Natural Farming đem đến một góc nhìn thực hành: hiểu sinh thái nơi chốn, dùng những gì sẵn có tại địa phương và can thiệp thận trọng.",
      "Dự án kết nối canh tác, chăm sóc vật nuôi, quan sát và học hỏi. Căn tính Cơ Đốc nuôi dưỡng cam kết quản gia có trách nhiệm, trong khi kiến thức và lời mời tham gia luôn rộng mở với mọi người.",
    ],
    values: "Cách chúng tôi tiếp cận công việc",
    cards: [
      [
        "Quan sát",
        "Đọc đất, vật nuôi và thay đổi mùa vụ trước khi chọn cách can thiệp.",
      ],
      [
        "Tái sinh",
        "Đưa nguồn hữu cơ trở lại vòng tuần hoàn sống và bảo vệ điều kiện cho sự sống.",
      ],
      [
        "Chia sẻ",
        "Xem kiến thức là một thực hành mạnh lên qua việc học hỏi minh bạch.",
      ],
      [
        "Thích nghi",
        "Tôn trọng khí hậu, văn hóa và bối cảnh riêng của mỗi nông trại.",
      ],
    ],
    truth: "Một câu chuyện đang được ghi lại",
    truthBody:
      "Các cột mốc, hồ sơ đội ngũ, tên đối tác và khu vực hoạt động đã xác nhận chưa được cung cấp để xuất bản. Phần này chủ động không tạo thông tin giả và sẵn sàng nhận nội dung từ chủ dự án.",
    gardenAlt: "Khu vườn nhiệt đới tại Natural Farming Vietnam",
    cta: "Bắt đầu trao đổi",
  },
  legal: {
    privacy: {
      title: "Chính sách quyền riêng tư",
      description:
        "Thông tin quyền riêng tư dành cho website Natural Farming Vietnam.",
    },
    terms: {
      title: "Điều khoản & Điều kiện",
      description: "Điều khoản sử dụng website Natural Farming Vietnam.",
    },
    eyebrow: "Thông tin website",
    pendingTitle: "Nội dung đang chờ rà soát pháp lý",
    pendingBody:
      "Website cũ chỉ chứa nội dung mẫu, không phải chính sách hợp lệ. Natural Farming Vietnam đang rà soát nội dung chính thức trước khi xuất bản. Trong thời gian này, vui lòng liên hệ nếu bạn có câu hỏi về quyền riêng tư hoặc việc sử dụng website.",
    sourceNote:
      "Thông báo này chủ động thay thế nội dung Lorem Ipsum không hợp lệ trên trang cũ; không có điều khoản pháp lý nào được tự tạo.",
    contactCta: "Liên hệ Natural Farming Vietnam",
  },
};

export const siteContent: Record<Locale, SiteContent> = { en, vi };
export function getSiteContent(locale: Locale) {
  return siteContent[locale];
}
