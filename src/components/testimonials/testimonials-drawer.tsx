"use client";

import Link from "next/link";
import { type RefObject, useEffect, useId, useRef, useState } from "react";

import {
  ArrowRightIcon,
  CloseIcon,
  QuoteIcon,
  UserIcon,
} from "@/components/icons";
import { TestimonialDetailModal } from "@/components/testimonials/testimonial-detail-modal";
import {
  TestimonialImage,
  TestimonialTag,
} from "@/components/testimonials/testimonial-presentation";
import { useTestimonialDialog } from "@/components/testimonials/use-testimonial-dialog";
import { getSiteContent } from "@/content/site-content";
import type { PublicTestimonial } from "@/lib/content-api";
import { localizedPath, type Locale } from "@/lib/i18n";

export function TestimonialsDrawer({
  locale,
  onClose,
  open,
  returnFocusRef,
}: {
  locale: Locale;
  onClose: () => void;
  open: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const copy = getSiteContent(locale).testimonials;
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const storyButtonRef = useRef<HTMLButtonElement | null>(null);
  const [stories, setStories] = useState<PublicTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [selectedStory, setSelectedStory] = useState<PublicTestimonial | null>(
    null,
  );

  const trapFocus = useTestimonialDialog({
    dialogRef: panelRef,
    initialFocusRef: closeButtonRef,
    onEscape: () => {
      if (open) onClose();
    },
    returnFocusRef,
  });

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    void fetch(`/api/testimonials/featured?locale=${locale}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("featured_request_failed");
        return (await response.json()) as { data: PublicTestimonial[] };
      })
      .then((payload) => {
        if (!controller.signal.aborted) setStories(payload.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [locale, open, retryAttempt]);

  function openStory(story: PublicTestimonial, button: HTMLButtonElement) {
    storyButtonRef.current = button;
    setSelectedStory(story);
  }

  const featuredStory = stories[0];
  const previewStories = stories.slice(1, 3);

  return (
    <>
      <div
        className="testimonials-drawer-layer"
        data-open={open}
        data-testid="testimonials-drawer-layer"
      >
        <div
          aria-hidden="true"
          className="testimonials-drawer-backdrop"
          data-testid="testimonials-drawer-backdrop"
          onMouseDown={(event) => {
            if (open && event.target === event.currentTarget) onClose();
          }}
        />
        <section
          aria-describedby={descriptionId}
          aria-labelledby={titleId}
          aria-modal="true"
          className="testimonials-drawer"
          onKeyDown={trapFocus}
          ref={panelRef}
          role="dialog"
          tabIndex={-1}
        >
          <div aria-hidden="true" className="testimonials-sheet-handle" />
          <header className="testimonials-drawer-header">
            <div>
              <p className="testimonials-eyebrow">{copy.drawerEyebrow}</p>
              <h2 id={titleId}>{copy.drawerTitle}</h2>
              <p className="sr-only" id={descriptionId}>
                {copy.drawerDescription}
              </p>
            </div>
            <button
              aria-label={copy.closeDrawer}
              className="testimonials-icon-button"
              onClick={onClose}
              ref={closeButtonRef}
              type="button"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="testimonials-drawer-content">
            {loading ? (
              <div
                aria-live="polite"
                className="testimonials-drawer-state"
                role="status"
              >
                <span
                  className="testimonials-loading-lines"
                  aria-hidden="true"
                />
                <span>{copy.loading}</span>
              </div>
            ) : error ? (
              <div className="testimonials-drawer-state">
                <p role="alert">{copy.error}</p>
                <button
                  onClick={() => setRetryAttempt((value) => value + 1)}
                  type="button"
                >
                  {copy.retry}
                </button>
              </div>
            ) : stories.length === 0 ? (
              <div className="testimonials-drawer-state">
                <p>{copy.emptyTitle}</p>
                <span>{copy.emptyBody}</span>
              </div>
            ) : (
              <>
                {featuredStory ? (
                  <button
                    aria-label={copy.openStory.replace(
                      "{name}",
                      featuredStory.display_name,
                    )}
                    className="testimonials-featured-card"
                    onClick={(event) =>
                      openStory(featuredStory, event.currentTarget)
                    }
                    type="button"
                  >
                    <span className="testimonials-featured-media">
                      <TestimonialImage
                        alt={copy.imageAlt.replace(
                          "{name}",
                          featuredStory.display_name,
                        )}
                        sizes="(min-width: 768px) 372px, calc(100vw - 48px)"
                        story={featuredStory}
                      />
                      <TestimonialTag
                        customerLabel={copy.tagCustomer}
                        farmerLabel={copy.tagFarmer}
                        type={featuredStory.type}
                      />
                    </span>
                    <QuoteIcon className="testimonials-quote-icon" />
                    <q>{featuredStory.quote}</q>
                    <span className="testimonials-person-row">
                      <span
                        className="testimonials-person-icon"
                        aria-hidden="true"
                      >
                        <UserIcon />
                      </span>
                      <span>
                        <strong>{featuredStory.display_name}</strong>
                        <small>
                          {featuredStory.role}
                          {featuredStory.location
                            ? ` · ${featuredStory.location}`
                            : ""}
                        </small>
                      </span>
                    </span>
                  </button>
                ) : null}

                {previewStories.length ? (
                  <hr className="testimonials-divider" />
                ) : null}
                <div className="testimonials-preview-list">
                  {previewStories.map((story) => (
                    <button
                      aria-label={copy.openStory.replace(
                        "{name}",
                        story.display_name,
                      )}
                      className="testimonials-preview-card"
                      key={story.id}
                      onClick={(event) => openStory(story, event.currentTarget)}
                      type="button"
                    >
                      <span className="testimonials-preview-media">
                        <TestimonialImage
                          alt={copy.imageAlt.replace(
                            "{name}",
                            story.display_name,
                          )}
                          sizes="84px"
                          story={story}
                        />
                      </span>
                      <span>
                        <q>{story.quote}</q>
                        <strong>{story.display_name}</strong>
                        <small>{story.role}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <footer className="testimonials-drawer-footer">
            <Link
              href={localizedPath(locale, "/testimonials")}
              onClick={onClose}
            >
              {copy.viewAll}
              <ArrowRightIcon />
            </Link>
          </footer>
        </section>
      </div>

      {selectedStory ? (
        <TestimonialDetailModal
          initialData={selectedStory}
          locale={locale}
          onClose={() => setSelectedStory(null)}
          returnFocusRef={storyButtonRef}
          uuid={selectedStory.id}
        />
      ) : null}
    </>
  );
}
