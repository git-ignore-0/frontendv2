"use client";

import { useState } from "react";

import type { PublicTrackerFarm } from "@/lib/content-api";

import { MilestoneLegend } from "./milestone-legend";
import { TrackerFarmGrid } from "./tracker-farm-grid";
import { TrackerFarmerDialog } from "./tracker-farmer-dialog";
import { TrackerField } from "./tracker-field";
import { TrackerHeader } from "./tracker-header";
import { TrackerLiveNote } from "./tracker-live-note";
import { TrackerState } from "./tracker-state";
import { TrackerStats } from "./tracker-stats";
import {
  calculateTrackerStats,
  createTrackerFarmViewModel,
} from "./lib/view-model";
import type { TrackerCopy } from "./types";

export function TrackerPage({
  copy,
  farms,
  state = "ready",
  onRetry,
}: {
  copy: TrackerCopy;
  farms: PublicTrackerFarm[];
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
}) {
  const farmModels = farms.map(createTrackerFarmViewModel);
  const stats = state === "loading" ? null : calculateTrackerStats(farms);
  const [selectedFarm, setSelectedFarm] = useState<ReturnType<
    typeof createTrackerFarmViewModel
  > | null>(null);
  const [dialogOpener, setDialogOpener] = useState<HTMLElement | null>(null);

  const openFarm = (
    farm: ReturnType<typeof createTrackerFarmViewModel>,
    opener: HTMLElement,
  ) => {
    setDialogOpener(opener);
    setSelectedFarm(farm);
  };

  return (
    <main className="tracker-page">
      <div className="tracker-shell">
        <TrackerHeader copy={copy} />
        <MilestoneLegend copy={copy} />
        <TrackerLiveNote copy={copy} />
        <TrackerStats copy={copy} stats={stats} />
        {state === "loading" ? (
          <TrackerState copy={copy} state="loading" />
        ) : state === "error" ? (
          <TrackerState copy={copy} onRetry={onRetry} state="error" />
        ) : farmModels.length === 0 ? (
          <TrackerState copy={copy} state="empty" />
        ) : (
          <>
            <TrackerField
              copy={copy}
              farms={farmModels}
              onActivate={openFarm}
            />
            <TrackerFarmGrid
              copy={copy}
              farms={farmModels}
              onActivate={openFarm}
            />
          </>
        )}
      </div>
      <TrackerFarmerDialog
        copy={copy}
        farm={selectedFarm}
        onDismiss={() => setSelectedFarm(null)}
        opener={dialogOpener}
      />
    </main>
  );
}
