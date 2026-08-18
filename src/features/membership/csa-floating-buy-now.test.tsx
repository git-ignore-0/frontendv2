import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CsaFloatingBuyNow } from "@/features/membership/csa-floating-buy-now";
import { getSiteContent } from "@/content/site-content";

const navigation = vi.hoisted(() => ({ pathname: "/csa/en" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  callback: IntersectionObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as never,
    );
  }
}

function FloatingBuyNow({ locale = "en" }: { locale?: "en" | "vi" }) {
  const targetRef = createRef<HTMLAnchorElement>();
  return (
    <>
      <a data-testid="original-buy-now" href="#buy-now" ref={targetRef} />
      <div className="csa-fab-stack">
        <div data-csa-fab-buy-slot />
        <a aria-label={getSiteContent("en").common.referralFab} href="#share" />
      </div>
      <CsaFloatingBuyNow
        label={getSiteContent(locale).csa.floatingBuyNow}
        locale={locale}
        targetRef={targetRef}
      />
    </>
  );
}

beforeEach(() => {
  IntersectionObserverMock.instances = [];
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  cleanup();
  navigation.pathname = "/csa/en";
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("CSA floating Buy now", () => {
  it("stays absent while the original Buy now is visible", () => {
    render(<FloatingBuyNow />);
    act(() => IntersectionObserverMock.instances[0].trigger(true));

    expect(screen.queryByRole("link", { name: "Buy now" })).toBeNull();
  });

  it("appears after the original Buy now leaves the viewport and links to English Store", () => {
    render(<FloatingBuyNow />);
    act(() => IntersectionObserverMock.instances[0].trigger(false));

    expect(screen.getByRole("link", { name: "Buy now" })).toHaveAttribute(
      "href",
      "/store/en",
    );
  });

  it("places Buy now above Share in the vertical FAB stack", () => {
    render(<FloatingBuyNow />);
    act(() => IntersectionObserverMock.instances[0].trigger(false));

    const stack = document.querySelector(".csa-fab-stack");
    const buyNow = screen.getByRole("link", { name: "Buy now" });
    const share = screen.getByRole("link", {
      name: getSiteContent("en").common.referralFab,
    });

    expect(stack).toContainElement(buyNow);
    expect(stack).toContainElement(share);
    expect(buyNow.compareDocumentPosition(share)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("fades out and removes itself when the original Buy now returns", () => {
    vi.useFakeTimers();
    render(<FloatingBuyNow />);
    act(() => IntersectionObserverMock.instances[0].trigger(false));
    act(() => vi.advanceTimersByTime(16));
    const action = screen.getByRole("link", { name: "Buy now" });
    action.focus();

    act(() => IntersectionObserverMock.instances.at(-1)?.trigger(true));

    expect(action).toHaveAttribute("aria-hidden", "true");
    expect(action).not.toHaveFocus();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("link", { name: "Buy now" })).toBeNull();
  });

  it("keeps Vietnamese navigation localized", () => {
    navigation.pathname = "/csa/vi";
    render(<FloatingBuyNow locale="vi" />);
    act(() => IntersectionObserverMock.instances[0].trigger(false));

    expect(screen.getByRole("link", { name: "Mua ngay" })).toHaveAttribute(
      "href",
      "/store/vi",
    );
  });

  it("does not render outside canonical CSA routes", () => {
    navigation.pathname = "/store/en";
    render(<FloatingBuyNow />);

    expect(IntersectionObserverMock.instances).toHaveLength(0);
    expect(screen.queryByRole("link", { name: "Buy now" })).toBeNull();
  });
});
