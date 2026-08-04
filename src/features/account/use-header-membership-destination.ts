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
  const publicHref = `/${locale}/csa`;
  const [href, setHref] = useState(publicHref);
  const [state, setState] = useState<DestinationState>("idle");
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!userId || state === "ready" || request.current) {
      return;
    }
    const controller = new AbortController();
    request.current = controller;
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
      setHref(
        hasCurrentMembership ? `/account/${locale}/membership` : publicHref,
      );
      setState("ready");
    } catch {
      if (request.current !== controller || controller.signal.aborted) return;
      setHref(publicHref);
      setState("error");
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [locale, publicHref, state, userId]);

  useEffect(() => {
    if (!request.current) return;
    request.current.abort();
    request.current = null;
    setState("idle");
    setHref(publicHref);
  }, [pathname, publicHref]);
  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setHref(publicHref);
    setState("idle");
  }, [publicHref, userId]);
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );

  return { href, load };
}
