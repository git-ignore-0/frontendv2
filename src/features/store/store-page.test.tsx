import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getSiteContent } from "@/content/site-content";
import { StorePage } from "@/features/store/store-page";

afterEach(cleanup);

const farmbriteUrls = [
  "https://store.farmbrite.com/store/nntn/products?category=CSA",
  "https://store.farmbrite.com/store/nntn",
  "https://store.farmbrite.com/store/nntn/products?category=Live%20Plants",
];
const membershipUrl =
  "https://store.farmbrite.com/store/nntn/products?category=Memberships";

describe("StorePage", () => {
  it.each([
    ["en", "Shop Natural Farming Vietnam"],
    ["vi", "Cửa hàng Natural Farming Vietnam"],
  ] as const)("renders the translated %s Store heading", (locale, heading) => {
    render(<StorePage copy={getSiteContent(locale).storeGuide} />);

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
  });

  it.each([
    [
      "en",
      "We are using an incredible farm management software’s online store module.",
    ],
    [
      "vi",
      "Chúng tôi đang sử dụng mô-đun cửa hàng trực tuyến của một phần mềm quản lý nông trại tuyệt vời.",
    ],
  ] as const)(
    "renders the translated %s Store introduction",
    (locale, intro) => {
      render(<StorePage copy={getSiteContent(locale).storeGuide} />);

      expect(screen.getByText(intro, { exact: false })).toBeVisible();
    },
  );

  it.each([
    ["en", ["CSA & Membership", "All Products", "Live plants"]],
    ["vi", ["CSA & Thành Viên", "Tất Cả Sản Phẩm", "Cây sống và cây giống"]],
  ] as const)("renders the %s Store card titles", (locale, cardTitles) => {
    render(<StorePage copy={getSiteContent(locale).storeGuide} />);

    for (const title of cardTitles) {
      expect(
        screen.getByRole("heading", { level: 3, name: title }),
      ).toBeVisible();
    }
  });

  it.each([
    [
      "en",
      "CSA & Membership",
      "New to CSA? For more information",
      "Ready to purchase CSA",
      "View this week’s CSA items",
      "/csa/en",
    ],
    [
      "vi",
      "CSA & Thành Viên",
      "Mới biết đến CSA? Xem thêm thông tin",
      "Sẵn sàng mua CSA",
      "Xem sản phẩm CSA tuần này",
      "/csa/vi",
    ],
  ] as const)(
    "renders the %s CSA card with its three CTA links",
    (
      locale,
      cardTitle,
      informationCta,
      purchaseCta,
      weeklyCta,
      internalHref,
    ) => {
      render(<StorePage copy={getSiteContent(locale).storeGuide} />);

      const card = screen.getByRole("heading", { level: 3, name: cardTitle })
        .parentElement as HTMLElement;
      const actionGroup = card.querySelector(".store-csa-actions");
      const links = within(card).getAllByRole("link");

      expect(actionGroup).toBeInTheDocument();
      expect(
        within(actionGroup as HTMLElement).getAllByRole("link"),
      ).toHaveLength(3);
      expect(
        within(actionGroup as HTMLElement).queryByRole("separator"),
      ).not.toBeInTheDocument();
      expect(links).toHaveLength(3);
      const [informationLink, purchaseLink, weeklyLink] = links;
      expect(informationLink).toHaveAccessibleName(informationCta);
      expect(purchaseLink).toHaveAccessibleName(purchaseCta);
      expect(weeklyLink).toHaveAccessibleName(weeklyCta);
      for (const link of links) {
        expect(link).toHaveClass("store-csa-action");
        expect(link).toHaveClass("store-card-cta");
      }
      expect(informationLink).toHaveAttribute("href", internalHref);
      expect(informationLink).not.toHaveAttribute("target");
      expect(purchaseLink).toHaveAttribute("href", membershipUrl);
      expect(purchaseLink).toHaveAttribute("target", "_blank");
      expect(purchaseLink).toHaveAttribute("rel", "noopener noreferrer");
      expect(informationLink).toHaveClass("store-btn-secondary");
      expect(purchaseLink).toHaveClass("store-btn-ghost");
      expect(weeklyLink).toHaveAttribute("href", farmbriteUrls[0]);
      expect(weeklyLink).not.toHaveAttribute("target");
      expect(weeklyLink).toHaveClass("store-btn-primary");
      expect(weeklyLink).not.toHaveClass("store-btn-secondary-filled");
    },
  );

  it("keeps the All Products and Live plants CTAs on the shared CSA height contract", () => {
    const copy = getSiteContent("en").storeGuide;
    render(<StorePage copy={copy} />);

    const csaCard = screen.getByRole("heading", {
      level: 3,
      name: copy.csaCard.title,
    }).parentElement as HTMLElement;
    const allProductsCard = screen.getByRole("heading", {
      level: 3,
      name: copy.individualCard.title,
    }).parentElement as HTMLElement;
    const livePlantsCard = screen.getByRole("heading", {
      level: 3,
      name: copy.livePlantsCard.title,
    }).parentElement as HTMLElement;

    const allProductsLink = within(allProductsCard).getByRole("link");
    const livePlantsLink = within(livePlantsCard).getByRole("link");
    const csaCtas = within(csaCard).getAllByRole("link");

    expect(within(allProductsCard).getAllByRole("link")).toHaveLength(1);
    expect(within(livePlantsCard).getAllByRole("link")).toHaveLength(1);
    expect(allProductsLink).toHaveAttribute("href", farmbriteUrls[1]);
    expect(livePlantsLink).toHaveAttribute("href", farmbriteUrls[2]);
    for (const cta of [...csaCtas, allProductsLink, livePlantsLink]) {
      expect(cta).toHaveClass("store-card-cta");
    }

    const zaloLink = screen.getByRole("link", { name: copy.zaloCta });
    expect(zaloLink).toHaveAttribute("href", copy.zaloUrl);
    expect(zaloLink).not.toHaveAttribute("target");
    expect(zaloLink).not.toHaveAttribute("rel");
  });

  it("opens the first FAQ initially and hides every closed answer from assistive technology", () => {
    const copy = getSiteContent("en").storeGuide;
    render(<StorePage copy={copy} />);

    const firstTrigger = screen.getByRole("button", {
      name: copy.faqItems[0].question,
    });
    const secondTrigger = screen.getByRole("button", {
      name: copy.faqItems[1].question,
    });
    const firstPanel = document.getElementById(
      firstTrigger.getAttribute("aria-controls") as string,
    );
    const secondPanel = document.getElementById(
      secondTrigger.getAttribute("aria-controls") as string,
    );

    expect(firstTrigger).toHaveAttribute("type", "button");
    expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
    expect(firstPanel).not.toHaveAttribute("hidden");
    expect(secondTrigger).toHaveAttribute("aria-expanded", "false");
    expect(secondPanel).toHaveAttribute("hidden");
    expect(screen.queryByText(copy.faqItems[1].answer)).not.toBeVisible();

    fireEvent.click(secondTrigger);

    expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
    expect(firstPanel).toHaveAttribute("hidden");
    expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
    expect(secondPanel).not.toHaveAttribute("hidden");
    expect(
      within(secondPanel as HTMLElement).getByText(copy.faqItems[1].answer),
    ).toBeVisible();
  });
});
