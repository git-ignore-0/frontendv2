import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TestimonialsWidget } from "@/components/testimonials/testimonials-widget";
import { getSiteContent } from "@/content/site-content";
import { testimonialFixture } from "@/test/testimonial-fixture";

const navigation = vi.hoisted(() => ({ pathname: "/en" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

const copy = getSiteContent("en").testimonials;
const summary = testimonialFixture({
  requested_locale: "en",
  content_locale: "en",
  display_name: "Mai Tran",
  role: "Farmer",
  quote: "The soil came back to life.",
});
const detail = testimonialFixture({
  ...summary,
  full_story: "A complete story loaded from the detail endpoint.",
});

function jsonResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: async () => data,
  } as Response);
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
});

afterEach(() => {
  cleanup();
  navigation.pathname = "/en";
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
});

describe("Testimonials launcher and layered dialogs", () => {
  it.each(["/testimonials/en", "/testimonials/vi"])(
    "does not render or fetch on the canonical Testimonials route %s",
    (pathname) => {
      navigation.pathname = pathname;
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      render(<TestimonialsWidget locale="en" />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(["/account/en/points", "/en"])(
    "keeps both responsive launchers on %s",
    (pathname) => {
      navigation.pathname = pathname;

      render(<TestimonialsWidget locale="en" />);

      expect(
        screen.getAllByRole("button", { name: copy.launcher }),
      ).toHaveLength(2);
    },
  );

  it("loads on demand, traps focus and returns focus after closing", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => jsonResponse({ data: [summary] }));
    vi.stubGlobal("fetch", fetchMock);
    render(<TestimonialsWidget locale="en" />);

    const launcher = screen.getAllByRole("button", { name: copy.launcher })[0];
    launcher.focus();
    fireEvent.click(launcher);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/testimonials/featured?locale=en",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    const close = await screen.findByRole("button", { name: copy.closeDrawer });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    const viewAll = screen.getByRole("link", { name: copy.viewAll });
    viewAll.focus();
    fireEvent.keyDown(viewAll, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(viewAll).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: copy.drawerTitle }),
      ).not.toBeInTheDocument(),
    );
    expect(launcher).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("Escape and backdrops close only the current layer", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ data: [summary] }))
      .mockImplementationOnce(() => jsonResponse({ data: detail }));
    vi.stubGlobal("fetch", fetchMock);
    render(<TestimonialsWidget locale="en" />);

    fireEvent.click(screen.getAllByRole("button", { name: copy.launcher })[0]);
    const storyButton = await screen.findByRole("button", {
      name: copy.openStory.replace("{name}", summary.display_name),
    });
    fireEvent.click(storyButton);

    const detailClose = await screen.findByRole("button", {
      name: copy.closeDetail,
    });
    expect(detailClose).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: copy.closeDetail }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("dialog", { name: copy.drawerTitle }),
    ).toBeVisible();
    expect(storyButton).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.mouseDown(screen.getByTestId("testimonials-drawer-backdrop"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("shows featured errors and retries without reloading the page", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("offline")))
      .mockImplementationOnce(() => jsonResponse({ data: [summary] }));
    vi.stubGlobal("fetch", fetchMock);
    render(<TestimonialsWidget locale="en" />);

    fireEvent.click(screen.getAllByRole("button", { name: copy.launcher })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.error);
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));

    expect(
      await screen.findByRole("button", {
        name: copy.openStory.replace("{name}", summary.display_name),
      }),
    ).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps detail errors open and retries the full story request", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ data: [summary] }))
      .mockImplementationOnce(() => Promise.reject(new Error("offline")))
      .mockImplementationOnce(() => jsonResponse({ data: detail }));
    vi.stubGlobal("fetch", fetchMock);
    render(<TestimonialsWidget locale="en" />);

    fireEvent.click(screen.getAllByRole("button", { name: copy.launcher })[0]);
    fireEvent.click(
      await screen.findByRole("button", {
        name: copy.openStory.replace("{name}", summary.display_name),
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      copy.detailError,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.retry }));

    expect(await screen.findByText(detail.full_story!)).toBeVisible();
    expect(
      screen.getByRole("button", { name: copy.closeDetail }),
    ).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("aborts the featured request when the drawer closes", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        return new Promise(() => undefined);
      }),
    );
    render(<TestimonialsWidget locale="en" />);

    fireEvent.click(screen.getAllByRole("button", { name: copy.launcher })[0]);
    fireEvent.click(
      await screen.findByRole("button", { name: copy.closeDrawer }),
    );

    await waitFor(() => expect(signal?.aborted).toBe(true));
  });
});
