import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accountApi } from "@/features/account/api";
import type { CurrentMembership } from "@/features/account/types";
import { useHeaderMembershipDestination } from "@/features/account/use-header-membership-destination";

vi.mock("@/features/account/api", () => ({ accountApi: vi.fn() }));

const membership = {
  status: "active",
} as CurrentMembership;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useHeaderMembershipDestination", () => {
  it.each([
    [null, "/en/csa"],
    [{ ...membership, status: "ended" as const }, "/en/csa"],
    [{ ...membership, status: "scheduled" as const }, "/account/en/membership"],
    [membership, "/account/en/membership"],
  ])("maps current Membership %o to %s", async (data, expectedHref) => {
    vi.mocked(accountApi).mockResolvedValue({ data });
    const { result } = renderHook(() =>
      useHeaderMembershipDestination({
        locale: "en",
        pathname: "/en",
        userId: "user-a",
      }),
    );

    await act(async () => result.current.load());

    expect(result.current.href).toBe(expectedHref);
  });

  it("keeps the public CSA fallback while loading and after an error", async () => {
    let rejectRequest!: (reason: unknown) => void;
    vi.mocked(accountApi).mockReturnValue(
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
    );
    const { result } = renderHook(() =>
      useHeaderMembershipDestination({
        locale: "en",
        pathname: "/en",
        userId: "user-a",
      }),
    );

    act(() => void result.current.load());
    expect(result.current.href).toBe("/en/csa");
    await act(async () => rejectRequest(new Error("upstream unavailable")));
    expect(result.current.href).toBe("/en/csa");
  });

  it("aborts stale work on identity changes and ignores its late response", async () => {
    let resolveFirst!: (value: { data: CurrentMembership | null }) => void;
    let resolveSecond!: (value: { data: CurrentMembership | null }) => void;
    const first = new Promise<{ data: CurrentMembership | null }>((resolve) => {
      resolveFirst = resolve;
    });
    const second = new Promise<{ data: CurrentMembership | null }>(
      (resolve) => {
        resolveSecond = resolve;
      },
    );
    vi.mocked(accountApi)
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const { result, rerender } = renderHook(
      ({ pathname, userId }) =>
        useHeaderMembershipDestination({ locale: "en", pathname, userId }),
      { initialProps: { pathname: "/en", userId: "user-a" } },
    );

    act(() => void result.current.load());
    const firstSignal = vi.mocked(accountApi).mock.calls[0][1]?.signal;
    rerender({ pathname: "/en/csa", userId: "user-b" });
    await waitFor(() => expect(firstSignal?.aborted).toBe(true));
    act(() => void result.current.load());
    await act(async () =>
      resolveSecond({ data: { ...membership, status: "scheduled" } }),
    );
    expect(result.current.href).toBe("/account/en/membership");

    await act(async () => resolveFirst({ data: null }));
    expect(result.current.href).toBe("/account/en/membership");
  });

  it("does not fetch signed-out users or duplicate a current request", async () => {
    let resolveRequest!: (value: { data: CurrentMembership | null }) => void;
    vi.mocked(accountApi).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result, rerender } = renderHook(
      ({ userId }) =>
        useHeaderMembershipDestination({
          locale: "en",
          pathname: "/en",
          userId,
        }),
      { initialProps: { userId: undefined as string | undefined } },
    );

    await act(async () => result.current.load());
    expect(accountApi).not.toHaveBeenCalled();
    rerender({ userId: "user-a" });
    act(() => {
      void result.current.load();
      void result.current.load();
    });
    expect(accountApi).toHaveBeenCalledTimes(1);
    await act(async () => resolveRequest({ data: membership }));
    await act(async () => result.current.load());
    expect(accountApi).toHaveBeenCalledTimes(1);
  });
});
