import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/content/site-content";
import { TestimonialsPage } from "@/features/testimonials/testimonials-page";
import { testimonialFixture } from "@/test/testimonial-fixture";

const copy = getSiteContent("en").testimonials;
const customer = testimonialFixture({
  requested_locale: "en",
  content_locale: "vi",
  is_fallback: true,
  display_name: "Customer A",
});
const farmer = testimonialFixture({
  id: "33333333-3333-4333-8333-333333333333",
  requested_locale: "en",
  content_locale: "en",
  display_name: "Farmer B",
  type: "farmer",
});
const latest = testimonialFixture({
  id: "44444444-4444-4444-8444-444444444444",
  requested_locale: "vi",
  content_locale: "vi",
  display_name: "Latest C",
  type: "farmer",
});

type TestimonialPayload = {
  data: ReturnType<typeof testimonialFixture>[];
  meta: { page: number; page_size: number; total: number };
};

function jsonResponse(payload: TestimonialPayload) {
  return Promise.resolve({
    ok: true,
    json: async () => payload,
  } as Response);
}

function payload(
  data: TestimonialPayload["data"],
  meta: Partial<TestimonialPayload["meta"]> = {},
): TestimonialPayload {
  return {
    data,
    meta: { page: 1, page_size: 12, total: data.length, ...meta },
  };
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Testimonials page data interactions", () => {
  it("shows the full skeleton only during the initial request", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );

    render(<TestimonialsPage locale="en" />);

    expect(screen.getByRole("status", { name: copy.loading })).toHaveAttribute(
      "data-state",
      "loading",
    );
    expect(screen.queryByRole("list", { name: copy.listLabel })).toBeNull();
    const filters = screen.getByRole("group", { name: copy.filtersLabel });
    expect(filters).toHaveAttribute("aria-busy", "true");
    for (const control of within(filters).getAllByRole("button")) {
      expect(control).toBeDisabled();
    }
  });

  it("keeps existing cards and focus while a filter refresh succeeds", async () => {
    const refresh = deferredResponse();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse(payload([customer])))
      .mockImplementationOnce(() => refresh.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<TestimonialsPage locale="en" />);
    expect(await screen.findByText(customer.display_name)).toBeVisible();

    const farmerFilter = screen.getByRole("button", {
      name: copy.filterFarmer,
    });
    farmerFilter.focus();
    fireEvent.click(farmerFilter);

    expect(screen.getByText(customer.display_name)).toBeVisible();
    expect(document.querySelector('[data-state="loading"]')).toBeNull();
    expect(screen.getByRole("status", { name: copy.updating })).toBeVisible();
    expect(farmerFilter).toHaveFocus();
    expect(farmerFilter).toBeDisabled();
    expect(screen.getByRole("list", { name: copy.listLabel })).toHaveAttribute(
      "aria-busy",
      "true",
    );

    refresh.resolve(await jsonResponse(payload([farmer])));

    expect(await screen.findByText(farmer.display_name)).toBeVisible();
    expect(screen.queryByText(customer.display_name)).toBeNull();
    expect(farmerFilter).toBeEnabled();
    expect(screen.getByRole("list", { name: copy.listLabel })).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });

  it("keeps old cards after a refresh error and retries in place", async () => {
    const retry = deferredResponse();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse(payload([customer])))
      .mockImplementationOnce(() => Promise.reject(new Error("offline")))
      .mockImplementationOnce(() => retry.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<TestimonialsPage locale="en" />);
    expect(await screen.findByText(customer.display_name)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: copy.filterFarmer }));

    expect(await screen.findByRole("alert")).toHaveTextContent(copy.error);
    expect(screen.getByText(customer.display_name)).toBeVisible();
    expect(document.querySelector('[data-state="loading"]')).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: copy.retry }));

    expect(screen.getByText(customer.display_name)).toBeVisible();
    expect(screen.getByRole("status", { name: copy.updating })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    retry.resolve(await jsonResponse(payload([farmer])));

    expect(await screen.findByText(farmer.display_name)).toBeVisible();
    expect(screen.queryByText(customer.display_name)).toBeNull();
  });

  it("keeps the large error state when the initial request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("offline")))
      .mockImplementationOnce(() => jsonResponse(payload([customer])));
    vi.stubGlobal("fetch", fetchMock);
    render(<TestimonialsPage locale="en" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(copy.error);
    expect(screen.queryByRole("list", { name: copy.listLabel })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: copy.retry }));

    expect(await screen.findByText(customer.display_name)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses the same stable refresh behavior for pagination", async () => {
    const nextPage = deferredResponse();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        jsonResponse(payload([customer], { total: 13 })),
      )
      .mockImplementationOnce(() => nextPage.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<TestimonialsPage locale="en" />);
    expect(await screen.findByText(customer.display_name)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: copy.next }));

    expect(screen.getByText(customer.display_name)).toBeVisible();
    expect(document.querySelector('[data-state="loading"]')).toBeNull();
    expect(screen.getByRole("status", { name: copy.updating })).toBeVisible();
    expect(screen.getByRole("button", { name: copy.previous })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.next })).toBeDisabled();
    nextPage.resolve(
      await jsonResponse(payload([farmer], { page: 2, total: 13 })),
    );

    expect(await screen.findByText(farmer.display_name)).toBeVisible();
    expect(screen.queryByText(customer.display_name)).toBeNull();
    expect(fetchMock.mock.calls[1][0]).toContain("page=2");
  });

  it("aborts and ignores a stale refresh response", async () => {
    const stale = deferredResponse();
    let staleSignal: AbortSignal | undefined;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse(payload([customer])))
      .mockImplementationOnce((_url, init?: RequestInit) => {
        staleSignal = init?.signal ?? undefined;
        return stale.promise;
      })
      .mockImplementationOnce(() => jsonResponse(payload([latest])));
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<TestimonialsPage locale="en" />);
    expect(await screen.findByText(customer.display_name)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: copy.filterFarmer }));
    expect(screen.getByRole("status", { name: copy.updating })).toBeVisible();

    view.rerender(<TestimonialsPage locale="vi" />);

    await waitFor(() => expect(staleSignal?.aborted).toBe(true));
    expect(await screen.findByText(latest.display_name)).toBeVisible();
    stale.resolve(await jsonResponse(payload([farmer])));
    await Promise.resolve();

    expect(screen.getByText(latest.display_name)).toBeVisible();
    expect(screen.queryByText(farmer.display_name)).toBeNull();
  });

  it("aborts list work on unmount", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        return new Promise(() => undefined);
      }),
    );
    const view = render(<TestimonialsPage locale="en" />);

    view.unmount();

    await waitFor(() => expect(signal?.aborted).toBe(true));
  });
});
