"use client";

import { useCallback, useEffect, useState } from "react";

import { accountApi, isAccountSessionError } from "@/features/account/api";
import type { AccountSummary } from "@/features/account/types";

type AccountSummaryState = "loading" | "ready" | "error" | "signed-out";

export function useAccountSummary() {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [state, setState] = useState<AccountSummaryState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const payload = await accountApi<AccountSummary>("account");
      setSummary(payload.data);
      setState("ready");
    } catch (error) {
      setState(isAccountSessionError(error) ? "signed-out" : "error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { load, setSummary, state, summary };
}
