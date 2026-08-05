"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { accountApi } from "@/features/account/api";
import type { CurrentMembership } from "@/features/account/types";
import type { Locale } from "@/lib/i18n";

type DestinationState = "idle" | "loading" | "ready" | "error";

export function useHeaderMembershipDestination({
  locale,
  pathname,
  userId,
}: {
  locale: Locale;
  pathname: string;
  userId?: string;
}) {
  const [membershipHref, setMembershipHref] = useState<string>();
  const [state, setState] = useState<DestinationState>("idle");
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!userId || request.current) {
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setMembershipHref(undefined);
    setState("loading");
    try {
      const payload = await accountApi<CurrentMembership | null>(
        `memberships/current?locale=${locale}`,
        { signal: controller.signal },
      );
      if (request.current !== controller) return;
      const hasCurrentMembership =
        payload.data?.status === "scheduled" ||
        payload.data?.status === "active";
      setMembershipHref(
        hasCurrentMembership ? `/account/${locale}/membership` : undefined,
      );
      setState("ready");
    } catch {
      if (request.current !== controller || controller.signal.aborted) return;
      setMembershipHref(undefined);
      setState("error");
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [locale, userId]);

  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setState("idle");
    setMembershipHref(undefined);
  }, [pathname]);
  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setMembershipHref(undefined);
    setState("idle");
  }, [locale, userId]);
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );

  return {
    hasCurrentMembership:
      state === "ready" && membershipHref !== undefined,
    membershipHref,
    load,
  };
}
