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

describe("StorePage", () => {
  it.each([
    ["en", "Shop Natural Farming Vietnam"],
    ["vi", "Cửa hàng Natural Farming Vietnam"],
  ] as const)("renders the translated %s Store heading", (locale, heading) => {
    render(
      <StorePage copy={getSiteContent(locale).storeGuide} locale={locale} />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
  });

  it.each([
    ["en", ["CSA & Membership", "All Products", "Live plants"]],
    ["vi", ["CSA & Thành Viên", "Tất Cả Sản Phẩm", "Cây sống và cây giống"]],
  ] as const)("renders the %s Store card titles", (locale, cardTitles) => {
    render(
      <StorePage copy={getSiteContent(locale).storeGuide} locale={locale} />,
    );

    for (const title of cardTitles) {
      expect(
        screen.getByRole("heading", { level: 3, name: title }),
      ).toBeVisible();
    }
  });

  it("uses the three exact Farmbrite URLs and keeps Farmbrite and Zalo in the same tab", () => {
    const copy = getSiteContent("en").storeGuide;
    render(<StorePage copy={copy} locale="en" />);

    for (const href of farmbriteUrls) {
      const link = document.querySelector(`a[href="${href}"]`);
      expect(link).toBeInTheDocument();
      expect(link).not.toHaveAttribute("target");
      expect(link).not.toHaveAttribute("rel");
    }

    const zaloLink = screen.getByRole("link", { name: copy.zaloCta });
    expect(zaloLink).toHaveAttribute("href", copy.zaloUrl);
    expect(zaloLink).not.toHaveAttribute("target");
    expect(zaloLink).not.toHaveAttribute("rel");
  });

  it.each([
    [
      "en",
      "New to CSA? Choose your plan and join the family.",
      "Get Started",
      "/csa/en",
    ],
    [
      "vi",
      "Mới biết đến CSA? Chọn gói của bạn và trở thành một phần của gia đình.",
      "Bắt Đầu Ngay",
      "/csa/vi",
    ],
  ] as const)(
    "renders the %s CSA promo as an accessible internal primary link",
    (locale, promo, cta, href) => {
      render(
        <StorePage copy={getSiteContent(locale).storeGuide} locale={locale} />,
      );

      const link = screen.getByRole("link", { name: cta });

      expect(screen.getByText(promo)).toBeVisible();
      expect(link).toHaveAttribute("href", href);
      expect(link).not.toHaveAttribute("target");
      expect(screen.queryByText("Explore CSA")).not.toBeInTheDocument();
    },
  );

  it("opens the first FAQ initially and hides every closed answer from assistive technology", () => {
    const copy = getSiteContent("en").storeGuide;
    render(<StorePage copy={copy} locale="en" />);

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
