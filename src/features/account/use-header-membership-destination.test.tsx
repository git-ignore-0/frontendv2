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
    { ...membership, status: "scheduled" as const },
    membership,
  ])("exposes the account Membership destination for %s", async (data) => {
    vi.mocked(accountApi).mockResolvedValue({ data });
    const { result } = renderHook(() =>
      useHeaderMembershipDestination({
        locale: "en",
        pathname: "/en",
        userId: "user-a",
      }),
    );

    await act(async () => result.current.load());

    expect(result.current.hasCurrentMembership).toBe(true);
    expect(result.current.membershipHref).toBe("/account/en/membership");
  });

  it.each([
    null,
    { ...membership, status: "ended" as const },
    { ...membership, status: "revoked" as const },
  ])("does not expose a destination for %o", async (data) => {
    vi.mocked(accountApi).mockResolvedValue({ data });
    const { result } = renderHook(() =>
      useHeaderMembershipDestination({
        locale: "en",
        pathname: "/en",
        userId: "user-a",
      }),
    );

    await act(async () => result.current.load());

    expect(result.current.hasCurrentMembership).toBe(false);
    expect(result.current.membershipHref).toBeUndefined();
  });

  it("resets a completed active result when the pathname changes", async () => {
    vi.mocked(accountApi).mockResolvedValue({ data: membership });
    const { result, rerender } = renderHook(
      ({ pathname }) =>
        useHeaderMembershipDestination({
          locale: "en",
          pathname,
          userId: "user-a",
        }),
      { initialProps: { pathname: "/en" } },
    );

    await act(async () => result.current.load());
    expect(result.current.hasCurrentMembership).toBe(true);

    rerender({ pathname: "/en/csa" });

    expect(result.current.hasCurrentMembership).toBe(false);
    expect(result.current.membershipHref).toBeUndefined();
  });

  it.each([
    null,
    { ...membership, status: "revoked" } as unknown as CurrentMembership,
  ])(
    "hides a cached active result while refreshing to %o",
    async (nextMembership) => {
      let resolveRefresh!: (value: { data: CurrentMembership | null }) => void;
      vi.mocked(accountApi)
        .mockResolvedValueOnce({ data: membership })
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveRefresh = resolve;
          }),
        );
      const { result } = renderHook(() =>
        useHeaderMembershipDestination({
          locale: "en",
          pathname: "/en",
          userId: "user-a",
        }),
      );

      await act(async () => result.current.load());
      expect(result.current.hasCurrentMembership).toBe(true);

      act(() => void result.current.load());
      expect(result.current.hasCurrentMembership).toBe(false);
      expect(result.current.membershipHref).toBeUndefined();
      await act(async () => resolveRefresh({ data: nextMembership }));
      expect(result.current.hasCurrentMembership).toBe(false);
      expect(result.current.membershipHref).toBeUndefined();
      expect(accountApi).toHaveBeenCalledTimes(2);
    },
  );

  it("keeps the destination hidden while loading and after an error", async () => {
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
    expect(result.current.hasCurrentMembership).toBe(false);
    expect(result.current.membershipHref).toBeUndefined();
    await act(async () => rejectRequest(new Error("upstream unavailable")));
    expect(result.current.hasCurrentMembership).toBe(false);
    expect(result.current.membershipHref).toBeUndefined();
  });

  it.each([
    {
      label: "path",
      next: { pathname: "/en/csa", userId: "user-a" },
    },
    {
      label: "user",
      next: { pathname: "/en", userId: "user-b" },
    },
  ])("aborts stale work after a $label change", async ({ next }) => {
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
    rerender(next);
    await waitFor(() => expect(firstSignal?.aborted).toBe(true));
    act(() => void result.current.load());
    await act(async () => resolveSecond({ data: null }));
    expect(result.current.hasCurrentMembership).toBe(false);
    expect(result.current.membershipHref).toBeUndefined();

    await act(async () => resolveFirst({ data: membership }));
    expect(result.current.hasCurrentMembership).toBe(false);
    expect(result.current.membershipHref).toBeUndefined();
  });

  it("does not fetch signed-out users or duplicate an in-flight request", async () => {
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
    expect(accountApi).toHaveBeenCalledTimes(1);
    expect(result.current.hasCurrentMembership).toBe(true);
  });
});
