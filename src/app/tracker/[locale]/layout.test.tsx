import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TrackerLayout from "./layout";

const localeShellSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/locale-shell", () => ({
  LocaleShell: (props: {
    children: React.ReactNode;
    locale: string;
    showCommunityActions?: boolean;
  }) => {
    const { children, locale, showCommunityActions } = props;
    localeShellSpy({ locale, showCommunityActions });
    return (
      <div data-locale-shell lang={locale}>
        <header data-testid="site-header" />
        <main id="main">{children}</main>
        {showCommunityActions !== false ? (
          <>
            <aside data-testid="testimonials-widget" />
            <div data-testid="community-floating-actions" />
          </>
        ) : null}
        <footer data-testid="site-footer" />
      </div>
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TrackerLayout", () => {
  it.each(["vi", "en"])(
    "renders /tracker/%s through the shared locale shell once",
    async (locale) => {
      render(
        await TrackerLayout({
          children: <section>Tracker content</section>,
          params: Promise.resolve({ locale }),
        }),
      );

      expect(screen.getAllByTestId("site-header")).toHaveLength(1);
      expect(screen.getAllByTestId("site-footer")).toHaveLength(1);
      expect(
        screen.queryByTestId("testimonials-widget"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("community-floating-actions"),
      ).not.toBeInTheDocument();
      expect(localeShellSpy).toHaveBeenCalledWith({
        locale,
        showCommunityActions: false,
      });
      expect(
        screen.getByText("Tracker content").closest(".tracker-standalone"),
      ).not.toBeNull();
      expect(document.querySelectorAll("main")).toHaveLength(1);
      expect(document.querySelector("main")).toHaveAttribute("id", "main");
      expect(document.querySelector("[data-locale-shell]")).toHaveAttribute(
        "lang",
        locale,
      );
    },
  );
});
