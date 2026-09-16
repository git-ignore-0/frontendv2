import type { ComparisonAction } from "@/features/membership/csa-comparison-section";
import type { Locale } from "@/lib/i18n";

type StoreCardCta = {
  label: string;
  href: string;
  kind: "primary" | "secondary" | "secondary-filled" | "ghost";
  type: "internal" | "external";
  openInNewTab?: boolean;
};

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
    referralFab: "Share with friends",
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
  referralShareLanding: {
    eyebrow: "You’ve been invited",
    title: "Naturally grown food, shared with care.",
    description:
      "Discover naturally grown food from Natural Farming Vietnam, where every purchase helps support and train the next generation of Vietnamese farmers.",
    cta: "Explore Natural Farming Vietnam",
    visualNote: "Living soil · Naturally grown",
    imageAlt: "Natural Farming Vietnam invitation preview",
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
    share: "Share",
    shareDialogTitle: "Share your referral link",
    shareDialogDescription:
      "Use the copy link or copy message below to share with your friends by pasting into your messaging app or email.",
    closeShareDialog: "Close share dialog",
    referralLinkLabel: "Your referral link",
    copyLink: "Copy link",
    linkCopied: "Referral link copied.",
    linkCopyFailed:
      "We could not copy the referral link. Please copy it manually.",
    shareMessageLabel: "Message to share",
    defaultShareMessage:
      "I’ve been getting fresh produce from Natural Farming Vietnam and honestly, the quality is unmatched — everything’s grown naturally, with no shortcuts. Plus every purchase supports a farm that’s training the next generation of Vietnamese farmers. Check them out: {link} 🌱",
    copyMessage: "Copy message",
    shareViaApps: "Share via apps",
    nativeShareFailed:
      "Unable to open sharing options. Please copy the message instead.",
    shareOn: "Share on",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    email: "Email",
    shareOnFacebook: "Share on Facebook",
    shareViaWhatsApp: "Share via WhatsApp",
    shareByEmail: "Share by email",
    emailShareSubject: "Check out Natural Farming Vietnam",
    messageCopied: "Share message copied.",
    messageCopyFailed:
      "We could not copy the message. Please select and copy it manually.",
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
    referralProgramMetadataTitle: "Share with friends, earn rewards",
    referralProgramTitle: "Share with friends, earn rewards",
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
    programRewardsCta: "See what you can redeem →",
    successfulReferralPoints: "100 points",
    successfulReferralLabel: "for each successful referral",
    secondOrderBonus: "+50 points",
    secondOrderBonusLabel:
      "bonus when your friend places a second order within 60 days",
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
    applyReferralTitle: "Apply referral code?",
    applyReferralDescription:
      "You opened an invitation link. Confirm this code before it is applied to your account.",
    invitationReferralCode: "Referral code from invitation",
    applyReferralCode: "Apply code",
    notNow: "Not now",
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
    membershipContractTitle: "CSA contract",
    membershipContractCode: "Contract code",
    membershipContractStatus: "Contract status",
    membershipContractActive: "Active",
    membershipContractRevoked: "Revoked",
    membershipContractLoading: "Loading contract…",
    membershipContractEmpty: "No contract yet",
    membershipContractError:
      "We could not load the contract. Please try again.",
    membershipContractPdfError: "The contract is temporarily unavailable.",
    membershipContractDownloadVi: "Download Vietnamese contract",
    membershipContractDownloadEn: "Download English contract",
    membershipContractDownloading: "Downloading…",
  },
  csa: {
    metadataTitle: "Community Supported Agriculture",
    eyebrow: "Community Supported Agriculture",
    title: "Fresh food each week, supporting farmers for a better future.",
    intro:
      "CSA connects your household with naturally farmed produce. You receive food weekly while farmers gain more certainty to plan each season and care for the land.",
    heroAlt: "A farmer tending crops in a green field",
    benefits: [
      {
        label: "No chemical inputs",
        icon: "refresh",
      },
      {
        label: "A farmer you know by name",
        icon: "calendar",
      },
      {
        label: "Delivered within 24 hours of harvest",
        icon: "clock",
      },
    ],
    comparisons: [
      {
        id: "why-natural-farming",
        eyebrow: "WHY NATURAL FARMING?",
        versusLabel: "VS",
        title: "Where Does Your Food Really Come From?",
        intro:
          "A closer look at two ways of feeding your family — and your community.",
        left: {
          label: "Grocery Store",
          items: [
            "Grown with synthetic pesticides and chemical fertilizers to speed growth and boost yield.",
            "Kept “fresh” for days in warehouses and on shelves with preservatives, wax coatings, or ripening gases.",
            "The “organic” label is a claim you just have to take on faith.",
            "Your produce passes through wholesalers and middlemen before it reaches you.",
            "Every purchase is a one-time, disconnected transaction.",
            "Convenient today, with unknown chemical residue and no lasting impact tomorrow.",
          ],
        },
        right: {
          label: "Natural Farming Vietnam",
          items: [
            "Grown naturally, without chemical inputs — by a farmer you know by name.",
            "Harvested just before delivery, so it never needs chemicals to survive the trip to your table.",
            "Trust built through a real relationship — not just a sticker on the package.",
            "A short, transparent chain — straight from the farm to your table.",
            "Every purchase, à la carte or CSA, supports a real farming family you can know by name.",
            "Protects farmland from chemicals and strengthens your community's food supply.",
          ],
        },
        conclusion: {
          lead: "Every purchase from Natural Farming Vietnam — à la carte or CSA — is a vote for cleaner food, a thriving farmer, and a stronger community.",
          accent:
            "Choose natural. Choose transparent. Choose Natural Farming Vietnam.",
          actions: [
            { label: "See our farms", kind: "farms", variant: "primary" },
            { label: "Meet the farmers", kind: "tracker", variant: "ghost" },
          ] as const,
        },
      },
      {
        id: "why-csa",
        eyebrow: "WHY CSA?",
        versusLabel: "VS",
        title: "What Does CSA Offer Beyond À La Carte?",
        intro:
          "Two ways to bring Natural Farming Vietnam produce home — and how far each one goes.",
        left: {
          label: "À La Carte",
          items: [
            "Choose from our full catalog, any time.",
            "Pay the everyday price, order by order.",
            "Each order stands on its own.",
          ],
        },
        right: {
          label: "CSA",
          items: [
            "Choose each week from what's ready and in season — a shorter list, picked for you by the farm.",
            "A lower, locked-in rate all season — genuinely cheaper than ordering the same items à la carte.",
            "Signing up in advance helps the farm plan the season, cut waste, and grow with confidence.",
          ],
        },
        pullQuote: {
          lead: "",
          accent:
            "Farmers from 6 different provinces currently producing for the Natural Farming Vietnam family!",
          accentTerm: "6 different provinces",
          mark: "“",
        },
        conclusion: {
          lead: "Every CSA membership plants something bigger than a delivery.",
          accent: "Be the catalyst — join the CSA today.",
        },
      },
    ],
    timelineTitle: "How does a typical week work?",
    timelineLabel: "Weekly CSA timeline",
    timeline: [
      {
        day: "MON",
        title: "Monday",
        description: "The farm updates which products are available.",
        image: "/images/csa/timeline/monday-availability.jpg",
        alt: "A woman checking bitter gourd vines in the garden",
      },
      {
        day: "TUE",
        title: "Tuesday",
        description: "The team sends the product list to members.",
        image: "/images/csa/timeline/tuesday-product-list.jpg",
        alt: "A team member working on a laptop at a table",
      },
      {
        day: "WED",
        title: "Wednesday",
        description: "Members finalize their selections and orders.",
        image: "/images/csa/timeline/wednesday-order-selection.jpg",
        alt: "A Farmbrite shopping cart used to select CSA products",
      },
      {
        day: "THU",
        title: "Thursday",
        description: "Farmers harvest and the team packs orders.",
        image: "/images/csa/timeline/thursday-harvest.jpg",
        alt: "A farmer harvesting leafy vegetables",
      },
      {
        day: "FRI",
        title: "Friday",
        description: "Products are delivered to your door.",
        image: "/images/csa/timeline/friday-delivery.jpg",
        alt: "A motorbike rider delivering produce",
      },
    ],
    substitutionLine:
      "If something on your list runs low before harvest day, we'll substitute with something equally fresh and let you know — nothing shows up as a surprise.",
    faqTitle: "Ordering FAQ",
    faqItems: [
      {
        question: "What if an item runs out?",
        answer:
          "With CSA, this isn't really a risk the way it is with regular shopping — the weekly CSA list only shows items that are currently available, so you're always choosing from what's actually in stock that week.",
      },
      {
        question: "How fresh is the produce, really?",
        answer:
          "Farmers harvest on Thursday and orders are delivered Friday — most of what arrives at your door was still in the ground the day before.",
      },
      {
        question: "Is delivery really free?",
        answer:
          "Yes — delivery is free for all 6-month CSA members. For Monthly Membership or à la carte orders, delivery is free on a scheduled delivery day, and a nominal fee applies for non-scheduled days.",
      },
      {
        question: "What happens to quantity I don't use in a month?",
        answer:
          "On multi-month plans, unused quantity carries over into the following months. On the 1-month plan, unused quantity carries over if you renew before the membership ends; if you don't renew, it resets at the end of the membership period.",
      },
      {
        question: "Can I skip or pause a week if I'm traveling?",
        answer:
          "Yes — simply don't place an order for that week by the scheduled Wednesday ordering day, and you won't be charged or receive a delivery.",
      },
      {
        question: "What if I don't like something in my delivery?",
        answer:
          "If an item arrives poor quality or damaged, we'll credit you for it. If it's simply a matter of taste, message us and we'll work out an option that fits better next time.",
      },
      {
        question: "What's the cancellation policy?",
        answer:
          "We'll honor a cancellation and refund the unused portion — though we'd love the chance to work things out with you first. Here's why: each 6-month CSA payment becomes working capital we forward directly to your farmer, helping them transition to the Natural Farming way season by season. A refund comes out of our own operating budget, not the farmer's, so it never puts their livelihood at risk — but it does affect our ability to support the next family. We run this program purely for farmers' livelihoods, not for profit.",
      },
      {
        question: "What if I'm not home when delivery arrives?",
        answer:
          "We'll coordinate the delivery time with you beforehand, so this shouldn't come as a surprise — message us on Zalo if your schedule changes.",
      },
    ],
    packagesTitle: "Packages open for registration",
    packagesSubtitle: "Choose a duration that suits your household.",
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
    buyNow: "Buy now",
    floatingBuyNow: "Buy now",
    expire: "Unused quantity carries over if you renew your membership.",
    rollover:
      "Unused quantity carries over only within a multi-month membership",
    includedProducts: "Quantity you can use each month",
    cycle: "month",
    zaloTitle: "Need help with your CSA membership?",
    zaloBody:
      "Message Natural Farming Vietnam on Zalo for help choosing a plan, ordering, or changing an existing membership.",
    zaloCta: "Contact us on Zalo",
    zaloUrl: "https://zalo.me/84988158285",
  },
  tracker: {
    eyebrow: "Natural Farming Vietnam",
    title: "From Seed to Harvest — CSA Growth Tracker",
    intro:
      "Every 6-month CSA signup grows a farmer's story forward. Watch each one move from getting started, to providing for their family, to becoming a leader others can learn from.",
    liveNoteTitle: "Live CSA signup data.",
    liveNoteBody:
      "This tracker shows the current signup totals recorded for participating farms and updates as new totals are added.",
    milestones: {
      seedPlanted: {
        label: "Seed planted",
        description:
          "The first signups are putting this farm community in motion.",
      },
      gettingStarted: {
        label: "Getting Started",
        description:
          "A growing group is helping the farm plan with confidence.",
      },
      providingForFamily: {
        label: "Providing for Family",
        description: "CSA support is helping provide for a farming family.",
      },
      communityLeader: {
        label: "Community Leader",
        description:
          "A strong CSA community is helping this farm lead the way.",
      },
    },
    stats: {
      farms: "FARMERS IN THE GROUP",
      totalSignups: "TOTAL 6-MONTH SIGNUPS",
      leaders: "COMMUNITY LEADERS REACHED",
    },
    legendLabel: "CSA growth milestones",
    thresholdLabel: "{count} signups",
    fieldSectionTitle: "Farms growing with their communities",
    fieldSectionSubtitle:
      "Every signup helps a farm build a steadier future, one household at a time.",
    loading: "Loading farm growth…",
    emptyTitle: "No farms to show yet",
    emptyBody:
      "Visible tracker farms will appear here when they are available.",
    error: "We could not load the farm tracker. Please try again.",
    retry: "Try again",
    farmGridTitle: "Farm growth details",
    signupGoal: "/ {count} signups",
    nextMilestoneOne:
      "{remaining} more signup gets {name} to “{milestone}” — {description}",
    nextMilestoneMany:
      "{remaining} more signups gets {name} to “{milestone}” — {description}",
    nextMilestoneCountOne: "{remaining} more signup",
    nextMilestoneCountMany: "{remaining} more signups",
    leaderMessage:
      "{name} has reached {milestone} — the highest milestone! Every extra signup keeps strengthening their work.",
    leaderBadge: "Community Leader reached",
    viewFarmer: "View farmer",
    farmerProfile: "Farmer profile",
    aboutFarmer: "About this farmer",
    closeFarmerDetails: "Close farmer details",
    farmPhotos: "Farm photos",
    photoCountOne: "{count} photo",
    photoCountMany: "{count} photos",
    viewPhoto: "View photo",
    openFarmPhoto: "Open farm photo {index} of {count}",
    farmPhotoViewer: "Farm photo viewer",
    closeImageViewer: "Close image viewer",
    previousImage: "Previous image",
    nextImage: "Next image",
    accessibility: {
      field: "CSA farm growth field",
      farm: "Growth details for {name}",
      progress:
        "{name}: {count} total signups from the beginning until now, {percent}% toward Community Leader",
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
      "Natural Farming Vietnam is reviewing the official content before publication. Please contact us if you have a privacy or website-use question in the meantime.",
    sourceNote:
      "No legal terms have been inferred or published before formal review.",
    contactCta: "Contact Natural Farming Vietnam",
  },
  storeGuide: {
    title: "Shop Natural Farming Vietnam",
    intro:
      "We are using an incredible farm management software’s online store module. This software help us and our farmers coordinate seeds, plantings, harvesting, even animal care. But their store is a bit limited in functions. Please forgive the lack of bells and whistles for now. So to help, we’ll have some guidance below:",
    howToShopTitle: "Explore options from the farm",
    csaCard: {
      title: "CSA & Membership",
      body: "See the items available this week and choose products marked |C using your CSA or Membership allowance.",
      ctas: [
        {
          label: "New to CSA? For more information",
          href: "/csa/en",
          kind: "secondary",
          type: "internal",
        },
        {
          label: "Ready to signup for CSA",
          href: "/csa/purchase/en",
          kind: "ghost",
          type: "internal",
        },
        {
          label: "View this week’s CSA items",
          href: "https://store.farmbrite.com/store/nntn/products?category=CSA",
          kind: "primary",
          type: "external",
        },
      ] satisfies StoreCardCta[],
    },
    individualCard: {
      title: "All Products",
      body: "Browse all available vegetables, herbs, fruit, and other products. You can also add extra items beyond your CSA allowance.",
      imageAlt: "Fresh produce and grocery selection",
      cta: "Browse all products",
      url: "https://store.farmbrite.com/store/nntn",
    },
    livePlantsCard: {
      title: "Live plants",
      body: "Browse live plants and seedlings currently available from our farm.",
      imageAlt: "Live ornamental plants from the farm",
      cta: "Browse live plants",
      url: "https://store.farmbrite.com/store/nntn/products?category=Live%20Plants",
    },
    faqTitle: "Ordering FAQ",
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
  testimonials: {
    launcher: "Stories",
    drawerEyebrow: "Natural Farming Community",
    drawerTitle: "Community stories",
    viewAll: "View all stories",
    pageEyebrow: "Community",
    pageTitle: "Stories from farms and tables",
    pageIntro:
      "Authentic stories recorded by the Natural Farming Vietnam team from customers and farmers who accompany us.",
    filterAll: "All",
    filterCustomer: "Customers",
    filterFarmer: "Farmers",
    emptyTitle: "No stories found",
    emptyBody: "We are adding more content to this section.",
    loading: "Loading stories...",
    updating: "Updating…",
    error: "We could not load the stories. Please try again.",
    retry: "Try again",
    tagCustomer: "Customer",
    tagFarmer: "Farmer",
    back: "Back",
    closeDrawer: "Close community stories",
    closeDetail: "Close story details",
    drawerDescription:
      "Featured stories from customers and farmers in our community.",
    filtersLabel: "Filter stories",
    listLabel: "Community stories",
    openStory: "Read the full story from {name}",
    imageAlt: "Portrait of {name}",
    detailTitle: "Story from {name}",
    detailDescription:
      "The complete interview recorded by Natural Farming Vietnam.",
    detailLoading: "Loading the full story...",
    detailError: "We could not load this full story. Please try again.",
    previous: "Previous",
    next: "Next",
    pageStatus: "Page {page} of {pages}",
  },
} as const;

type LocalizedShape<T> = T extends ComparisonAction
  ? ComparisonAction
  : T extends string
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
    referralFab: "Giới thiệu bạn",
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
  referralShareLanding: {
    eyebrow: "Bạn được mời khám phá",
    title: "Nông sản thuận tự nhiên, sẻ chia bằng sự quan tâm.",
    description:
      "Khám phá nông sản được canh tác tự nhiên từ Natural Farming Vietnam, nơi mỗi lần mua hàng góp phần hỗ trợ và đào tạo thế hệ nông dân Việt Nam tiếp theo.",
    cta: "Khám phá Natural Farming Vietnam",
    visualNote: "Đất sống · Canh tác tự nhiên",
    imageAlt: "Ảnh xem trước lời mời Natural Farming Vietnam",
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
    share: "Chia sẻ",
    shareDialogTitle: "Chia sẻ liên kết giới thiệu",
    shareDialogDescription:
      "Hãy dùng nút sao chép liên kết hoặc sao chép tin nhắn bên dưới để chia sẻ với bạn bè bằng cách dán vào ứng dụng nhắn tin hoặc email.",
    closeShareDialog: "Đóng hộp thoại chia sẻ",
    referralLinkLabel: "Liên kết giới thiệu của bạn",
    copyLink: "Sao chép liên kết",
    linkCopied: "Đã sao chép liên kết giới thiệu.",
    linkCopyFailed:
      "Không thể sao chép liên kết giới thiệu. Vui lòng sao chép thủ công.",
    shareMessageLabel: "Tin nhắn chia sẻ",
    defaultShareMessage:
      "Mình đã mua nông sản từ Natural Farming Vietnam và thực sự chất lượng rất tốt — mọi thứ được canh tác tự nhiên, không có đường tắt. Hơn nữa, mỗi lần mua hàng là một lần góp phần đào tạo thế hệ nông dân Việt Nam tiếp theo. Xem thêm tại: {link} 🌱",
    copyMessage: "Sao chép tin nhắn",
    shareViaApps: "Chia sẻ qua ứng dụng",
    nativeShareFailed:
      "Không thể mở tùy chọn chia sẻ. Vui lòng sao chép tin nhắn để gửi.",
    shareOn: "Chia sẻ qua",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    email: "Email",
    shareOnFacebook: "Chia sẻ trên Facebook",
    shareViaWhatsApp: "Chia sẻ qua WhatsApp",
    shareByEmail: "Chia sẻ qua email",
    emailShareSubject: "Khám phá Natural Farming Vietnam",
    messageCopied: "Đã sao chép tin nhắn chia sẻ.",
    messageCopyFailed:
      "Không thể sao chép tin nhắn. Vui lòng chọn và sao chép thủ công.",
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
    referralProgramMetadataTitle: "Chia sẻ với bạn bè, nhận quà",
    referralProgramTitle: "Chia sẻ với bạn bè, nhận quà",
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
    programRewardsTitle: "Bạn nhận được gì",
    programRewardsIntro:
      "Dùng điểm của bạn để đổi những phần thưởng hiện đang có tại nông trại.",
    programRewardsCta: "Xem các phần thưởng có thể đổi →",
    successfulReferralPoints: "100 điểm",
    successfulReferralLabel: "cho mỗi lượt giới thiệu thành công",
    secondOrderBonus: "+50 điểm",
    secondOrderBonusLabel:
      "khi người bạn giới thiệu đặt đơn thứ hai trong vòng 60 ngày",
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
    applyReferralTitle: "Áp dụng mã giới thiệu?",
    applyReferralDescription:
      "Bạn đã mở một liên kết giới thiệu. Hãy xác nhận mã này trước khi áp dụng vào tài khoản.",
    invitationReferralCode: "Mã giới thiệu từ liên kết mời",
    applyReferralCode: "Áp dụng mã",
    notNow: "Để sau",
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
    membershipContractTitle: "Hợp đồng CSA",
    membershipContractCode: "Mã hợp đồng",
    membershipContractStatus: "Trạng thái hợp đồng",
    membershipContractActive: "Đang hiệu lực",
    membershipContractRevoked: "Đã thu hồi",
    membershipContractLoading: "Đang tải hợp đồng…",
    membershipContractEmpty: "Chưa có hợp đồng",
    membershipContractError:
      "Không thể tải thông tin hợp đồng. Vui lòng thử lại.",
    membershipContractPdfError: "Hợp đồng đang tạm thời không khả dụng.",
    membershipContractDownloadVi: "Tải hợp đồng tiếng Việt",
    membershipContractDownloadEn: "Tải hợp đồng tiếng Anh",
    membershipContractDownloading: "Đang tải…",
  },
  csa: {
    metadataTitle: "Nông nghiệp cộng đồng",
    eyebrow: "Nông nghiệp cộng đồng",
    title:
      "Thực phẩm tươi mỗi tuần, cùng nông dân vun bồi một tương lai tốt hơn.",
    intro:
      "CSA kết nối gia đình bạn với những nông trại canh tác tự nhiên. Bạn nhận thực phẩm theo tuần, còn nông dân có điều kiện lên kế hoạch và chăm sóc đất lâu dài.",
    heroAlt: "Nông dân chăm sóc cây trồng trên cánh đồng xanh",
    benefits: [
      {
        label: "Không sử dụng hóa chất",
        icon: "refresh",
      },
      {
        label: "Người nông dân bạn biết rõ tên",
        icon: "calendar",
      },
      {
        label: "Giao hàng trong vòng 24 giờ sau thu hoạch",
        icon: "clock",
      },
    ],
    comparisons: [
      {
        id: "why-natural-farming",
        eyebrow: "TẠI SAO CHỌN CANH TÁC THIÊN NHIÊN?",
        versusLabel: "VS",
        title: "Thực Phẩm Của Bạn Thực Sự Đến Từ Đâu?",
        intro:
          "Một góc nhìn gần hơn về hai cách nuôi dưỡng gia đình bạn — và cả cộng đồng.",
        left: {
          label: "Cửa Hàng Tạp Hóa",
          items: [
            "Trồng bằng thuốc trừ sâu tổng hợp và phân hóa học để tăng trưởng nhanh và tăng năng suất.",
            "Được giữ “tươi” trong nhiều ngày ở kho và trên kệ hàng bằng chất bảo quản, sáp phủ, hoặc khí ép chín.",
            "Nhãn “hữu cơ” là một lời khẳng định mà bạn chỉ có thể tin, không thể kiểm chứng.",
            "Nông sản của bạn phải qua tay nhiều nhà bán sỉ và trung gian trước khi đến được với bạn.",
            "Mỗi lần mua hàng chỉ là một giao dịch đơn lẻ, không có sự kết nối.",
            "Tiện lợi trong hôm nay, nhưng để lại dư lượng hóa chất không rõ và không mang lại giá trị lâu dài.",
          ],
        },
        right: {
          label: "Natural Farming Vietnam",
          items: [
            "Trồng hoàn toàn tự nhiên, không hóa chất — bởi người nông dân bạn biết rõ tên.",
            "Thu hoạch ngay trước khi giao hàng, nên không cần hóa chất để “sống sót” trên đường đến bàn ăn của bạn.",
            "Niềm tin được xây dựng qua một mối quan hệ thật — không chỉ là một nhãn dán trên bao bì.",
            "Một chuỗi cung ứng ngắn và minh bạch — từ nông trại thẳng đến bàn ăn của bạn.",
            "Mỗi lần mua hàng, dù là à la carte hay CSA, đều hỗ trợ một gia đình nông dân thật mà bạn có thể biết rõ tên.",
            "Bảo vệ đất nông nghiệp khỏi hóa chất và củng cố nguồn thực phẩm cho cộng đồng của bạn.",
          ],
        },
        conclusion: {
          lead: "Mỗi lần mua hàng từ Natural Farming Vietnam — dù là à la carte hay CSA — là một lá phiếu cho thực phẩm sạch hơn, cho người nông dân phát triển, và cho một cộng đồng vững mạnh hơn.",
          accent:
            "Chọn tự nhiên. Chọn minh bạch. Chọn Natural Farming Vietnam.",
          actions: [
            {
              label: "Xem nông trại của chúng tôi",
              kind: "farms",
              variant: "primary",
            },
            {
              label: "Gặp gỡ những người nông dân",
              kind: "tracker",
              variant: "ghost",
            },
          ] as const,
        },
      },
      {
        id: "why-csa",
        eyebrow: "TẠI SAO CHỌN CSA?",
        versusLabel: "VS",
        title: "CSA Mang Lại Điều Gì Nhiều Hơn So Với À La Carte?",
        intro:
          "Hai cách để mang nông sản Natural Farming Vietnam về nhà — và mỗi cách đưa bạn đi xa đến đâu.",
        left: {
          label: "À La Carte",
          items: [
            "Chọn từ toàn bộ danh mục sản phẩm, bất cứ lúc nào.",
            "Trả giá thông thường, cho từng đơn hàng.",
            "Mỗi đơn hàng là một giao dịch độc lập.",
          ],
        },
        right: {
          label: "CSA",
          items: [
            "Mỗi tuần chọn từ những gì đang sẵn có và đúng mùa — một danh sách ngắn hơn, được nông trại chọn sẵn cho bạn.",
            "Một mức giá thấp hơn, cố định suốt cả mùa — thực sự rẻ hơn so với mua cùng sản phẩm theo hình thức à la carte.",
            "Đăng ký trước giúp nông trại lên kế hoạch cho cả mùa vụ, giảm lãng phí, và canh tác với sự tự tin hơn.",
          ],
        },
        pullQuote: {
          lead: "",
          accent:
            "Những người nông dân từ 6 tỉnh thành khác nhau đang cùng sản xuất cho gia đình Natural Farming Vietnam!",
          accentTerm: "6 tỉnh thành khác nhau",
          mark: "“",
        },
        conclusion: {
          lead: "Mỗi gói thành viên CSA gieo trồng điều gì đó lớn hơn một lần giao hàng.",
          accent:
            "Hãy là người tạo ra sự thay đổi — tham gia CSA ngay hôm nay.",
        },
      },
    ],
    timelineTitle: "Một tuần giao nhận diễn ra như thế nào?",
    timelineLabel: "Lịch giao nhận CSA hằng tuần",
    timeline: [
      {
        day: "THỨ HAI",
        title: "Thứ Hai",
        description: "Nông trại cập nhật những sản phẩm đang có sẵn.",
        image: "/images/csa/timeline/monday-availability.jpg",
        alt: "Người phụ nữ kiểm tra những dây mướp trong vườn",
      },
      {
        day: "THỨ BA",
        title: "Thứ Ba",
        description: "Đội ngũ gửi danh sách sản phẩm đến các thành viên.",
        image: "/images/csa/timeline/tuesday-product-list.jpg",
        alt: "Thành viên đội ngũ làm việc với laptop tại bàn",
      },
      {
        day: "THỨ TƯ",
        title: "Thứ Tư",
        description: "Thành viên hoàn tất lựa chọn và đặt hàng.",
        image: "/images/csa/timeline/wednesday-order-selection.jpg",
        alt: "Giỏ hàng Farmbrite dùng để chọn sản phẩm CSA",
      },
      {
        day: "THỨ NĂM",
        title: "Thứ Năm",
        description: "Nông dân thu hoạch và đội ngũ đóng gói đơn hàng.",
        image: "/images/csa/timeline/thursday-harvest.jpg",
        alt: "Nông dân đang thu hoạch rau xanh",
      },
      {
        day: "THỨ SÁU",
        title: "Thứ Sáu",
        description: "Sản phẩm được giao đến tận nhà bạn.",
        image: "/images/csa/timeline/friday-delivery.jpg",
        alt: "Người giao hàng bằng xe máy chở nông sản",
      },
    ],
    substitutionLine:
      "Nếu một sản phẩm trong danh sách của bạn không đủ trước ngày thu hoạch, chúng tôi sẽ thay thế bằng một sản phẩm tươi ngon tương đương và thông báo cho bạn — không có gì bất ngờ cả.",
    faqTitle: "Câu Hỏi Thường Gặp Về Đặt Hàng",
    faqItems: [
      {
        question: "Nếu một sản phẩm hết hàng thì sao?",
        answer:
          "Với CSA, đây không thực sự là một rủi ro như khi mua sắm thông thường — danh sách CSA hàng tuần chỉ hiển thị những sản phẩm đang có sẵn, vì vậy bạn luôn chọn từ những gì thực sự còn hàng trong tuần đó.",
      },
      {
        question: "Nông sản thực sự tươi đến mức nào?",
        answer:
          "Nông dân thu hoạch vào thứ Năm và đơn hàng được giao vào thứ Sáu — hầu hết những gì đến tay bạn vẫn còn ở dưới đất chỉ một ngày trước đó.",
      },
      {
        question: "Giao hàng có thực sự miễn phí không?",
        answer:
          "Có — giao hàng hoàn toàn miễn phí cho tất cả thành viên CSA gói 6 tháng. Đối với gói Thành viên hàng tháng hoặc đơn hàng à la carte, giao hàng miễn phí vào ngày giao hàng theo lịch cố định, và sẽ có một khoản phí nhỏ nếu giao vào ngày ngoài lịch.",
      },
      {
        question: "Số lượng tôi không dùng hết trong tháng sẽ ra sao?",
        answer:
          "Với các gói nhiều tháng, số lượng chưa sử dụng sẽ được chuyển tiếp sang các tháng sau. Với gói 1 tháng, số lượng chưa sử dụng sẽ được chuyển tiếp nếu bạn gia hạn trước khi gói kết thúc; nếu không gia hạn, số lượng đó sẽ được đặt lại khi gói kết thúc.",
      },
      {
        question: "Tôi có thể bỏ qua hoặc tạm ngưng một tuần khi đi xa không?",
        answer:
          "Có — chỉ cần không đặt hàng cho tuần đó trước hạn đặt hàng vào thứ Tư, bạn sẽ không bị tính phí và cũng không nhận được giao hàng.",
      },
      {
        question:
          "Nếu tôi không hài lòng với một sản phẩm trong đơn hàng thì sao?",
        answer:
          "Nếu sản phẩm đến bị hư hỏng hoặc kém chất lượng, chúng tôi sẽ hoàn lại tín dụng cho sản phẩm đó. Nếu chỉ đơn giản là không hợp khẩu vị, hãy nhắn tin cho chúng tôi để cùng tìm ra lựa chọn phù hợp hơn cho lần sau.",
      },
      {
        question: "Chính sách hủy gói như thế nào?",
        answer:
          "Chúng tôi sẽ tôn trọng yêu cầu hủy gói và hoàn lại phần chưa sử dụng — dù vậy, chúng tôi rất mong có cơ hội được trao đổi cùng bạn trước. Lý do là: mỗi khoản thanh toán CSA 6 tháng trở thành vốn hoạt động mà chúng tôi chuyển trực tiếp cho người nông dân, giúp họ từng bước chuyển đổi sang phương pháp Natural Farming theo từng mùa vụ. Khoản hoàn tiền sẽ được trích từ ngân sách vận hành của chúng tôi, không phải từ phần của người nông dân, nên sinh kế của họ không bị ảnh hưởng — nhưng điều này sẽ ảnh hưởng đến khả năng của chúng tôi trong việc hỗ trợ gia đình nông dân tiếp theo. Chúng tôi vận hành chương trình này hoàn toàn vì sinh kế của người nông dân, không vì lợi nhuận.",
      },
      {
        question: "Nếu tôi không có ở nhà khi giao hàng đến thì sao?",
        answer:
          "Chúng tôi sẽ sắp xếp thời gian giao hàng cùng bạn trước, nên sẽ không có gì bất ngờ — hãy nhắn tin cho chúng tôi qua Zalo nếu lịch trình của bạn thay đổi.",
      },
    ],
    packagesTitle: "Các gói đang mở đăng ký",
    packagesSubtitle: "Chọn thời hạn phù hợp với gia đình bạn.",
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
    buyNow: "Mua ngay",
    floatingBuyNow: "Mua ngay",
    expire:
      "Số lượng chưa sử dụng sẽ được chuyển tiếp nếu bạn gia hạn gói thành viên.",
    rollover:
      "Số lượng chưa dùng chỉ được cộng sang tháng sau trong gói nhiều tháng",
    includedProducts: "Số lượng bạn có thể dùng mỗi tháng",
    cycle: "tháng",
    zaloTitle: "Cần hỗ trợ về gói CSA?",
    zaloBody:
      "Nhắn Natural Farming Vietnam trên Zalo nếu bạn cần hỗ trợ chọn gói, đặt hàng hoặc thay đổi Membership hiện có.",
    zaloCta: "Liên hệ qua Zalo",
    zaloUrl: "https://zalo.me/84988158285",
  },
  tracker: {
    eyebrow: "Natural Farming Vietnam",
    title: "Từ hạt giống đến mùa thu hoạch — Hành trình phát triển CSA",
    intro:
      "Mỗi lượt đăng ký CSA 6 tháng giúp câu chuyện của người nông dân tiến về phía trước. Hãy dõi theo từng nông trại từ những bước khởi đầu, đến khi chăm lo cho gia đình, rồi trở thành người dẫn dắt để cộng đồng học hỏi.",
    liveNoteTitle: "Dữ liệu đăng ký CSA đang được cập nhật.",
    liveNoteBody:
      "Bảng theo dõi hiển thị tổng lượt đăng ký hiện tại đã được ghi nhận cho các nông trại tham gia và cập nhật khi có số liệu mới.",
    milestones: {
      seedPlanted: {
        label: "Hạt giống đã gieo",
        description:
          "Những lượt đăng ký đầu tiên đang khởi động cộng đồng quanh nông trại.",
      },
      gettingStarted: {
        label: "Bắt đầu phát triển",
        description:
          "Một nhóm thành viên đang lớn dần, giúp nông trại tự tin lên kế hoạch.",
      },
      providingForFamily: {
        label: "Chăm lo cho gia đình",
        description:
          "Sự đồng hành qua CSA đang góp phần chăm lo cho một gia đình nông dân.",
      },
      communityLeader: {
        label: "Dẫn dắt cộng đồng",
        description:
          "Một cộng đồng CSA vững mạnh đang giúp nông trại mở đường cho những thay đổi tích cực.",
      },
    },
    stats: {
      farms: "NÔNG TRẠI TRONG NHÓM",
      totalSignups: "TỔNG LƯỢT ĐĂNG KÝ CSA 6 THÁNG",
      leaders: "ĐÃ ĐẠT MỐC DẪN DẮT CỘNG ĐỒNG",
    },
    legendLabel: "Các cột mốc phát triển CSA",
    thresholdLabel: "{count} lượt đăng ký",
    fieldSectionTitle: "Những nông trại lớn lên cùng cộng đồng",
    fieldSectionSubtitle:
      "Mỗi lượt đăng ký giúp nông trại xây dựng một tương lai ổn định hơn, từng gia đình một.",
    loading: "Đang tải hành trình của các nông trại…",
    emptyTitle: "Chưa có nông trại để hiển thị",
    emptyBody:
      "Các nông trại đang được hiển thị công khai sẽ xuất hiện tại đây khi có dữ liệu.",
    error: "Không thể tải hành trình nông trại. Vui lòng thử lại.",
    retry: "Thử lại",
    farmGridTitle: "Chi tiết phát triển của các nông trại",
    signupGoal: "/ {count} lượt đăng ký",
    nextMilestoneOne:
      "Thêm {remaining} lượt đăng ký sẽ đưa {name} đến cột mốc “{milestone}” — {description}",
    nextMilestoneMany:
      "Thêm {remaining} lượt đăng ký sẽ đưa {name} đến cột mốc “{milestone}” — {description}",
    nextMilestoneCountOne: "{remaining} lượt đăng ký",
    nextMilestoneCountMany: "{remaining} lượt đăng ký",
    leaderMessage:
      "{name} đã đạt cột mốc cao nhất {milestone} — một người dẫn dắt cộng đồng! Mỗi lượt đăng ký tiếp theo tiếp tục củng cố công việc của nông trại.",
    leaderBadge: "Đã đạt mốc Dẫn dắt cộng đồng",
    viewFarmer: "Xem người nông dân",
    farmerProfile: "Hồ sơ nông trại",
    aboutFarmer: "Giới thiệu về nông trại này",
    closeFarmerDetails: "Đóng thông tin nông trại",
    farmPhotos: "Ảnh nông trại",
    photoCountOne: "{count} ảnh",
    photoCountMany: "{count} ảnh",
    viewPhoto: "Xem ảnh",
    openFarmPhoto: "Mở ảnh nông trại {index} trên {count}",
    farmPhotoViewer: "Trình xem ảnh nông trại",
    closeImageViewer: "Đóng trình xem ảnh",
    previousImage: "Ảnh trước",
    nextImage: "Ảnh tiếp theo",
    accessibility: {
      field: "Khu vực theo dõi sự phát triển của các nông trại CSA",
      farm: "Thông tin phát triển của {name}",
      progress:
        "{name}: {count} tổng lượt đăng ký từ khi bắt đầu đến nay, đạt {percent}% chặng đường đến cột mốc Dẫn dắt cộng đồng",
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
      "Natural Farming Vietnam đang rà soát nội dung chính thức trước khi xuất bản. Trong thời gian này, vui lòng liên hệ nếu bạn có câu hỏi về quyền riêng tư hoặc việc sử dụng website.",
    sourceNote:
      "Không có điều khoản pháp lý nào được suy diễn hoặc xuất bản trước khi hoàn tất rà soát chính thức.",
    contactCta: "Liên hệ Natural Farming Vietnam",
  },
  storeGuide: {
    title: "Cửa hàng Natural Farming Vietnam",
    intro:
      "Chúng tôi đang sử dụng mô-đun cửa hàng trực tuyến của một phần mềm quản lý nông trại tuyệt vời. Phần mềm này giúp chúng tôi và các nông dân phối hợp việc gieo hạt, canh tác, thu hoạch, thậm chí chăm sóc vật nuôi. Tuy nhiên, cửa hàng hiện còn hạn chế về tính năng. Mong bạn thông cảm vì hiện tại cửa hàng chưa có đầy đủ tiện ích. Để hỗ trợ bạn, chúng tôi sẽ cung cấp một số hướng dẫn bên dưới:",
    howToShopTitle: "Khám phá các lựa chọn từ trang trại",
    csaCard: {
      title: "CSA & Thành Viên",
      body: "Xem các sản phẩm có sẵn trong tuần và chọn sản phẩm có ký hiệu |C bằng quyền lợi CSA hoặc Membership của bạn.",
      ctas: [
        {
          label: "Mới biết đến CSA? Xem thêm thông tin",
          href: "/csa/vi",
          kind: "secondary",
          type: "internal",
        },
        {
          label: "Đăng ký CSA",
          href: "/csa/purchase/vi",
          kind: "ghost",
          type: "internal",
        },
        {
          label: "Xem sản phẩm CSA tuần này",
          href: "https://store.farmbrite.com/store/nntn/products?category=CSA",
          kind: "primary",
          type: "external",
        },
      ],
    },
    individualCard: {
      title: "Tất Cả Sản Phẩm",
      body: "Xem toàn bộ rau, gia vị, trái cây và các sản phẩm hiện có. Bạn cũng có thể mua thêm ngoài quyền lợi CSA.",
      imageAlt: "Quầy rau củ và sản phẩm tươi",
      cta: "Xem tất cả sản phẩm",
      url: "https://store.farmbrite.com/store/nntn",
    },
    livePlantsCard: {
      title: "Cây sống và cây giống",
      body: "Xem các loại cây sống và cây giống hiện đang có từ trang trại.",
      imageAlt: "Cây cảnh và cây sống từ trang trại",
      cta: "Xem cây sống và cây giống",
      url: "https://store.farmbrite.com/store/nntn/products?category=Live%20Plants",
    },
    faqTitle: "Câu Hỏi Thường Gặp Về Đặt Hàng",
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
  testimonials: {
    launcher: "Lời chứng",
    drawerEyebrow: "Cộng đồng Natural Farming",
    drawerTitle: "Những câu chuyện",
    viewAll: "Xem tất cả câu chuyện",
    pageEyebrow: "Cộng đồng",
    pageTitle: "Câu chuyện từ nông trại và bàn ăn",
    pageIntro:
      "Những chia sẻ chân thật được đội ngũ Natural Farming Vietnam ghi lại từ khách hàng và những người nông dân đồng hành cùng chúng tôi.",
    filterAll: "Tất cả",
    filterCustomer: "Khách hàng",
    filterFarmer: "Nông dân",
    emptyTitle: "Không tìm thấy câu chuyện",
    emptyBody: "Chúng tôi đang cập nhật thêm nội dung cho mục này.",
    loading: "Đang tải câu chuyện...",
    updating: "Đang cập nhật…",
    error: "Không thể tải câu chuyện. Vui lòng thử lại.",
    retry: "Thử lại",
    tagCustomer: "Khách hàng",
    tagFarmer: "Nông dân",
    back: "Quay lại",
    closeDrawer: "Đóng danh sách câu chuyện cộng đồng",
    closeDetail: "Đóng chi tiết câu chuyện",
    drawerDescription:
      "Các câu chuyện nổi bật từ khách hàng và nông dân trong cộng đồng.",
    filtersLabel: "Lọc câu chuyện",
    listLabel: "Câu chuyện cộng đồng",
    openStory: "Đọc đầy đủ câu chuyện của {name}",
    imageAlt: "Ảnh của {name}",
    detailTitle: "Câu chuyện của {name}",
    detailDescription:
      "Nội dung phỏng vấn đầy đủ do Natural Farming Vietnam ghi lại.",
    detailLoading: "Đang tải câu chuyện đầy đủ...",
    detailError: "Không thể tải câu chuyện đầy đủ. Vui lòng thử lại.",
    previous: "Trước",
    next: "Sau",
    pageStatus: "Trang {page} / {pages}",
  },
};

export const siteContent: Record<Locale, SiteContent> = { en, vi };
export function getSiteContent(locale: Locale) {
  return siteContent[locale];
}

export function getCsaQuotaPolicyText(
  locale: Locale,
  policy: "expire" | "rollover",
) {
  const csaCopy = getSiteContent(locale).csa;
  return policy === "expire" ? csaCopy.expire : csaCopy.rollover;
}
