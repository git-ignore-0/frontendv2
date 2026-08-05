import type { Locale } from "@/lib/i18n";

const en = {
  common: {
    skip: "Skip to content",
    menu: "Menu",
    close: "Close menu",
    language: "Language",
    external: "opens in a new tab",
    contact: "Connect",
    email: "Email",
    phone: "Phone",
    location: "Location",
    facebook: "Facebook",
    youtube: "YouTube",
    socialLinks: "Social media",
    primaryNavigation: "Primary navigation",
    mobileNavigation: "Mobile navigation",
    footerNavigation: "Footer navigation",
    referralFab: "Invite friends, earn rewards",
    homeLabel: "Natural Farming Vietnam home",
    nav: {
      home: "Home",
      about: "About",
      plants: "Plants",
      animals: "Animals",
      workshops: "Workshops",
      csa: "CSA",
      store: "Store",
      forum: "Forum",
      account: "Account",
      accountOwner: "Account of",
      currentPoints: "Current points",
      pointsHistory: "Point history",
      editAccount: "Edit profile",
      points: "Points",
      rewards: "Redeem rewards",
      referFriends: "Referral code",
      membership: "CSA Membership",
      register: "Create account",
      signIn: "Sign in",
      signOut: "Sign out",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
    },
    footer:
      "A living knowledge home for soil, plants, animals and farming communities in Vietnam.",
    footerNote: "For learning, collaboration and farm conversations.",
    rights: "Natural Farming Vietnam. Knowledge grows through observation.",
    onThisPage: "On this page",
    brandTagline: "Living Soil · From soil, life begins",
    legacyReference: "Reference material",
    notFound: {
      eyebrow: "404",
      title: "This path has not taken root.",
      body: "The page you are looking for does not exist.",
      cta: "Return home",
    },
  },
  account: {
    navigation: "Account navigation",
    points: "Points",
    referral: "Referral code",
    invited: "People invited",
    logout: "Sign out",
    balance: "Current balance",
    balanceUnavailable: "Balance unavailable",
    pointsUnit: "points",
    history: "Point history",
    pointsTitle: "Your points",
    pointsSubtitle: "Your reward points earned and used",
    pointsBalanceLabel: "Current",
    redeemRewards: "Redeem rewards",
    redeemRewardsNow: "Redeem now",
    redemptionHistory: "Redemption history",
    historyEmpty: "No point transactions yet.",
    credit: "Credit",
    debit: "Debit",
    codeLabel: "Your referral code",
    copy: "Copy code",
    copiedButton: "Copied",
    copied: "Referral code copied.",
    copyFailed: "We could not copy the referral code. Please copy it manually.",
    enterCode: "Enter a referral code",
    codePlaceholder: "Referral code",
    submitCode: "Submit code",
    submitting: "Submitting…",
    referredBy: "You were referred by {name}.",
    invalidCode: "That referral code is not valid.",
    selfReferral: "You cannot use your own referral code.",
    alreadyReferred: "A referral code has already been linked to this account.",
    invitedCount: "{count} people invited",
    invitedBack: "Back to Referral code",
    invitedSubtitle: "People who created an account with your referral code.",
    invitedTotal: "{count} people",
    invitedTotalOne: "{count} person",
    invitedPersonContext: "Joined with your referral code",
    invitedEmpty:
      "You have not invited anyone yet. Share your referral code with friends.",
    joined: "Joined",
    previous: "Previous",
    next: "Next",
    back: "Back",
    page: "Page {page} of {pages}",
    paginationLabel: "List pagination",
    loading: "Loading account…",
    error: "We could not load your account. Please try again.",
    retry: "Try again",
    signedOutTitle: "Sign in to view your account",
    signedOutBody:
      "Your referral code and points are available after you sign in.",
    signIn: "Sign in",
    signInToRedeem: "Sign in to redeem {name}",
    signInToRedeemLabel: "Sign in to redeem",
    referralProgramMetadataTitle: "Invite friends and earn rewards",
    referralProgramTitle: "Invite friends, earn rewards",
    referralProgramIntro:
      "Share farm-fresh food with people you trust. When an eligible order is confirmed, you earn points to redeem for available produce.",
    programTitle: "How it works",
    programSubtitle: "Three simple steps from sharing to earning.",
    programSteps: [
      {
        title: "Share your code",
        body: "Send your personal referral code to a friend you trust.",
      },
      {
        title: "They place their first order",
        body: "Your friend creates an account with your code and completes their first eligible order.",
      },
      {
        title: "You earn points",
        body: "Our team confirms the eligible order and adds 100 points to your account.",
      },
    ],
    programRewardsTitle: "What you earn",
    programRewardsIntro:
      "Use your points for rewards currently available from the farm.",
    successfulReferralPoints: "100",
    successfulReferralLabel: "points for each successful referral",
    secondOrderBonus: "+50",
    secondOrderBonusLabel:
      "bonus points when your friend places a second order within 60 days",
    eligibilityTitle: "Conditions for earning points",
    eligibilityItems: [
      "Your friend must be a new customer who is not already in our records.",
      "Their first order must be paid, delivered and worth at least 300,000₫.",
      "The eligible first order must be completed within 30 days of the referral.",
      "Each person can receive rewards for up to 10 successful referrals per month.",
      "Points expire 12 months after your latest order or reward redemption.",
    ],
    getCodeTitle: "Get your referral code",
    getCodeBody:
      "Sign in to copy your personal code, track points and see the friends you have invited.",
    signInForCode: "Sign in to get your code",
    personalCodeLoading: "Loading your referral code…",
    personalCodeError: "We could not load your referral code.",
    enterCodeTitle: "Were you invited?",
    rewardsMetadataTitle: "Reward catalog",
    catalogIntro:
      "This catalog reflects the rewards currently available from our team.",
    catalogLoading: "Loading available rewards…",
    catalogEmpty: "There are no rewards available right now.",
    catalogError: "We could not load the reward catalog. Please try again.",
    rewardPoints: "{points} points",
    redeem: "Redeem",
    notEnoughPoints: "Not enough points",
    openRedemption: "Redeem {name}",
    dialogTitle: "Confirm your reward",
    dialogDescription:
      "Review this request before using your points. The server will verify the final balance and reward cost.",
    closeDialog: "Close dialog",
    rewardName: "Reward",
    pointsRequired: "Points required",
    balanceAfterRedemption: "Balance after redemption",
    cancel: "Cancel",
    confirmRedemption: "Confirm redemption",
    confirmingRedemption: "Submitting…",
    redemptionError:
      "We could not submit this request. You can retry without creating a duplicate.",
    redemptionInsufficient:
      "Your current balance is not enough for this reward. Refresh to see the latest balance.",
    redemptionInactive: "This reward is no longer active.",
    redemptionUnavailable: "This reward is no longer available.",
    redemptionConflict:
      "This redemption attempt conflicts with an earlier request. Close it and start again.",
    redemptionSuccessTitle: "Redemption request received",
    redemptionSuccessBody:
      "Your points were updated and our team will review your request.",
    dismissConfirmation: "Dismiss confirmation",
    redemptionsMetadataTitle: "Redemption history",
    redemptionsTitle: "Reward request history",
    redemptionsEmpty: "You have not redeemed a reward yet.",
    redemptionsLoading: "Loading redemption history…",
    redemptionsError:
      "We could not load your redemption history. Please try again.",
    pointsUsed: "Points used",
    redemptionNote: "Note",
    statusPending: "Pending",
    statusContacted: "Contacted",
    statusCompleted: "Completed",
    statusRejected: "Rejected",
    backToRewards: "Back to rewards",
    membershipMetadataTitle: "Your CSA membership",
    membershipTitle: "Your CSA membership",
    membershipSubtitle:
      "Track your active membership and what remains in this cycle.",
    membershipUsageMetadataTitle: "Product collection history",
    membershipUsageTitle: "Product collection history",
    membershipUsageSubtitle: "Products collected through your CSA membership.",
    membershipLoading: "Loading Membership…",
    membershipError: "We could not load your Membership. Please try again.",
    membershipEmpty:
      "You do not have an active CSA membership. Explore the packages currently available from the farm.",
    viewCsa: "View CSA packages",
    membershipScheduled: "Scheduled",
    membershipActive: "Active",
    membershipEnded: "Ended",
    membershipStartDate: "Start date",
    membershipEndDate: "End date",
    membershipDuration: "Purchased duration",
    membershipMonth: "{count} month",
    membershipMonths: "{count} months",
    membershipMonthlyPrice: "Monthly price at purchase",
    membershipTotalPrice: "Total paid",
    membershipQuotaPolicy: "Unused quantity",
    membershipExpire: "Unused quantity does not carry over to the next month",
    membershipRollover:
      "Unused quantity carries over only within a multi-month membership",
    membershipScheduledNotice:
      "This membership will begin on {date}. Product quantities are not available yet.",
    membershipQuotaTitle: "Products in your membership",
    membershipQuotaEmpty: "There are no products available in this cycle.",
    membershipQuotaPerCycle: "This cycle",
    membershipRemaining: "Remaining",
    membershipUsageHistory: "Product collection history",
    backToMembership: "Back to your CSA membership",
    membershipUsageLoading: "Loading product collection history…",
    membershipUsageError:
      "We could not load product collection history. Please try again.",
    membershipUsageEmpty: "No product collections have been recorded.",
    membershipUsageProducts: "Products",
    membershipUsageNote: "Note",
    membershipUsageApplied: "Recorded",
    membershipUsageReversed: "Reversed",
    membershipUsageReversalReason: "Reversal reason",
  },
  csa: {
    metadataTitle: "Community Supported Agriculture",
    eyebrow: "Community Supported Agriculture",
    title: "Farm-fresh produce, delivered weekly",
    intro:
      "Join our community to receive seasonal vegetables weekly and support local farming families.",
    benefits: [
      {
        label: "Receive products weekly",
        icon: "calendar",
      },
      {
        label: "Free delivery for CSA members",
        icon: "truck",
      },
      {
        label: "Products updated early in the week",
        icon: "refresh",
      },
      {
        label: "From farm to table within 24 hours",
        icon: "clock",
      },
    ],
    timelineTitle: "How does a typical week work?",
    timeline: [
      {
        day: "Mon",
        description: "The farm updates which products are available.",
      },
      {
        day: "Tue",
        description: "The team sends the product list to members.",
      },
      {
        day: "Wed",
        description: "Members finalize their selections and orders.",
      },
      {
        day: "Thu",
        description: "Farmers harvest and the team packs orders.",
      },
      {
        day: "Fri",
        description: "Products are delivered to your door.",
      },
    ],
    packagesTitle: "Packages open for registration",
    packagesLoading: "Loading packages…",
    packagesError: "We could not load packages. Please try again.",
    packagesEmpty: "There are no packages available right now.",
    retry: "Try again",
    paginationLabel: "Package pagination",
    previousPage: "Previous",
    nextPage: "Next",
    pageSummary: "Page {page}/{pages}",
    months: "{count} months",
    month: "{count} month",
    priceOptions: "Available durations",
    monthlyPrice: "Per month",
    totalPrice: "Total",
    saving: "Save {amount}",
    bestSavings: "Best savings",
    buyOnFarmbrite: "Buy now",
    expire: "Unused quantity does not carry over to the next month",
    rollover:
      "Unused quantity carries over only within a multi-month membership",
    includedProducts: "Quantity you can use each month",
    cycle: "month",
    whyTitle: "Why Natural Farming Vietnam?",
    whyReasons: [
      {
        title: "Support the local farming economy",
        body: "Help keep money circulating within the community, create jobs, and strengthen the economic health of the area.",
      },
      {
        title: "Support sustainable growing practices",
        body: "Natural Farming produces its own organic fertilizer and uses bio-integrated pest management instead of harmful chemicals.",
      },
      {
        title: "Support biodiversity and soil health",
        body: "Our farmers grow a large variety of produce which helps keep food sources genetically strong and soil healthy by preventing monocultures.",
      },
    ],
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
      "Natural Farming Vietnam is reviewing the official content before publication. Please contact us if you have a privacy or website-use question in the meantime.",
    sourceNote:
      "No legal terms have been inferred or published before formal review.",
    contactCta: "Contact Natural Farming Vietnam",
  },
  storeGuide: {
    title: "Shop Natural Farming Vietnam",
    intro:
      "Choose the best way to browse and order fresh products through our Farmbrite store.",
    howToShopTitle: "Explore options from the farm",
    csaCard: {
      title: "CSA & Membership members",
      body: "See the items available this week and choose products marked |C using your CSA or Membership allowance.",
      cta: "View this week’s CSA items",
      url: "https://store.farmbrite.com/store/nntn/products?category=CSA",
    },
    individualCard: {
      title: "Shop individual items",
      body: "Browse all available vegetables, herbs, fruit, and other products. You can also add extra items beyond your CSA allowance.",
      cta: "Browse all products",
      url: "https://store.farmbrite.com/store/nntn",
    },
    livePlantsCard: {
      title: "Live plants",
      body: "Browse live plants and seedlings currently available from our farm.",
      cta: "Browse live plants",
      url: "https://store.farmbrite.com/store/nntn/products?category=Live%20Plants",
    },
    csaPromo: "New to CSA? Learn how the CSA program works.",
    csaPromoLink: "Explore CSA",
    faqTitle: "Ordering questions",
    faqItems: [
      {
        question: "How do I choose my weekly CSA items?",
        answer:
          "Visit the Farmbrite store and navigate to the 'CSA' category. Add items marked with '|C' to your cart up to your plan's limit.",
      },
      {
        question: "What does |C mean?",
        answer:
          "Items marked with '|C' in the CSA category use your included allowance. The Farmbrite cart shows your remaining included quantity.",
      },
      {
        question: "Why do some products appear twice in the store?",
        answer:
          "One version is marked with '|C' for CSA members to use with their allowance, while the other is for standard purchase. Unavailable CSA items simply do not appear in the CSA category.",
      },
      {
        question: "Can I add extra individual items to the same order?",
        answer:
          "Yes, you can mix standard non-|C products with your CSA order. The standard non-|C products are regular paid items and are charged separately.",
      },
      {
        question: "What does “Backordered” mean?",
        answer:
          "In regular product categories, “Backordered” means an item is temporarily unavailable. In the CSA category, unavailable items simply do not appear.",
      },
      {
        question: "How do payment and delivery work?",
        answer:
          "At checkout, select 'Cash' or 'Invoice Me'. CSA delivery is free. Delivery fees for Monthly Membership and individual-item orders are calculated and shown in the Farmbrite cart.",
      },
      {
        question: "How can I change my CSA plan or household size?",
        answer:
          "Any plan or household changes require contacting Natural Farming Vietnam directly on Zalo.",
      },
    ],
    zaloTitle: "Need help with your order?",
    zaloBody:
      "Message Natural Farming Vietnam on Zalo for help choosing a plan, ordering, or changing an existing membership.",
    zaloCta: "Contact us on Zalo",
    zaloUrl: "https://zalo.me/84988158285",
  },
} as const;

type LocalizedShape<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? readonly LocalizedShape<Item>[]
    : { [Key in keyof T]: LocalizedShape<T[Key]> };

export type SiteContent = LocalizedShape<typeof en>;
export type CommonDictionary = SiteContent["common"];

const vi: SiteContent = {
  common: {
    skip: "Đi đến nội dung",
    menu: "Menu",
    close: "Đóng menu",
    language: "Ngôn ngữ",
    external: "mở trong tab mới",
    contact: "Kết nối",
    email: "Email",
    phone: "Điện thoại",
    location: "Địa điểm",
    facebook: "Facebook",
    youtube: "YouTube",
    socialLinks: "Mạng xã hội",
    primaryNavigation: "Điều hướng chính",
    mobileNavigation: "Điều hướng di động",
    footerNavigation: "Điều hướng chân trang",
    referralFab: "Giới thiệu bạn, nhận quà",
    homeLabel: "Trang chủ Natural Farming Vietnam",
    nav: {
      home: "Trang chủ",
      about: "Về chúng tôi",
      plants: "Cây trồng",
      animals: "Vật nuôi",
      workshops: "Workshop",
      csa: "CSA",
      store: "Cửa hàng",
      forum: "Diễn đàn",
      account: "Tài khoản",
      accountOwner: "Tài khoản của",
      currentPoints: "Điểm hiện có",
      pointsHistory: "Lịch sử điểm",
      editAccount: "Chỉnh sửa thông tin",
      points: "Điểm",
      rewards: "Đổi quà",
      referFriends: "Mã giới thiệu",
      membership: "Membership CSA",
      register: "Tạo tài khoản",
      signIn: "Đăng nhập",
      signOut: "Đăng xuất",
      privacy: "Chính sách quyền riêng tư",
      terms: "Điều khoản & Điều kiện",
    },
    footer:
      "Ngôi nhà kiến thức sống dành cho đất, cây trồng, vật nuôi và cộng đồng nông nghiệp Việt Nam.",
    footerNote: "Dành cho trao đổi học tập, hợp tác và câu chuyện nông trại.",
    rights: "Natural Farming Vietnam. Kiến thức lớn lên từ quan sát.",
    onThisPage: "Trong trang này",
    brandTagline: "Đất sống · Từ đất, sự sống bắt đầu",
    legacyReference: "Tư liệu tham khảo",
    notFound: {
      eyebrow: "404",
      title: "Lối đi này chưa bén rễ.",
      body: "Trang bạn đang tìm không tồn tại.",
      cta: "Về trang chủ",
    },
  },
  account: {
    navigation: "Điều hướng tài khoản",
    points: "Điểm",
    referral: "Mã mời",
    invited: "Người bạn đã mời",
    logout: "Đăng xuất",
    balance: "Số dư hiện tại",
    balanceUnavailable: "Chưa thể tải số dư",
    pointsUnit: "điểm",
    history: "Lịch sử điểm",
    pointsTitle: "Điểm của bạn",
    pointsSubtitle: "Lịch sử nhận và sử dụng điểm thưởng",
    pointsBalanceLabel: "Hiện có",
    redeemRewards: "Đổi quà",
    redeemRewardsNow: "Đổi quà ngay",
    redemptionHistory: "Lịch sử đổi quà",
    historyEmpty: "Chưa có giao dịch điểm.",
    credit: "Cộng điểm",
    debit: "Trừ điểm",
    codeLabel: "Mã mời của bạn",
    copy: "Sao chép mã",
    copiedButton: "Đã sao chép",
    copied: "Đã sao chép mã giới thiệu.",
    copyFailed: "Không thể sao chép mã giới thiệu. Vui lòng sao chép thủ công.",
    enterCode: "Nhập mã giới thiệu",
    codePlaceholder: "Mã giới thiệu",
    submitCode: "Gửi mã",
    submitting: "Đang gửi…",
    referredBy: "Bạn được giới thiệu bởi {name}.",
    invalidCode: "Mã giới thiệu không hợp lệ.",
    selfReferral: "Bạn không thể dùng mã giới thiệu của chính mình.",
    alreadyReferred: "Tài khoản này đã được liên kết với một mã giới thiệu.",
    invitedCount: "Đã giới thiệu {count} người",
    invitedBack: "Quay lại Mã giới thiệu",
    invitedSubtitle: "Những người đã tạo tài khoản bằng mã giới thiệu của bạn.",
    invitedTotal: "{count} người",
    invitedTotalOne: "{count} người",
    invitedPersonContext: "Tham gia bằng mã giới thiệu của bạn",
    invitedEmpty:
      "Bạn chưa mời ai. Hãy chia sẻ mã giới thiệu của mình với bạn bè.",
    joined: "Đã tham gia",
    previous: "Trước",
    next: "Sau",
    back: "Quay lại",
    page: "Trang {page}/{pages}",
    paginationLabel: "Phân trang danh sách",
    loading: "Đang tải tài khoản…",
    error: "Không thể tải tài khoản. Vui lòng thử lại.",
    retry: "Thử lại",
    signedOutTitle: "Đăng nhập để xem tài khoản",
    signedOutBody:
      "Mã giới thiệu và điểm của bạn sẽ hiển thị sau khi đăng nhập.",
    signIn: "Đăng nhập",
    signInToRedeem: "Đăng nhập để đổi {name}",
    signInToRedeemLabel: "Đăng nhập để đổi quà",
    referralProgramMetadataTitle: "Giới thiệu bạn nhận quà",
    referralProgramTitle: "Giới thiệu bạn, nhận quà",
    referralProgramIntro:
      "Chia sẻ thực phẩm tươi từ nông trại với người bạn tin tưởng. Khi đơn hàng đủ điều kiện được xác nhận, bạn nhận điểm để đổi quà đang có.",
    programTitle: "Chương trình hoạt động thế nào?",
    programSubtitle: "Ba bước đơn giản từ chia sẻ đến nhận điểm.",
    programSteps: [
      {
        title: "Chia sẻ mã mời",
        body: "Gửi mã mời cá nhân cho người bạn tin tưởng.",
      },
      {
        title: "Bạn của bạn đặt đơn đầu tiên",
        body: "Bạn của bạn tạo tài khoản bằng mã mời và hoàn tất đơn hàng đầu tiên đủ điều kiện.",
      },
      {
        title: "Bạn nhận điểm",
        body: "Đội ngũ xác nhận đơn đủ điều kiện và cộng 100 điểm vào tài khoản của bạn.",
      },
    ],
    programRewardsTitle: "Bạn nhận được gì?",
    programRewardsIntro:
      "Dùng điểm để đổi những phần quà hiện có từ nông trại.",
    successfulReferralPoints: "100",
    successfulReferralLabel: "điểm cho mỗi lượt giới thiệu thành công",
    secondOrderBonus: "+50",
    secondOrderBonusLabel:
      "điểm thưởng khi người bạn đặt đơn thứ hai trong vòng 60 ngày",
    eligibilityTitle: "Điều kiện nhận điểm",
    eligibilityItems: [
      "Người được giới thiệu phải là khách hàng mới, chưa có trong hệ thống.",
      "Đơn đầu tiên phải được thanh toán, giao thành công và có giá trị từ 300.000₫.",
      "Đơn đầu tiên đủ điều kiện phải hoàn tất trong vòng 30 ngày kể từ khi được giới thiệu.",
      "Mỗi người được nhận thưởng tối đa 10 lượt giới thiệu thành công mỗi tháng.",
      "Điểm hết hạn sau 12 tháng kể từ đơn hàng hoặc lần đổi quà gần nhất.",
    ],
    getCodeTitle: "Nhận mã mời của bạn",
    getCodeBody:
      "Đăng nhập để sao chép mã cá nhân, theo dõi điểm và xem những người bạn đã mời.",
    signInForCode: "Đăng nhập để nhận mã",
    personalCodeLoading: "Đang tải mã mời…",
    personalCodeError: "Không thể tải mã mời của bạn.",
    enterCodeTitle: "Bạn được ai đó giới thiệu?",
    rewardsMetadataTitle: "Danh sách quà",
    catalogIntro:
      "Danh mục này được cập nhật theo các phần quà hiện đang được đội ngũ cung cấp.",
    catalogLoading: "Đang tải danh sách quà…",
    catalogEmpty: "Hiện chưa có phần quà nào để đổi.",
    catalogError: "Không thể tải danh sách quà. Vui lòng thử lại.",
    rewardPoints: "{points} điểm",
    redeem: "Đổi quà",
    notEnoughPoints: "Chưa đủ điểm",
    openRedemption: "Đổi {name}",
    dialogTitle: "Xác nhận đổi quà",
    dialogDescription:
      "Kiểm tra yêu cầu trước khi dùng điểm. Máy chủ sẽ xác nhận số dư và mức điểm cuối cùng.",
    closeDialog: "Đóng hộp thoại",
    rewardName: "Phần quà",
    pointsRequired: "Điểm cần dùng",
    balanceAfterRedemption: "Điểm còn lại",
    cancel: "Hủy",
    confirmRedemption: "Xác nhận đổi quà",
    confirmingRedemption: "Đang gửi…",
    redemptionError:
      "Không thể gửi yêu cầu. Bạn có thể thử lại mà không tạo yêu cầu trùng.",
    redemptionInsufficient:
      "Số dư hiện tại không đủ cho phần quà này. Hãy tải lại để xem số dư mới nhất.",
    redemptionInactive: "Phần quà này đã ngừng hoạt động.",
    redemptionUnavailable: "Phần quà này không còn khả dụng.",
    redemptionConflict:
      "Lần đổi quà này xung đột với một yêu cầu trước đó. Hãy đóng và bắt đầu lại.",
    redemptionSuccessTitle: "Đã nhận yêu cầu đổi quà",
    redemptionSuccessBody:
      "Điểm của bạn đã được cập nhật và đội ngũ sẽ xem xét yêu cầu.",
    dismissConfirmation: "Đóng thông báo",
    redemptionsMetadataTitle: "Lịch sử đổi quà",
    redemptionsTitle: "Lịch sử yêu cầu đổi quà",
    redemptionsEmpty: "Bạn chưa có yêu cầu đổi quà nào.",
    redemptionsLoading: "Đang tải lịch sử đổi quà…",
    redemptionsError: "Không thể tải lịch sử đổi quà. Vui lòng thử lại.",
    pointsUsed: "Điểm đã dùng",
    redemptionNote: "Ghi chú",
    statusPending: "Chờ xử lý",
    statusContacted: "Đã liên hệ",
    statusCompleted: "Đã hoàn tất",
    statusRejected: "Đã từ chối",
    backToRewards: "Quay lại Đổi quà",
    membershipMetadataTitle: "Gói CSA của bạn",
    membershipTitle: "Gói CSA của bạn",
    membershipSubtitle:
      "Theo dõi gói hiện tại và số lượng còn lại trong chu kỳ.",
    membershipUsageMetadataTitle: "Lịch sử nhận sản phẩm",
    membershipUsageTitle: "Lịch sử nhận sản phẩm",
    membershipUsageSubtitle: "Các sản phẩm bạn đã nhận trong gói CSA.",
    membershipLoading: "Đang tải Membership…",
    membershipError: "Không thể tải Membership. Vui lòng thử lại.",
    membershipEmpty:
      "Bạn chưa có gói CSA đang hoạt động. Hãy khám phá các gói hiện có từ nông trại.",
    viewCsa: "Xem các gói CSA",
    membershipScheduled: "Đã lên lịch",
    membershipActive: "Đang hoạt động",
    membershipEnded: "Đã kết thúc",
    membershipStartDate: "Ngày bắt đầu",
    membershipEndDate: "Ngày kết thúc",
    membershipDuration: "Thời hạn đã mua",
    membershipMonth: "{count} tháng",
    membershipMonths: "{count} tháng",
    membershipMonthlyPrice: "Giá mỗi tháng khi mua",
    membershipTotalPrice: "Tổng tiền đã mua",
    membershipQuotaPolicy: "Số lượng chưa dùng",
    membershipExpire: "Số lượng chưa dùng không cộng sang tháng sau",
    membershipRollover:
      "Số lượng chưa dùng chỉ được cộng sang tháng sau trong gói nhiều tháng",
    membershipScheduledNotice:
      "Gói này sẽ bắt đầu từ {date}. Số lượng sản phẩm chưa khả dụng.",
    membershipQuotaTitle: "Sản phẩm trong gói",
    membershipQuotaEmpty: "Chu kỳ này chưa có sản phẩm khả dụng.",
    membershipQuotaPerCycle: "Trong chu kỳ này",
    membershipRemaining: "Còn lại",
    membershipUsageHistory: "Lịch sử nhận sản phẩm",
    backToMembership: "Quay lại Gói CSA của bạn",
    membershipUsageLoading: "Đang tải lịch sử nhận sản phẩm…",
    membershipUsageError:
      "Không thể tải lịch sử nhận sản phẩm. Vui lòng thử lại.",
    membershipUsageEmpty: "Chưa có lần nhận sản phẩm nào.",
    membershipUsageProducts: "Sản phẩm",
    membershipUsageNote: "Ghi chú",
    membershipUsageApplied: "Đã ghi nhận",
    membershipUsageReversed: "Đã hoàn tác",
    membershipUsageReversalReason: "Lý do hoàn tác",
  },
  csa: {
    metadataTitle: "Nông nghiệp cộng đồng",
    eyebrow: "Nông nghiệp cộng đồng",
    title: "Rau từ nông trại, giao tận nhà hằng tuần",
    intro:
      "Tham gia chương trình để nhận rau theo mùa hằng tuần và đồng hành cùng nông hộ địa phương.",
    benefits: [
      {
        label: "Nhận hàng hằng tuần",
        icon: "calendar",
      },
      {
        label: "Miễn phí giao hàng cho thành viên CSA",
        icon: "truck",
      },
      {
        label: "Sản phẩm được cập nhật đầu tuần",
        icon: "refresh",
      },
      {
        label: "Từ nông trại đến bàn ăn trong 24 giờ",
        icon: "clock",
      },
    ],
    timelineTitle: "Một tuần giao nhận diễn ra như thế nào?",
    timeline: [
      {
        day: "T2",
        description: "Nông trại cập nhật sản phẩm sẵn có.",
      },
      {
        day: "T3",
        description: "Đội ngũ gửi danh sách sản phẩm cho thành viên.",
      },
      {
        day: "T4",
        description: "Khách chốt lựa chọn và đơn hàng.",
      },
      {
        day: "T5",
        description: "Nông dân thu hoạch, đội ngũ đóng gói.",
      },
      {
        day: "T6",
        description: "Giao sản phẩm tận nhà.",
      },
    ],
    packagesTitle: "Các gói đang mở đăng ký",
    packagesLoading: "Đang tải các gói đăng ký…",
    packagesError: "Không thể tải các gói đăng ký. Vui lòng thử lại.",
    packagesEmpty: "Hiện chưa có gói đăng ký nào.",
    retry: "Thử lại",
    paginationLabel: "Phân trang gói đăng ký",
    previousPage: "Trước",
    nextPage: "Sau",
    pageSummary: "Trang {page}/{pages}",
    months: "{count} tháng",
    month: "{count} tháng",
    priceOptions: "Các thời hạn hiện có",
    monthlyPrice: "Mỗi tháng",
    totalPrice: "Tổng tiền",
    saving: "Tiết kiệm {amount}",
    bestSavings: "Tiết kiệm nhất",
    buyOnFarmbrite: "Mua ngay",
    expire: "Số lượng chưa dùng không cộng sang tháng sau",
    rollover:
      "Số lượng chưa dùng chỉ được cộng sang tháng sau trong gói nhiều tháng",
    includedProducts: "Số lượng bạn có thể dùng mỗi tháng",
    cycle: "tháng",
    whyTitle: "Vì sao chọn Nông Nghiệp Thiên Nhiên?",
    whyReasons: [
      {
        title: "Ủng hộ nông hộ và kinh tế địa phương",
        body: "Giúp giữ dòng tiền luân chuyển trong cộng đồng, tạo việc làm và tăng cường sức khỏe kinh tế khu vực.",
      },
      {
        title: "Ủng hộ canh tác bền vững, hạn chế hóa chất gây hại",
        body: "Nông Nghiệp Thiên Nhiên tự sản xuất phân bón hữu cơ và quản lý sâu hại bằng sinh học thay vì hóa chất.",
      },
      {
        title: "Bảo vệ đa dạng sinh học và sức khỏe đất",
        body: "Nông dân trồng đa dạng các loại nông sản, giúp nguồn thực phẩm giữ được sự đa dạng di truyền và nói không với độc canh.",
      },
    ],
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
      "Natural Farming Vietnam đang rà soát nội dung chính thức trước khi xuất bản. Trong thời gian này, vui lòng liên hệ nếu bạn có câu hỏi về quyền riêng tư hoặc việc sử dụng website.",
    sourceNote:
      "Không có điều khoản pháp lý nào được suy diễn hoặc xuất bản trước khi hoàn tất rà soát chính thức.",
    contactCta: "Liên hệ Natural Farming Vietnam",
  },
  storeGuide: {
    title: "Cửa hàng Natural Farming Vietnam",
    intro:
      "Chọn cách phù hợp để xem và đặt sản phẩm tươi từ cửa hàng Farmbrite của chúng tôi.",
    howToShopTitle: "Khám phá các lựa chọn từ trang trại",
    csaCard: {
      title: "Dành cho thành viên CSA / Membership",
      body: "Xem các sản phẩm có sẵn trong tuần và chọn sản phẩm có ký hiệu |C bằng quyền lợi CSA hoặc Membership của bạn.",
      cta: "Xem sản phẩm CSA tuần này",
      url: "https://store.farmbrite.com/store/nntn/products?category=CSA",
    },
    individualCard: {
      title: "Mua sản phẩm lẻ",
      body: "Xem toàn bộ rau, gia vị, trái cây và các sản phẩm hiện có. Bạn cũng có thể mua thêm ngoài quyền lợi CSA.",
      cta: "Xem tất cả sản phẩm",
      url: "https://store.farmbrite.com/store/nntn",
    },
    livePlantsCard: {
      title: "Cây sống và cây giống",
      body: "Xem các loại cây sống và cây giống hiện đang có từ trang trại.",
      cta: "Xem cây sống và cây giống",
      url: "https://store.farmbrite.com/store/nntn/products?category=Live%20Plants",
    },
    csaPromo: "Chưa tham gia CSA? Tìm hiểu chương trình CSA.",
    csaPromoLink: "Tìm hiểu CSA",
    faqTitle: "Câu hỏi về đặt hàng",
    faqItems: [
      {
        question: "Làm thế nào để chọn sản phẩm CSA hàng tuần?",
        answer:
          "Truy cập cửa hàng Farmbrite và vào danh mục 'CSA'. Thêm các sản phẩm có ký hiệu '|C' vào giỏ hàng theo định mức gói của bạn.",
      },
      {
        question: "Ký hiệu |C có nghĩa là gì?",
        answer:
          "Sản phẩm có ký hiệu '|C' trong danh mục CSA sẽ dùng quyền lợi trong gói. Giỏ hàng Farmbrite hiển thị số lượng còn lại trong gói.",
      },
      {
        question: "Tại sao một số sản phẩm xuất hiện 2 lần trong cửa hàng?",
        answer:
          "Một loại có ký hiệu '|C' dành cho thành viên CSA dùng định mức của họ, loại còn lại dành cho mua lẻ thông thường. Các sản phẩm CSA không có sẵn sẽ không xuất hiện trong danh mục CSA.",
      },
      {
        question: "Tôi có thể mua thêm sản phẩm lẻ vào cùng đơn hàng không?",
        answer:
          "Có, bạn có thể chọn thêm các sản phẩm thông thường không có ký hiệu '|C' cùng lúc. Các sản phẩm này được tính phí riêng biệt.",
      },
      {
        question: "Trạng thái 'Backordered' nghĩa là gì?",
        answer:
          "Trong các danh mục sản phẩm thông thường, 'Backordered' nghĩa là sản phẩm tạm thời chưa có sẵn. Trong danh mục CSA, sản phẩm chưa có sẵn sẽ không xuất hiện.",
      },
      {
        question: "Hình thức thanh toán và giao hàng ra sao?",
        answer:
          "Khi thanh toán, hãy chọn 'Cash' hoặc 'Invoice Me'. Giao hàng CSA được miễn phí. Phí giao hàng cho Membership hàng tháng và đơn mua lẻ được tính và hiển thị trong giỏ hàng Farmbrite.",
      },
      {
        question:
          "Làm sao để thay đổi gói CSA hoặc số người trong hộ gia đình?",
        answer:
          "Mọi thay đổi về gói hoặc số người yêu cầu liên hệ trực tiếp với Natural Farming Vietnam qua Zalo.",
      },
    ],
    zaloTitle: "Cần hỗ trợ đặt hàng?",
    zaloBody:
      "Nhắn Natural Farming Vietnam trên Zalo nếu bạn cần hỗ trợ chọn gói, đặt hàng hoặc thay đổi Membership hiện có.",
    zaloCta: "Liên hệ qua Zalo",
    zaloUrl: "https://zalo.me/84988158285",
  },
};

export const siteContent: Record<Locale, SiteContent> = { en, vi };
export function getSiteContent(locale: Locale) {
  return siteContent[locale];
}
