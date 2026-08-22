"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getTrackerImageSource } from "./lib/media";
import type { PublicTrackerImage } from "./lib/public-contract";
import type { TrackerFarmViewModel } from "./lib/view-model";
import { TrackerMilestoneIcon } from "./tracker-icon";
import type { TrackerCopy } from "./types";

const expandedDialogClass = "farmer-dialog--expand-about";
const mediaClass = "farmer-dialog__media";
const mediaWithPrimaryClass = "farmer-dialog__media--with-primary";

function replaceCopy(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replace(`{${key}}`, String(value)),
    template,
  );
}

function activateWithKeyboard(
  event: React.KeyboardEvent<HTMLElement>,
  activate: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  activate();
}

function TrackerImageLightbox({
  copy,
  farmName,
  image,
  imageCount,
  imageIndex,
  onClose,
  onImageError,
  onMove,
  opener,
  fallbackOpener,
}: {
  copy: TrackerCopy;
  farmName: string;
  image: PublicTrackerImage | null;
  imageCount: number;
  imageIndex: number | null;
  onClose: () => void;
  onImageError: (imageId: string) => void;
  onMove: (step: number) => void;
  opener: HTMLElement | null;
  fallbackOpener: HTMLElement | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerStartXRef = useRef<number | null>(null);

  const finishClose = () => {
    onClose();
    requestAnimationFrame(() => {
      if (opener?.isConnected) {
        opener.focus();
      } else {
        fallbackOpener?.focus();
      }
    });
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
    if (!dialog) return;
    if (imageIndex === null || !image) {
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
      return;
    }
    if (typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }, [image, imageIndex]);

  return (
    <dialog
      aria-label={copy.farmPhotoViewer}
      className="image-lightbox"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      onClose={finishClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeDialog();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          onMove(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onMove(1);
        }
      }}
      ref={dialogRef}
    >
      {image && imageIndex !== null ? (
        <div
          className="image-lightbox__stage"
          onPointerDown={(event) => {
            if (event.pointerType === "mouse") return;
            pointerStartXRef.current = event.clientX;
          }}
          onPointerUp={(event) => {
            const startX = pointerStartXRef.current;
            if (startX === null || event.pointerType === "mouse") return;

            const deltaX = event.clientX - startX;
            pointerStartXRef.current = null;

            if (Math.abs(deltaX) < 48) return;
            onMove(deltaX < 0 ? 1 : -1);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={image.alt}
            className="image-lightbox__image"
            height={image.height}
            onError={() => onImageError(image.id)}
            src={getTrackerImageSource(image, "lightbox")}
            width={image.width}
          />
          <button
            aria-label={copy.closeImageViewer}
            className="image-lightbox__close"
            onClick={closeDialog}
            type="button"
          >
            ×
          </button>
          <button
            aria-label={copy.previousImage}
            className="image-lightbox__nav image-lightbox__nav--prev"
            hidden={imageCount < 2}
            onClick={() => onMove(-1)}
            type="button"
          >
            ‹
          </button>
          <button
            aria-label={copy.nextImage}
            className="image-lightbox__nav image-lightbox__nav--next"
            hidden={imageCount < 2}
            onClick={() => onMove(1)}
            type="button"
          >
            ›
          </button>
          <div className="image-lightbox__meta">
            <span className="image-lightbox__caption">{farmName}</span>
            <span className="image-lightbox__counter">
              {imageIndex + 1} / {imageCount}
            </span>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

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
  const lightboxOpenerRef = useRef<HTMLElement | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [expandAbout, setExpandAbout] = useState(false);
  const usableImages = useMemo(
    () => farm?.images.filter((image) => !failedImageIds.has(image.id)) ?? [],
    [failedImageIds, farm],
  );
  const primaryImage = usableImages[0] ?? null;
  const lightboxImage =
    lightboxIndex === null ? null : (usableImages[lightboxIndex] ?? null);

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

  const openLightbox = (index: number, imageOpener: HTMLElement) => {
    lightboxOpenerRef.current = imageOpener;
    setLightboxIndex(index);
  };

  const markImageFailed = (imageId: string) => {
    setFailedImageIds((current) => new Set(current).add(imageId));
  };

  const handleLightboxImageFailed = (imageId: string) => {
    const failedIndex = usableImages.findIndex((image) => image.id === imageId);
    const remainingImages = usableImages.filter(
      (image) => image.id !== imageId,
    );

    markImageFailed(imageId);
    if (remainingImages.length === 0) {
      setLightboxIndex(null);
      return;
    }

    setLightboxIndex(
      Math.min(Math.max(failedIndex, 0), remainingImages.length - 1),
    );
  };

  const moveLightbox = (step: number) => {
    if (usableImages.length < 2) return;
    setLightboxIndex((current) => {
      const index = current ?? 0;
      return (index + step + usableImages.length) % usableImages.length;
    });
  };

  useEffect(() => {
    setFailedImageIds(new Set());
    setLightboxIndex(null);
    setExpandAbout(false);
  }, [farm?.description, farm?.id]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    if (usableImages.length === 0) {
      setLightboxIndex(null);
    } else if (lightboxIndex >= usableImages.length) {
      setLightboxIndex(usableImages.length - 1);
    }
  }, [lightboxIndex, usableImages.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !farm) return;
    document.body.classList.add("tracker-dialog-open");
    document.documentElement.classList.add("tracker-dialog-open");
    if (typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    closeButtonRef.current?.focus();
    const measure = () => {
      const about = dialog.querySelector<HTMLElement>(
        ".farmer-dialog__about-scroll",
      );
      if (!about) return;
      const needsExpansion =
        dialog.scrollHeight > dialog.clientHeight + 1 ||
        about.scrollHeight > about.clientHeight + 1;
      // Once expanded for this farm, keep the bounded layout. Otherwise the
      // ResizeObserver can oscillate between the natural and expanded states.
      if (needsExpansion) setExpandAbout(true);
    };
    const frame = requestAnimationFrame(measure);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(dialog);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.body.classList.remove("tracker-dialog-open");
      document.documentElement.classList.remove("tracker-dialog-open");
    };
  }, [farm]);

  const photoCountCopy =
    usableImages.length === 1 ? copy.photoCountOne : copy.photoCountMany;

  return (
    <>
      {farm ? (
        <div
          aria-hidden="true"
          className="farmer-dialog-backdrop"
          onClick={closeDialog}
        />
      ) : null}
      <dialog
        aria-labelledby="tracker-farmer-dialog-name"
        aria-modal="true"
        className={["farmer-dialog", expandAbout && expandedDialogClass]
          .filter(Boolean)
          .join(" ")}
        onCancel={(event) => {
          event.preventDefault();
          if (lightboxIndex === null) closeDialog();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && lightboxIndex === null) {
            closeDialog();
          }
        }}
        onClose={finishClose}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || lightboxIndex !== null) return;
          event.preventDefault();
          closeDialog();
        }}
        ref={dialogRef}
      >
        {farm ? (
          <>
            <button
              aria-label={copy.closeFarmerDetails}
              className="farmer-dialog__close"
              onClick={closeDialog}
              ref={closeButtonRef}
              type="button"
            >
              ×
            </button>
            <div className="farmer-dialog__body">
              <div
                className={
                  primaryImage
                    ? `${mediaClass} ${mediaWithPrimaryClass}`
                    : mediaClass
                }
              >
                <div className="farmer-dialog__fallback">
                  <TrackerMilestoneIcon
                    size={farm.isLeader ? 72 : 78}
                    type={farm.icon}
                  />
                </div>
                {primaryImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={primaryImage.alt}
                      aria-label={copy.viewPhoto}
                      className="dialog-photo"
                      height={primaryImage.height}
                      onClick={(event) => openLightbox(0, event.currentTarget)}
                      onError={() => markImageFailed(primaryImage.id)}
                      onKeyDown={(event) =>
                        activateWithKeyboard(event, () =>
                          openLightbox(0, event.currentTarget),
                        )
                      }
                      role="button"
                      src={getTrackerImageSource(primaryImage, "primary")}
                      tabIndex={0}
                      width={primaryImage.width}
                    />
                    <span aria-hidden="true" className="dialog-photo-hint">
                      ⌕ {copy.viewPhoto}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="farmer-dialog__content">
                <div className="farmer-dialog__profile">
                  <p className="farmer-dialog__eyebrow">{copy.farmerProfile}</p>
                  <h2
                    className="farmer-dialog__name"
                    id="tracker-farmer-dialog-name"
                  >
                    {farm.name}
                  </h2>
                  <p className="farmer-dialog__address">
                    <span aria-hidden="true">📍</span>
                    <span>{farm.location}</span>
                  </p>
                </div>
                <div className="farmer-dialog__about">
                  <p className="farmer-dialog__about-label">
                    {copy.aboutFarmer}
                  </p>
                  <div className="farmer-dialog__about-scroll">
                    <p className="farmer-dialog__description">
                      {farm.description}
                    </p>
                  </div>
                </div>
                {usableImages.length > 0 ? (
                  <section
                    aria-labelledby="tracker-farmer-gallery-label"
                    className="farmer-gallery"
                  >
                    <div className="farmer-gallery__head">
                      <p
                        className="farmer-gallery__label"
                        id="tracker-farmer-gallery-label"
                      >
                        {copy.farmPhotos}
                      </p>
                      <span className="farmer-gallery__count">
                        {replaceCopy(photoCountCopy, {
                          count: usableImages.length,
                        })}
                      </span>
                    </div>
                    <div className="farmer-gallery__rail">
                      {usableImages.map((image, index) => (
                        <button
                          aria-label={replaceCopy(copy.openFarmPhoto, {
                            index: index + 1,
                            count: usableImages.length,
                          })}
                          className="farmer-gallery__thumb"
                          key={image.id}
                          onClick={(event) =>
                            openLightbox(index, event.currentTarget)
                          }
                          type="button"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt=""
                            height={image.height}
                            loading="lazy"
                            onError={() => markImageFailed(image.id)}
                            src={getTrackerImageSource(image, "thumbnail")}
                            width={image.width}
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </dialog>
      <TrackerImageLightbox
        copy={copy}
        farmName={farm?.name ?? ""}
        image={lightboxImage}
        imageCount={usableImages.length}
        imageIndex={lightboxIndex}
        fallbackOpener={closeButtonRef.current}
        onClose={() => setLightboxIndex(null)}
        onImageError={handleLightboxImageFailed}
        onMove={moveLightbox}
        opener={lightboxOpenerRef.current}
      />
    </>
  );
}
