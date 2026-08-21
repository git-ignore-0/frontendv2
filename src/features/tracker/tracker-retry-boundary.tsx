"use client";

import { useState, useTransition } from "react";

import type { Locale } from "@/lib/i18n";

import {
  parseTrackerRetryResponse,
  type PublicTrackerFarm,
} from "./lib/public-contract";
import { TrackerPage } from "./tracker-page";
import type { TrackerCopy } from "./types";

export function TrackerRetryBoundary({
  copy,
  locale,
}: {
  copy: TrackerCopy;
  locale: Locale;
}) {
  const [farms, setFarms] = useState<PublicTrackerFarm[]>([]);
  const [state, setState] = useState<"error" | "ready">("error");
  const [, startRetry] = useTransition();

  const retry = () => {
    startRetry(async () => {
      try {
        const response = await fetch(
          `/api/tracker-farms?locale=${locale}&retry=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Tracker retry failed");
        const payload = parseTrackerRetryResponse(await response.json());
        setFarms(payload.data);
        setState("ready");
      } catch {
        setState("error");
      }
    });
  };

  return (
    <TrackerPage copy={copy} farms={farms} onRetry={retry} state={state} />
  );
}
