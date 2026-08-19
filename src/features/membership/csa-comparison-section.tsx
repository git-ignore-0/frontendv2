"use client";

import { useRef, useState, type KeyboardEvent } from "react";

export type ComparisonSectionCopy = {
  id: string;
  eyebrow: string;
  versusLabel: string;
  title: string;
  intro: string;
  left: {
    label: string;
    items: readonly string[];
  };
  right: {
    label: string;
    items: readonly string[];
  };
  pullQuote?: {
    lead: string;
    accent: string;
    accentTerm: string;
    mark: string;
  };
  conclusion?: {
    lead: string;
    accent: string;
  };
};

type ComparisonTab = "left" | "right";

const comparisonTabs: ComparisonTab[] = ["left", "right"];
const activeTabClassName = "is-active";

function PullQuote({
  copy,
}: {
  copy: NonNullable<ComparisonSectionCopy["pullQuote"]>;
}) {
  const accentTermIndex = copy.accent.indexOf(copy.accentTerm);
  const canEmphasizeTerm = accentTermIndex >= 0;
  const accentBefore = copy.accent.slice(0, accentTermIndex);
  const accentAfter = copy.accent.slice(
    accentTermIndex + copy.accentTerm.length,
  );

  return (
    <blockquote className="csa-comparison-quote">
      <span aria-hidden="true" className="csa-comparison-quote-mark">
        {copy.mark}
      </span>
      {copy.lead ? <p>{copy.lead}</p> : null}
      <p className="csa-comparison-quote-accent">
        {canEmphasizeTerm ? (
          <>
            {accentBefore}
            <span className="csa-comparison-quote-term">{copy.accentTerm}</span>
            {accentAfter}
          </>
        ) : (
          copy.accent
        )}
      </p>
    </blockquote>
  );
}

function Conclusion({
  copy,
}: {
  copy: NonNullable<ComparisonSectionCopy["conclusion"]>;
}) {
  return (
    <div className="csa-comparison-conclusion">
      <p className="csa-comparison-conclusion-lead">{copy.lead}</p>
      <p className="csa-comparison-conclusion-accent">{copy.accent}</p>
    </div>
  );
}

function ComparisonColumn({
  active,
  column,
  labelledBy,
  panelId,
  variant,
}: {
  active: boolean;
  column: ComparisonSectionCopy["left"];
  labelledBy: string;
  panelId: string;
  variant: "left" | "right";
}) {
  const isPositive = variant === "right";

  return (
    <div
      aria-labelledby={labelledBy}
      className={`csa-comparison-column is-${variant}`}
      id={panelId}
      role="tabpanel"
      tabIndex={active ? 0 : -1}
    >
      <h3>{column.label}</h3>
      <ul>
        {column.items.map((item) => (
          <li key={item}>
            <span aria-hidden="true" className="csa-comparison-icon">
              {isPositive ? "✓" : "×"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CsaComparisonSection({
  copy,
}: {
  copy: ComparisonSectionCopy;
}) {
  const [activeTab, setActiveTab] = useState<ComparisonTab>("left");
  const tabRefs = useRef<Record<ComparisonTab, HTMLButtonElement | null>>({
    left: null,
    right: null,
  });
  const sectionId = `csa-comparison-${copy.id}`;
  const tabId = (tab: ComparisonTab) => `${sectionId}-tab-${tab}`;
  const panelId = (tab: ComparisonTab) => `${sectionId}-panel-${tab}`;

  function activateTab(tab: ComparisonTab, shouldFocus = false) {
    setActiveTab(tab);
    if (shouldFocus) tabRefs.current[tab]?.focus();
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tab: ComparisonTab,
  ) {
    const currentIndex = comparisonTabs.indexOf(tab);
    const nextTab =
      event.key === "ArrowRight"
        ? comparisonTabs[(currentIndex + 1) % comparisonTabs.length]
        : event.key === "ArrowLeft"
          ? comparisonTabs[
              (currentIndex - 1 + comparisonTabs.length) % comparisonTabs.length
            ]
          : event.key === "Home"
            ? comparisonTabs[0]
            : event.key === "End"
              ? comparisonTabs[comparisonTabs.length - 1]
              : null;

    if (!nextTab) return;
    event.preventDefault();
    activateTab(nextTab, true);
  }

  return (
    <section className="csa-comparison" aria-labelledby={sectionId}>
      <header className="csa-section-heading">
        <p className="csa-section-kicker">{copy.eyebrow}</p>
        <h2 className="store-section-title" id={sectionId}>
          {copy.title}
        </h2>
        <p className="csa-section-intro">{copy.intro}</p>
      </header>
      <div
        aria-label={copy.title}
        className="csa-comparison-tabs"
        role="tablist"
      >
        {comparisonTabs.map((tab) => {
          const active = activeTab === tab;
          const column = copy[tab];

          return (
            <button
              key={tab}
              aria-controls={panelId(tab)}
              aria-selected={active}
              className={`csa-comparison-tab ${active ? activeTabClassName : ""}`}
              id={tabId(tab)}
              onClick={() => activateTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              ref={(node) => {
                tabRefs.current[tab] = node;
              }}
              role="tab"
              tabIndex={active ? 0 : -1}
              type="button"
            >
              {column.label}
            </button>
          );
        })}
      </div>

      <div className={`csa-comparison-grid active-tab-${activeTab}`}>
        <ComparisonColumn
          active={activeTab === "left"}
          column={copy.left}
          labelledBy={tabId("left")}
          panelId={panelId("left")}
          variant="left"
        />
        <div aria-hidden="true" className="csa-comparison-divider">
          <span>{copy.versusLabel}</span>
        </div>
        <ComparisonColumn
          active={activeTab === "right"}
          column={copy.right}
          labelledBy={tabId("right")}
          panelId={panelId("right")}
          variant="right"
        />
      </div>
      {copy.conclusion ? <Conclusion copy={copy.conclusion} /> : null}
      {copy.pullQuote ? <PullQuote copy={copy.pullQuote} /> : null}
    </section>
  );
}
