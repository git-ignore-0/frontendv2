"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/icons";
import type { SiteContent } from "@/content/site-content";
import { accountApi } from "@/features/account/api";
import { CsaComparisonSection } from "@/features/membership/csa-comparison-section";
import type {
  MembershipPackage,
  MembershipPackagePriceOption,
  PaginationMeta,
} from "@/features/account/types";
import {
  formatMembershipMoney,
  formatMembershipUnits,
  membershipUnitLabel,
} from "@/features/membership/format";
import type { Locale } from "@/lib/i18n";

const FARM_BRITE_MEMBERSHIPS_URL =
  "https://store.farmbrite.com/store/nntn/products?category=Memberships";
const timelineScrollBehavior = {
  reduced: "auto",
  standard: "smooth",
} as const;

type Copy = SiteContent["csa"];

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function orderedPriceOptions(priceOptions: MembershipPackagePriceOption[]) {
  return priceOptions
    .map((option, index) => ({ option, index }))
    .sort(
      (left, right) =>
        (left.option.sort_order ?? left.index) -
          (right.option.sort_order ?? right.index) ||
        left.option.duration_months - right.option.duration_months,
    )
    .map(({ option }) => option);
}

export function membershipOptionSavings(
  option: MembershipPackagePriceOption,
  oneMonthOption?: MembershipPackagePriceOption,
) {
  if (!oneMonthOption || option.duration_months <= 1) return BigInt(0);
  try {
    const baseline =
      BigInt(oneMonthOption.monthly_price_vnd) * BigInt(option.duration_months);
    const saving = baseline - BigInt(option.total_price_vnd);
    return saving > BigInt(0) ? saving : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

function BenefitIcon({ type }: { type: string }) {
  switch (type) {
    case "calendar":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "truck":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M1 3h15v13H1zM16 8h4l3 4v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "refresh":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      );
    case "clock":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    default:
      return null;
  }
}

export function CsaPage({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [packagesMeta, setPackagesMeta] = useState<PaginationMeta | null>(null);
  const [packagesPage, setPackagesPage] = useState(1);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState("");
  const packagesRequestSequence = useRef(0);
  const activePackagesRequest = useRef<{
    controller: AbortController;
    sequence: number;
  } | null>(null);
  const timelineCarousel = useRef<HTMLOListElement>(null);

  const updateActiveTimelineIndex = () => {
    const carousel = timelineCarousel.current;
    if (!carousel) return;

    const cards = Array.from(carousel.children);
    const closestCardIndex = cards.reduce(
      (closestIndex, card, index) =>
        Math.abs((card as HTMLElement).offsetLeft - carousel.scrollLeft) <
        Math.abs(
          (cards[closestIndex] as HTMLElement).offsetLeft - carousel.scrollLeft,
        )
          ? index
          : closestIndex,
      0,
    );
    setActiveTimelineIndex(closestCardIndex);
  };

  const moveTimeline = (direction: -1 | 1) => {
    const nextIndex = Math.max(
      0,
      Math.min(copy.timeline.length - 1, activeTimelineIndex + direction),
    );
    const nextCard = timelineCarousel.current?.children.item(nextIndex);
    if (!(nextCard instanceof HTMLElement)) return;

    nextCard.scrollIntoView?.({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? timelineScrollBehavior.reduced
        : timelineScrollBehavior.standard,
      block: "nearest",
      inline: "start",
    });
    setActiveTimelineIndex(nextIndex);
  };

  const loadPackages = useCallback(async () => {
    activePackagesRequest.current?.controller.abort();
    const controller = new AbortController();
    const sequence = ++packagesRequestSequence.current;
    activePackagesRequest.current = { controller, sequence };
    const isCurrentRequest = () =>
      activePackagesRequest.current?.sequence === sequence &&
      !controller.signal.aborted;

    setPackagesLoading(true);
    setPackagesError("");
    try {
      const payload = await accountApi<MembershipPackage[], PaginationMeta>(
        `membership-packages?page=${packagesPage}&locale=${locale}`,
        { signal: controller.signal },
      );
      if (!isCurrentRequest()) return;
      setPackages(payload.data);
      setPackagesMeta(payload.meta ?? null);
    } catch (caught) {
      if (!isCurrentRequest() || isAbortError(caught)) return;
      setPackagesError(copy.packagesError);
    } finally {
      if (!isCurrentRequest()) return;
      activePackagesRequest.current = null;
      setPackagesLoading(false);
    }
  }, [copy.packagesError, locale, packagesPage]);

  useEffect(() => {
    void loadPackages();
    return () => {
      packagesRequestSequence.current += 1;
      activePackagesRequest.current?.controller.abort();
      activePackagesRequest.current = null;
    };
  }, [loadPackages]);

  return (
    <div className="csa-page csa-membership-page">
      <div className="shell csa-page-shell">
        <header className="csa-hero">
          <div className="csa-hero-copy">
            <p className="csa-hero-kicker">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="csa-hero-lead">{copy.intro}</p>
            <ul className="csa-hero-benefits">
              {copy.benefits.map((benefit) => (
                <li key={benefit.label}>
                  <BenefitIcon type={benefit.icon} />
                  <span>{benefit.label}</span>
                </li>
              ))}
            </ul>
            <div className="csa-hero-actions">
              <a
                className="csa-package-action csa-hero-action"
                href={FARM_BRITE_MEMBERSHIPS_URL}
              >
                {copy.buyOnFarmbrite}
              </a>
            </div>
          </div>
          <div className="csa-hero-media">
            <Image
              src="/images/csa-seedlings.webp"
              alt={copy.heroAlt}
              fill
              priority
              sizes="(min-width: 768px) 44vw, calc(100vw - 2rem)"
              style={{ objectPosition: "center" }}
            />
          </div>
        </header>

        <main>
          <section
            className="csa-packages"
            aria-labelledby="csa-packages-title"
          >
            <header className="csa-section-heading">
              <h2 className="csa-section-title" id="csa-packages-title">
                {copy.packagesTitle}
              </h2>
              <p className="csa-section-intro">{copy.packagesSubtitle}</p>
            </header>
            {packagesError ? (
              <div className="csa-inline-state" role="alert">
                <p>{packagesError}</p>
                <button onClick={() => void loadPackages()}>
                  {copy.retry}
                </button>
              </div>
            ) : packagesLoading ? (
              <p className="csa-inline-state" aria-live="polite">
                {copy.packagesLoading}
              </p>
            ) : packages.length === 0 ? (
              <p className="csa-inline-state">{copy.packagesEmpty}</p>
            ) : (
              <>
                <div
                  className={[
                    "csa-package-list",
                    packages.length === 1 && "is-single",
                    packages.length === 2 && "is-pair",
                    packages.length > 3 && "is-scrollable",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {packages.map((item) => {
                    const priceOptions = orderedPriceOptions(
                      item.price_options,
                    );
                    const oneMonthOption = priceOptions.find(
                      (option) => option.duration_months === 1,
                    );
                    const savings = priceOptions.map((option) =>
                      membershipOptionSavings(option, oneMonthOption),
                    );
                    const greatestSaving = savings.reduce(
                      (greatest, saving) =>
                        saving > greatest ? saving : greatest,
                      BigInt(0),
                    );
                    const bestSavingIndex = savings.findIndex(
                      (saving) =>
                        saving > BigInt(0) && saving === greatestSaving,
                    );
                    return (
                      <article className="csa-package-card" key={item.id}>
                        <div className="csa-package-summary">
                          <div>
                            <h3>{item.name}</h3>
                            {item.description ? (
                              <p>{item.description}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="csa-package-allocation">
                          <h4>{copy.includedProducts}</h4>
                          <ul>
                            {item.items.map((product) => (
                              <li key={product.product_id}>
                                <span>{product.product_name}</span>
                                <b>
                                  {formatMembershipUnits(
                                    product.unit_size,
                                    product.quota_units,
                                    locale,
                                  )}{" "}
                                  {membershipUnitLabel(locale, product)} /{" "}
                                  {copy.cycle}
                                </b>
                              </li>
                            ))}
                          </ul>
                          <div className="csa-package-policy">
                            <svg aria-hidden="true" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 11v5M12 8h.01" />
                            </svg>
                            <p>
                              {item.quota_policy === "expire"
                                ? copy.expire
                                : copy.rollover}
                            </p>
                          </div>
                        </div>
                        <div className="csa-package-price-options">
                          <h4>{copy.priceOptions}</h4>
                          <ul>
                            {priceOptions.map((option, index) => (
                              <li key={option.id}>
                                <div className="csa-price-option-heading">
                                  <strong>
                                    {(option.duration_months === 1
                                      ? copy.month
                                      : copy.months
                                    ).replace(
                                      "{count}",
                                      String(option.duration_months),
                                    )}
                                  </strong>
                                  {index === bestSavingIndex ? (
                                    <span className="csa-best-saving">
                                      {copy.bestSavings}
                                    </span>
                                  ) : null}
                                </div>
                                <dl>
                                  <div>
                                    <dt>{copy.monthlyPrice}</dt>
                                    <dd>
                                      {formatMembershipMoney(
                                        option.monthly_price_vnd,
                                        locale,
                                      )}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt>{copy.totalPrice}</dt>
                                    <dd>
                                      {formatMembershipMoney(
                                        option.total_price_vnd,
                                        locale,
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                                {savings[index] > BigInt(0) ? (
                                  <p className="csa-price-saving">
                                    {copy.saving.replace(
                                      "{amount}",
                                      formatMembershipMoney(
                                        savings[index].toString(),
                                        locale,
                                      ),
                                    )}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {packagesMeta && packagesMeta.total > packagesMeta.page_size ? (
                  <nav
                    className="csa-package-pagination"
                    aria-label={copy.paginationLabel}
                  >
                    <button
                      disabled={packagesLoading || packagesMeta.page <= 1}
                      onClick={() =>
                        setPackagesPage((page) => Math.max(1, page - 1))
                      }
                      type="button"
                    >
                      {copy.previousPage}
                    </button>
                    <span>
                      {copy.pageSummary
                        .replace("{page}", String(packagesMeta.page))
                        .replace(
                          "{pages}",
                          String(
                            Math.max(
                              1,
                              Math.ceil(
                                packagesMeta.total / packagesMeta.page_size,
                              ),
                            ),
                          ),
                        )}
                    </span>
                    <button
                      disabled={
                        packagesLoading ||
                        packagesMeta.page * packagesMeta.page_size >=
                          packagesMeta.total
                      }
                      onClick={() => setPackagesPage((page) => page + 1)}
                      type="button"
                    >
                      {copy.nextPage}
                    </button>
                  </nav>
                ) : null}
              </>
            )}
          </section>

          {copy.comparisons.map((comparison) => (
            <CsaComparisonSection key={comparison.eyebrow} copy={comparison} />
          ))}

          <section
            className="csa-timeline"
            aria-labelledby="csa-timeline-title"
          >
            <div className="csa-timeline-heading">
              <div className="csa-section-heading csa-timeline-heading-copy">
                <h2 className="csa-section-title" id="csa-timeline-title">
                  {copy.timelineTitle}
                </h2>
                <p className="csa-section-intro csa-timeline-supporting">
                  {copy.substitutionLine}
                </p>
              </div>
              <nav aria-label={copy.timelineLabel} className="csa-timeline-nav">
                <button
                  type="button"
                  onClick={() => moveTimeline(-1)}
                  disabled={activeTimelineIndex === 0}
                  aria-label={copy.timelinePrevious}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m14 6-6 6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveTimeline(1)}
                  disabled={activeTimelineIndex === copy.timeline.length - 1}
                  aria-label={copy.timelineNext}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m10 6 6 6-6 6" />
                  </svg>
                </button>
              </nav>
            </div>
            <div
              className="csa-timeline-carousel"
              aria-label={copy.timelineLabel}
            >
              <ol ref={timelineCarousel} onScroll={updateActiveTimelineIndex}>
                {copy.timeline.map((step) => (
                  <li key={step.day}>
                    <div className="csa-timeline-card-media">
                      <Image
                        src={step.image}
                        alt={step.alt}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 36vw, 64vw"
                      />
                    </div>
                    <div className="csa-timeline-card-content">
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="csa-faq" aria-labelledby="csa-faq-title">
            <header className="csa-section-heading">
              <h2 className="csa-section-title" id="csa-faq-title">
                {copy.faqTitle}
              </h2>
            </header>
            <div className="store-faq">
              {copy.faqItems.map((faq, index) => {
                const triggerId = `csa-faq-trigger-${index}`;
                const panelId = `csa-faq-panel-${index}`;
                const isOpen = openFaqIndex === index;

                return (
                  <div className="store-faq-item" key={faq.question}>
                    <button
                      id={triggerId}
                      type="button"
                      className="store-faq-trigger"
                      onClick={() =>
                        setOpenFaqIndex((currentIndex) =>
                          currentIndex === index ? null : index,
                        )
                      }
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span className="store-faq-question">{faq.question}</span>
                      <span className="store-faq-icon">
                        <ChevronDownIcon className="store-icon" />
                      </span>
                    </button>
                    <div
                      id={panelId}
                      className="store-faq-content"
                      aria-labelledby={triggerId}
                      hidden={!isOpen}
                    >
                      <div className="store-faq-content-inner">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
