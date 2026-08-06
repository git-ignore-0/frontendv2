"use client";

import { type RefObject, useEffect, useId, useRef, useState } from "react";

import { CloseIcon, UserIcon } from "@/components/icons";
import {
  TestimonialImage,
  TestimonialTag,
} from "@/components/testimonials/testimonial-presentation";
import { useTestimonialDialog } from "@/components/testimonials/use-testimonial-dialog";
import { getSiteContent } from "@/content/site-content";
import type { PublicTestimonial } from "@/lib/content-api";
import type { Locale } from "@/lib/i18n";

export function TestimonialDetailModal({
  initialData,
  locale,
  onClose,
  returnFocusRef,
  uuid,
}: {
  initialData: PublicTestimonial;
  locale: Locale;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  uuid: string;
}) {
  const copy = getSiteContent(locale).testimonials;
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const requestSequenceRef = useRef(0);
  const [story, setStory] = useState(initialData);
  const [loading, setLoading] = useState(!initialData.full_story);
  const [error, setError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const trapFocus = useTestimonialDialog({
    captureEscape: true,
    dialogRef: modalRef,
    initialFocusRef: closeButtonRef,
    onEscape: onClose,
    returnFocusRef,
  });

  useEffect(() => {
    const sequence = ++requestSequenceRef.current;
    const controller = new AbortController();
    setStory(initialData);
    setError(false);
    if (initialData.full_story) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    void fetch(
      `/api/testimonials/${encodeURIComponent(uuid)}?locale=${locale}`,
      {
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("detail_request_failed");
        return (await response.json()) as { data: PublicTestimonial };
      })
      .then((payload) => {
        if (
          !controller.signal.aborted &&
          sequence === requestSequenceRef.current
        ) {
          setStory(payload.data);
        }
      })
      .catch(() => {
        if (
          !controller.signal.aborted &&
          sequence === requestSequenceRef.current
        ) {
          setError(true);
        }
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          sequence === requestSequenceRef.current
        ) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [initialData, locale, retryAttempt, uuid]);

  return (
    <div className="testimonials-detail-layer">
      <div
        aria-hidden="true"
        className="testimonials-detail-backdrop"
        data-testid="testimonials-detail-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      />
      <article
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="testimonials-detail"
        onKeyDown={trapFocus}
        ref={modalRef}
        role="dialog"
        tabIndex={-1}
      >
        <div aria-hidden="true" className="testimonials-sheet-handle" />
        <button
          aria-label={copy.closeDetail}
          className="testimonials-icon-button testimonials-detail-close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <CloseIcon />
        </button>
        <h2 className="sr-only" id={titleId}>
          {copy.detailTitle.replace("{name}", story.display_name)}
        </h2>
        <p className="sr-only" id={descriptionId}>
          {copy.detailDescription}
        </p>

        <div className="testimonials-detail-media">
          <TestimonialImage
            alt={copy.imageAlt.replace("{name}", story.display_name)}
            sizes="(min-width: 768px) 310px, calc(100vw - 32px)"
            story={story}
          />
        </div>

        <div className="testimonials-detail-content">
          <TestimonialTag
            customerLabel={copy.tagCustomer}
            farmerLabel={copy.tagFarmer}
            type={story.type}
          />
          <q className="testimonials-detail-quote">{story.quote}</q>
          <span aria-hidden="true" className="testimonials-detail-rule" />

          <div className="testimonials-full-story">
            {loading ? (
              <div aria-live="polite" role="status">
                <span
                  className="testimonials-detail-skeleton"
                  aria-hidden="true"
                />
                <span className="sr-only">{copy.detailLoading}</span>
              </div>
            ) : error ? (
              <div className="testimonials-detail-error">
                <p role="alert">{copy.detailError}</p>
                <button
                  onClick={() => setRetryAttempt((value) => value + 1)}
                  type="button"
                >
                  {copy.retry}
                </button>
              </div>
            ) : (
              <p>{story.full_story}</p>
            )}
          </div>

          <footer className="testimonials-person-row testimonials-detail-person">
            <span className="testimonials-person-icon" aria-hidden="true">
              <UserIcon />
            </span>
            <span>
              <strong>{story.display_name}</strong>
              <small>
                {story.role}
                {story.location ? ` · ${story.location}` : ""}
              </small>
            </span>
          </footer>
        </div>
      </article>
    </div>
  );
}
