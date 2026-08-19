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
      <p>{copy.lead}</p>
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
  column,
  variant,
}: {
  column: ComparisonSectionCopy["left"];
  variant: "left" | "right";
}) {
  const isPositive = variant === "right";

  return (
    <div className={`csa-comparison-column is-${variant}`}>
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
  const sectionId = `csa-comparison-${copy.id}`;

  return (
    <section className="csa-comparison" aria-labelledby={sectionId}>
      <header className="csa-section-heading">
        <p className="csa-section-kicker">{copy.eyebrow}</p>
        <h2 className="store-section-title" id={sectionId}>
          {copy.title}
        </h2>
        <p className="csa-section-intro">{copy.intro}</p>
      </header>
      <div className="csa-comparison-grid">
        <ComparisonColumn column={copy.left} variant="left" />
        <div aria-hidden="true" className="csa-comparison-divider">
          <span>{copy.versusLabel}</span>
        </div>
        <ComparisonColumn column={copy.right} variant="right" />
      </div>
      {copy.pullQuote ? <PullQuote copy={copy.pullQuote} /> : null}
      {copy.conclusion ? <Conclusion copy={copy.conclusion} /> : null}
    </section>
  );
}
