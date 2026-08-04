"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { accountApi, accountDateLocale } from "@/features/account/api";
import type { AccountSummary } from "@/features/account/types";
import type { Locale } from "@/lib/i18n";

type BalanceState = "idle" | "loading" | "ready" | "error";

export function useHeaderAccountBalance({
  locale,
  pathname,
  userId,
}: {
  locale: Locale;
  pathname: string;
  userId?: string;
}) {
  const [balance, setBalance] = useState<number | null>(null);
  const [state, setState] = useState<BalanceState>("idle");
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!userId || state === "ready" || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState("loading");
    try {
      const payload = await accountApi<AccountSummary>("account", {
        signal: controller.signal,
      });
      if (request.current !== controller) return;
      setBalance(payload.data.points_balance);
      setState("ready");
    } catch {
      if (request.current !== controller || controller.signal.aborted) return;
      setBalance(null);
      setState("error");
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [state, userId]);

  useEffect(() => {
    if (!request.current) return;
    request.current.abort();
    request.current = null;
    setState("idle");
  }, [pathname]);
  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setBalance(null);
    setState("idle");
  }, [userId]);
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );

  const label =
    state === "ready" && balance !== null
      ? new Intl.NumberFormat(accountDateLocale(locale)).format(balance)
      : state === "error"
        ? "—"
        : "…";

  return { label, load };
}
