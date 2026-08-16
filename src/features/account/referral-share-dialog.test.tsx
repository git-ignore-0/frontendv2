import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteContent } from "@/content/site-content";
import { ReferralShareDialog } from "@/features/account/referral-share-dialog";

const code = "NFV1234567";
const origin = "https://www.naturalfarmingvietnam.com";
const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const originalMatchMedia = Object.getOwnPropertyDescriptor(
  window,
  "matchMedia",
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  restoreProperty(navigator, "share", originalShare);
  restoreProperty(navigator, "clipboard", originalClipboard);
  restoreProperty(window, "matchMedia", originalMatchMedia);
});

describe("ReferralShareDialog sharing", () => {
  it("shows native sharing without the platform grid on mobile", async () => {
    mockShareMedia("mobile");
    setProperty(navigator, "share", vi.fn().mockResolvedValue(undefined));
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(
      await screen.findByRole("button", { name: "Share via apps" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Share on" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Share on Facebook" }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy message" })).toBeVisible();
  });

  it("keeps copy fallbacks on mobile when native sharing is unsupported", async () => {
    mockShareMedia("mobile");
    setProperty(navigator, "share", undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    setProperty(navigator, "clipboard", { writeText });
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(
      screen.queryByRole("button", { name: "Share via apps" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Share on" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(writeText.mock.calls[0][0]).toBe(referralUrlFor("en"));
    expect(writeText.mock.calls[1][0]).toContain(referralUrlFor("en"));
    expect(writeText.mock.calls.flat().join(" ")).not.toContain("/share/ref/");
  });

  it("shares the edited mobile message with one referral URL", async () => {
    mockShareMedia("mobile");
    const share = vi.fn().mockResolvedValue(undefined);
    setProperty(navigator, "share", share);
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    const nativeShare = await screen.findByRole("button", {
      name: "Share via apps",
    });
    const referralUrl = referralUrlFor("en");
    const editedMessage = `My edited invitation ${referralUrl}`;
    fireEvent.change(screen.getByLabelText("Message to share"), {
      target: { value: editedMessage },
    });
    fireEvent.click(nativeShare);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share).toHaveBeenCalledWith({
      title: "Share your referral link",
      text: editedMessage,
    });
    expect(share.mock.calls[0][0].text).not.toContain("/share/ref/");
    expect(urlOccurrences(share.mock.calls[0][0].text, referralUrl)).toBe(1);
    await waitFor(() => expect(nativeShare).toBeEnabled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders desktop platforms instead of native share on a fine pointer", async () => {
    mockShareMedia("desktop");
    setProperty(navigator, "share", vi.fn().mockResolvedValue(undefined));
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(
      await screen.findByRole("heading", { name: "Share on" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Share on Facebook" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Share via WhatsApp" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Share by email" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Share via apps" })).toBeNull();
  });

  it("shares only the referral URL through Facebook", async () => {
    mockShareMedia("desktop");
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    fireEvent.change(screen.getByLabelText("Message to share"), {
      target: { value: "Private edited caption" },
    });
    const facebook = await screen.findByRole("link", {
      name: "Share on Facebook",
    });

    const target = new URL(facebook.getAttribute("href") ?? "");
    expect(`${target.origin}${target.pathname}`).toBe(
      "https://www.facebook.com/sharer/sharer.php",
    );
    expect(target.searchParams.get("u")).toBe(
      `${origin}/share/ref/${code}?locale=en`,
    );
    expect(target.searchParams.has("text")).toBe(false);
    expect(target.toString()).not.toContain("Private%20edited%20caption");
    expect(facebook).toHaveAttribute("target", "_blank");
    expect(facebook).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shares the edited message with one URL through WhatsApp", async () => {
    mockShareMedia("desktop");
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    const referralUrl = referralUrlFor("en");
    const editedMessage = `An edited WhatsApp invitation ${referralUrl}`;
    fireEvent.change(screen.getByLabelText("Message to share"), {
      target: { value: editedMessage },
    });
    const whatsapp = await screen.findByRole("link", {
      name: "Share via WhatsApp",
    });

    const target = new URL(whatsapp.getAttribute("href") ?? "");
    const sharedText = target.searchParams.get("text") ?? "";
    expect(`${target.origin}${target.pathname}`).toBe("https://wa.me/");
    expect(sharedText).toBe(editedMessage);
    expect(urlOccurrences(sharedText, referralUrl)).toBe(1);
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("appends one URL to WhatsApp when the user removes it", async () => {
    mockShareMedia("desktop");
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    fireEvent.change(screen.getByLabelText("Message to share"), {
      target: { value: "Message without the link" },
    });
    const whatsapp = await screen.findByRole("link", {
      name: "Share via WhatsApp",
    });

    const sharedText =
      new URL(whatsapp.getAttribute("href") ?? "").searchParams.get("text") ??
      "";
    const referralUrl = referralUrlFor("en");
    expect(sharedText).toBe(`Message without the link\n${referralUrl}`);
    expect(urlOccurrences(sharedText, referralUrl)).toBe(1);
  });

  it("opens localized email with edited body and one appended URL", async () => {
    mockShareMedia("desktop");
    renderDialog("vi");
    fireEvent.click(screen.getByRole("button", { name: "Chia sẻ" }));
    fireEvent.change(screen.getByLabelText("Tin nhắn chia sẻ"), {
      target: { value: "Lời mời mình đã chỉnh sửa" },
    });
    const email = await screen.findByRole("link", {
      name: "Chia sẻ qua email",
    });

    const target = new URL(email.getAttribute("href") ?? "");
    const body = target.searchParams.get("body") ?? "";
    const referralUrl = referralUrlFor("vi");
    expect(target.protocol).toBe("mailto:");
    expect(target.searchParams.get("subject")).toBe(
      "Khám phá Natural Farming Vietnam",
    );
    expect(body).toBe(`Lời mời mình đã chỉnh sửa\n${referralUrl}`);
    expect(urlOccurrences(body, referralUrl)).toBe(1);
    expect(email).not.toHaveAttribute("target");
    expect(email).not.toHaveAttribute("rel");
    expect(screen.getByRole("heading", { name: "Chia sẻ qua" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Chia sẻ trên Facebook" }),
    ).toBeVisible();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not use the popup API for desktop platform sharing", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/features/account/referral-share-dialog.tsx"),
      "utf8",
    );

    expect(source).not.toContain("window.open");
    expect(source).not.toContain("opened.opener");
  });

  it("updates the share surface when responsive media queries change", async () => {
    const media = mockShareMedia("mobile");
    setProperty(navigator, "share", vi.fn().mockResolvedValue(undefined));
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(
      await screen.findByRole("button", { name: "Share via apps" }),
    ).toBeVisible();

    act(() => media.setMode("desktop"));

    expect(
      await screen.findByRole("link", { name: "Share on Facebook" }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Share via apps" })).toBeNull();
  });

  it("treats native share cancellation as a neutral outcome", async () => {
    mockShareMedia("mobile");
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    setProperty(navigator, "share", share);
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    const nativeShare = await screen.findByRole("button", {
      name: "Share via apps",
    });
    fireEvent.click(nativeShare);

    await waitFor(() => expect(nativeShare).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("reports native errors and prevents double share while pending", async () => {
    mockShareMedia("mobile");
    let rejectShare: ((reason: Error) => void) | undefined;
    const share = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectShare = reject;
        }),
    );
    setProperty(navigator, "share", share);
    renderDialog("en");
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    const nativeShare = await screen.findByRole("button", {
      name: "Share via apps",
    });
    fireEvent.click(nativeShare);
    fireEvent.click(nativeShare);

    expect(share).toHaveBeenCalledTimes(1);
    expect(nativeShare).toBeDisabled();
    await act(async () => rejectShare?.(new Error("Share unavailable")));
    expect(nativeShare).toBeEnabled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to open sharing options. Please copy the message instead.",
    );
  });
});

function renderDialog(locale: "en" | "vi") {
  render(
    <ReferralShareDialog
      code={code}
      copy={getSiteContent(locale).account}
      locale={locale}
      origin={origin}
    />,
  );
}

function referralUrlFor(locale: "en" | "vi") {
  return `${origin}/ref/${code}?locale=${locale}`;
}

function setProperty(target: object, property: PropertyKey, value: unknown) {
  Object.defineProperty(target, property, { configurable: true, value });
}

function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
  } else {
    Reflect.deleteProperty(target, property);
  }
}

function mockShareMedia(initialMode: "mobile" | "desktop") {
  const states = new Map<
    string,
    { matches: boolean; listeners: Set<EventListener> }
  >();
  const matchesFor = (query: string, mode: "mobile" | "desktop") =>
    mode === "mobile" &&
    (query === "(pointer: coarse)" || query === "(max-width: 760px)");

  setProperty(window, "matchMedia", (query: string) => {
    const state = states.get(query) ?? {
      matches: matchesFor(query, initialMode),
      listeners: new Set<EventListener>(),
    };
    states.set(query, state);
    return {
      get matches() {
        return state.matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListener) =>
        state.listeners.add(listener),
      removeEventListener: (_type: string, listener: EventListener) =>
        state.listeners.delete(listener),
      addListener: (listener: EventListener) => state.listeners.add(listener),
      removeListener: (listener: EventListener) =>
        state.listeners.delete(listener),
      dispatchEvent: () => true,
    } as MediaQueryList;
  });

  return {
    setMode(mode: "mobile" | "desktop") {
      for (const [query, state] of states) {
        state.matches = matchesFor(query, mode);
        for (const listener of state.listeners) listener(new Event("change"));
      }
    },
  };
}

function urlOccurrences(message: string, referralUrl: string) {
  return message.split(referralUrl).length - 1;
}
