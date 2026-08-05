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

  it("routes the CSA promo internally", () => {
    const copy = getSiteContent("vi").storeGuide;
    render(<StorePage copy={copy} locale="vi" />);

    expect(
      screen.getByRole("link", { name: copy.csaPromoLink }),
    ).toHaveAttribute("href", "/vi/csa");
  });

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
