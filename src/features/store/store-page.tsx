"use client";

import { useState } from "react";
import Link from "next/link";
import type { SiteContent } from "@/content/site-content";
import type { Locale } from "@/lib/i18n";
import {
  BasketIcon,
  BagIcon,
  SproutIcon,
  MessageCircleIcon,
  ChevronDownIcon,
  Arrow,
} from "@/components/icons";

type Copy = SiteContent["storeGuide"];

function AccordionItem({
  index,
  item,
  isOpen,
  onClick,
}: {
  index: number;
  item: { question: string; answer: string };
  isOpen: boolean;
  onClick: () => void;
}) {
  const triggerId = `store-faq-trigger-${index}`;
  const panelId = `store-faq-panel-${index}`;

  return (
    <div className="store-faq-item">
      <button
        id={triggerId}
        type="button"
        className="store-faq-trigger"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="store-faq-question">{item.question}</span>
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
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export function StorePage({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="store-page csa-page">
      <div className="csa-page-background" aria-hidden="true">
        <span className="csa-background-grain" />
        <span className="csa-background-moss" />
        <span className="csa-background-straw" />
      </div>
      <div className="store-page-main">
        <div className="shell store-page-shell">
          <header className="store-header">
            <h1>{copy.title}</h1>
            <p className="store-intro">{copy.intro}</p>
          </header>

          <section
            className="store-section"
            aria-labelledby="shop-choices-title"
          >
            <h2 id="shop-choices-title" className="store-section-title">
              {copy.howToShopTitle}
            </h2>

            <div className="store-cards">
              <div className="store-card">
                <div className="store-card-icon-wrapper">
                  <BasketIcon className="store-icon-large" />
                </div>
                <h3>{copy.csaCard.title}</h3>
                <p>
                  {copy.csaCard.body.split("|C").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <strong className="store-highlight">|C</strong>
                      )}
                    </span>
                  ))}
                </p>
                <a
                  href={copy.csaCard.url}
                  className="store-btn store-btn-primary"
                >
                  {copy.csaCard.cta}
                  <Arrow />
                </a>
              </div>

              <div className="store-card">
                <div className="store-card-icon-wrapper bag-rotate">
                  <BagIcon className="store-icon-large" />
                </div>
                <h3>{copy.individualCard.title}</h3>
                <p>{copy.individualCard.body}</p>
                <a
                  href={copy.individualCard.url}
                  className="store-btn store-btn-secondary"
                >
                  {copy.individualCard.cta}
                  <Arrow />
                </a>
              </div>

              <div className="store-card">
                <div className="store-card-icon-wrapper sprout-rotate">
                  <SproutIcon className="store-icon-large" />
                </div>
                <h3>{copy.livePlantsCard.title}</h3>
                <p>{copy.livePlantsCard.body}</p>
                <a
                  href={copy.livePlantsCard.url}
                  className="store-btn store-btn-secondary"
                >
                  {copy.livePlantsCard.cta}
                  <Arrow />
                </a>
              </div>
            </div>

            <div className="store-csa-promo">
              <span>{copy.csaPromo}</span>
              <Link href={`/${locale}/csa`} className="store-csa-promo-link">
                {copy.csaPromoLink} <Arrow />
              </Link>
            </div>
          </section>

          <section
            className="store-section"
            aria-labelledby="ordering-faq-title"
          >
            <h2 id="ordering-faq-title" className="store-section-title">
              {copy.faqTitle}
            </h2>
            <div className="store-faq">
              {copy.faqItems.map((faq, index) => (
                <AccordionItem
                  key={index}
                  index={index}
                  item={faq}
                  isOpen={openFaqIndex === index}
                  onClick={() => toggleFaq(index)}
                />
              ))}
            </div>
          </section>

          <section className="store-help">
            <div className="store-help-content">
              <h2>{copy.zaloTitle}</h2>
              <p>{copy.zaloBody}</p>
            </div>
            <a href={copy.zaloUrl} className="store-help-btn">
              <MessageCircleIcon className="store-icon" />
              {copy.zaloCta}
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
