"use client";

import { useEffect, useRef } from "react";

import type { TrackerFarmViewModel } from "./lib/view-model";
import { TrackerFarmMedia } from "./tracker-farm-media";
import type { TrackerCopy } from "./types";

export function TrackerFarmerDialog({
  copy,
  farm,
  opener,
  onDismiss,
}: {
  copy: TrackerCopy;
  farm: TrackerFarmViewModel | null;
  opener: HTMLElement | null;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const finishClose = () => {
    document.body.classList.remove("tracker-dialog-open");
    onDismiss();
    requestAnimationFrame(() => opener?.focus());
  };

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
      return;
    }

    dialog.removeAttribute("open");
    finishClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !farm) return;

    document.body.classList.add("tracker-dialog-open");
    if (typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    closeButtonRef.current?.focus();

    return () => document.body.classList.remove("tracker-dialog-open");
  }, [farm]);

  return (
    <dialog
      aria-labelledby="tracker-farmer-dialog-name"
      aria-modal="true"
      className="tracker-farmer-dialog"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      onClose={finishClose}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        closeDialog();
      }}
      ref={dialogRef}
    >
      {farm ? (
        <>
          <button
            aria-label={copy.closeFarmerDetails}
            className="tracker-dialog-close"
            onClick={closeDialog}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
          <div className="tracker-dialog-body">
            <div className="tracker-dialog-media">
              <TrackerFarmMedia farm={farm} variant="dialog" />
            </div>
            <div className="tracker-dialog-content">
              <p className="tracker-dialog-eyebrow">{copy.farmerProfile}</p>
              <h2
                className="tracker-dialog-name"
                id="tracker-farmer-dialog-name"
              >
                {farm.name}
              </h2>
              <p className="tracker-dialog-address">
                <span aria-hidden="true">📍</span>
                <span>{farm.location}</span>
              </p>
              <div className="tracker-dialog-about">
                <p className="tracker-dialog-about-label">{copy.aboutFarmer}</p>
                <p className="tracker-dialog-description">{farm.description}</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
