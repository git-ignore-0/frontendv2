"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MessageCircleIcon,
  QuoteIcon,
} from "@/components/icons";
import { TestimonialDetailModal } from "@/components/testimonials/testimonial-detail-modal";
import {
  TestimonialImage,
  TestimonialTag,
} from "@/components/testimonials/testimonial-presentation";
import { getSiteContent } from "@/content/site-content";
import type { PublicTestimonial } from "@/lib/content-api";
import { localizedPath, type Locale } from "@/lib/i18n";

type FilterType = "all" | "customer" | "farmer";
type TestimonialMeta = { page: number; page_size: number; total: number };

export function TestimonialsPage({ locale }: { locale: Locale }) {
  const copy = getSiteContent(locale).testimonials;
  const requestSequenceRef = useRef(0);
  const hasLoadedSuccessfullyRef = useRef(false);
  const hasSettledInitialRequestRef = useRef(false);
  const storyButtonRef = useRef<HTMLButtonElement | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [stories, setStories] = useState<PublicTestimonial[]>([]);
  const [meta, setMeta] = useState<TestimonialMeta>({
    page: 1,
    page_size: 12,
    total: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedSuccessfully, setHasLoadedSuccessfully] = useState(false);
  const [error, setError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [selectedStory, setSelectedStory] = useState<PublicTestimonial | null>(
    null,
  );

  useEffect(() => {
    const sequence = ++requestSequenceRef.current;
    const controller = new AbortController();
    if (hasSettledInitialRequestRef.current) {
      setRefreshing(true);
      if (hasLoadedSuccessfullyRef.current) setError(false);
    } else {
      setInitialLoading(true);
      setError(false);
    }
    void fetch(
      `/api/testimonials?locale=${locale}&type=${filter}&page=${page}&page_size=12`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("list_request_failed");
        return (await response.json()) as {
          data: PublicTestimonial[];
          meta: TestimonialMeta;
        };
      })
      .then((payload) => {
        if (
          !controller.signal.aborted &&
          sequence === requestSequenceRef.current
        ) {
          setStories(payload.data);
          setMeta(payload.meta);
          hasLoadedSuccessfullyRef.current = true;
          setHasLoadedSuccessfully(true);
          setError(false);
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
          hasSettledInitialRequestRef.current = true;
          setInitialLoading(false);
          setRefreshing(false);
        }
      });
    return () => controller.abort();
  }, [filter, locale, page, retryAttempt]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.page_size));
  const controlsDisabled = initialLoading || refreshing;
  const filters: Array<{ id: FilterType; label: string }> = [
    { id: "all", label: copy.filterAll },
    { id: "customer", label: copy.filterCustomer },
    { id: "farmer", label: copy.filterFarmer },
  ];

  return (
    <div className="testimonials-page">
      <div className="shell testimonials-page-shell">
        <Link className="testimonials-back-link" href={localizedPath(locale)}>
          <span aria-hidden="true">
            <ArrowLeftIcon />
          </span>
          {copy.back}
        </Link>

        <header className="testimonials-page-intro">
          <p className="testimonials-eyebrow">{copy.pageEyebrow}</p>
          <h1>{copy.pageTitle}</h1>
          <p>{copy.pageIntro}</p>
        </header>

        <div
          aria-label={copy.filtersLabel}
          aria-busy={controlsDisabled}
          className="testimonials-filters"
          role="group"
        >
          {filters.map((option) => (
            <button
              aria-pressed={filter === option.id}
              disabled={controlsDisabled}
              key={option.id}
              onClick={() => {
                if (option.id === filter && page === 1) return;
                setRefreshing(true);
                setFilter(option.id);
                setPage(1);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="testimonials-refresh-feedback">
          {!initialLoading && refreshing ? (
            <span
              aria-label={copy.updating}
              className="testimonials-refresh-indicator"
              role="status"
            >
              <span aria-hidden="true" />
              {copy.updating}
            </span>
          ) : !initialLoading && error && hasLoadedSuccessfully ? (
            <span className="testimonials-refresh-error">
              <span role="alert">{copy.error}</span>
              <button
                onClick={() => {
                  setRefreshing(true);
                  setRetryAttempt((value) => value + 1);
                }}
                type="button"
              >
                {copy.retry}
              </button>
            </span>
          ) : null}
        </div>

        {initialLoading ? (
          <div
            aria-label={copy.loading}
            className="testimonials-grid"
            data-state="loading"
            role="status"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <span
                aria-hidden="true"
                className="testimonials-card-skeleton"
                key={index}
              />
            ))}
          </div>
        ) : (
          <div
            aria-busy={refreshing}
            className="testimonials-results"
            data-refreshing={refreshing}
          >
            {error && !hasLoadedSuccessfully ? (
              <div className="testimonials-page-state">
                <p role="alert">{copy.error}</p>
                <button
                  disabled={refreshing}
                  onClick={() => {
                    setRefreshing(true);
                    setRetryAttempt((value) => value + 1);
                  }}
                  type="button"
                >
                  {copy.retry}
                </button>
              </div>
            ) : stories.length ? (
              <>
                <ul
                  aria-busy={refreshing}
                  aria-label={copy.listLabel}
                  className="testimonials-grid"
                >
                  {stories.map((story) => (
                    <li key={story.id}>
                      <button
                        aria-label={copy.openStory.replace(
                          "{name}",
                          story.display_name,
                        )}
                        className="testimonials-list-card"
                        onClick={(event) => {
                          storyButtonRef.current = event.currentTarget;
                          setSelectedStory(story);
                        }}
                        type="button"
                      >
                        <span className="testimonials-list-media">
                          <TestimonialImage
                            alt={copy.imageAlt.replace(
                              "{name}",
                              story.display_name,
                            )}
                            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, calc(100vw - 32px)"
                            story={story}
                          />
                          <TestimonialTag
                            customerLabel={copy.tagCustomer}
                            farmerLabel={copy.tagFarmer}
                            type={story.type}
                          />
                        </span>
                        <span className="testimonials-list-card-content">
                          <QuoteIcon className="testimonials-quote-icon" />
                          <q>{story.quote}</q>
                          <span className="testimonials-list-person">
                            <span>
                              <strong>{story.display_name}</strong>
                              <small>{story.role}</small>
                            </span>
                            <span
                              aria-hidden="true"
                              className="testimonials-card-arrow"
                            >
                              <ArrowRightIcon />
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                {totalPages > 1 ? (
                  <nav
                    aria-label={copy.pageStatus}
                    className="testimonials-pagination"
                  >
                    <button
                      disabled={refreshing || meta.page <= 1}
                      onClick={() => {
                        setRefreshing(true);
                        setPage((value) => Math.max(1, value - 1));
                      }}
                      type="button"
                    >
                      {copy.previous}
                    </button>
                    <span>
                      {copy.pageStatus
                        .replace("{page}", String(meta.page))
                        .replace("{pages}", String(totalPages))}
                    </span>
                    <button
                      disabled={refreshing || meta.page >= totalPages}
                      onClick={() => {
                        setRefreshing(true);
                        setPage((value) => Math.min(totalPages, value + 1));
                      }}
                      type="button"
                    >
                      {copy.next}
                    </button>
                  </nav>
                ) : null}
              </>
            ) : (
              <div className="testimonials-page-state is-empty">
                <span aria-hidden="true" className="testimonials-empty-icon">
                  <MessageCircleIcon />
                </span>
                <strong>{copy.emptyTitle}</strong>
                <p>{copy.emptyBody}</p>
              </div>
            )}
          </div>
        )}
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
    </div>
  );
}
