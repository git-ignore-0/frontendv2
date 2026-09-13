import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/app/globals.css"), "utf8");
const csaCss = css.slice(css.indexOf(".csa-ui {"));

function declarationBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return csaCss.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];
}

describe("CSA demo style contract", () => {
  it("ports the demo typography, palette, shell and panel geometry", () => {
    const root = declarationBlock(".csa-ui");
    expect(root).toContain(
      'font-family: "Be Vietnam Pro", system-ui, sans-serif',
    );
    expect(root).toContain("font-size: 15px");
    expect(root).toContain("--cream: #f3eee3");
    expect(root).toContain("--paper: #fbf8f0");
    expect(root).toContain("--forest: #173f34");
    expect(root).toContain("--shadow: 0 24px 70px rgba(40, 35, 24, 0.12)");
    expect(declarationBlock(".csa-ui .shell")).toContain(
      "width: min(1180px, calc(100% - 32px))",
    );
    const purchaseShell = declarationBlock(".csa-purchase-ui .shell");
    expect(purchaseShell).toContain("width: min(64rem, calc(100% - 2.5rem))");
    expect(purchaseShell).toContain("max-width: 64rem");
    expect(purchaseShell).toContain("margin-inline: auto");
    expect(purchaseShell).toContain("margin-block: 0");
    expect(purchaseShell).not.toContain("1180px");
    expect(purchaseShell).not.toContain("margin-top:");
    expect(purchaseShell).not.toContain("margin-bottom:");
    const purchaseAppCard = declarationBlock(".csa-purchase-ui .app-card");
    expect(purchaseAppCard).toContain("width: 100%");
    expect(purchaseAppCard).not.toContain("max-width:");
    expect(csaCss.lastIndexOf(".csa-purchase-ui .shell")).toBeGreaterThan(
      csaCss.lastIndexOf(".csa-ui .shell"),
    );
    const trackerShell = declarationBlock(".csa-tracker-ui .shell");
    expect(trackerShell).toContain("width: min(64rem, calc(100% - 2.5rem))");
    expect(trackerShell).toContain("max-width: 64rem");
    expect(trackerShell).toContain("margin-inline: auto");
    expect(trackerShell).toContain("margin-block: 0");
    expect(trackerShell).not.toContain("1180px");
    expect(csaCss.lastIndexOf(".csa-tracker-ui .shell")).toBeGreaterThan(
      csaCss.lastIndexOf(".csa-ui .shell"),
    );
    const trackerAppCard = declarationBlock(".csa-tracker-ui .app-card");
    expect(trackerAppCard).toContain("width: 100%");
    expect(trackerAppCard).not.toContain("max-width:");
    expect(csaCss).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.csa-ui \.shell\s*\{[^}]*margin: 10px auto 30px/,
    );
    expect(csaCss).toMatch(
      /@media \(max-width: 480px\)[\s\S]*?\.csa-ui \.shell\s*\{[^}]*margin: 6px auto 24px/,
    );
    expect(declarationBlock(".csa-ui .content")).toContain("padding: 16px");
    expect(declarationBlock(".csa-ui .content")).not.toContain("margin:");
    expect(declarationBlock(".csa-ui .main-panel")).toContain("padding: 16px");
    expect(declarationBlock(".csa-purchase-ui .progress")).toContain(
      "scroll-margin-top: 88px",
    );
    expect(declarationBlock(".csa-purchase-ui .progress")).not.toContain(
      "scroll-margin-top: 0",
    );
    expect(declarationBlock(".csa-purchase-ui .step-heading")).toContain(
      "outline: none",
    );
    expect(declarationBlock(".csa-purchase-ui .step")).toContain(
      "animation: csa-step-enter 180ms ease-out both",
    );
    expect(csaCss).not.toMatch(
      /\.csa-purchase-ui \.main-panel\s*\{[^}]*animation:/,
    );
    expect(csaCss).toMatch(
      /@keyframes csa-step-enter\s*\{[\s\S]*?opacity: 0;[\s\S]*?transform: translateY\(6px\);[\s\S]*?opacity: 1;[\s\S]*?transform: translateY\(0\);[\s\S]*?\}/,
    );
    expect(
      declarationBlock(".csa-purchase-ui .main-panel.package-step-panel"),
    ).toContain("border: 1px solid var(--line)");
    expect(declarationBlock(".csa-ui .wizard-layout")).not.toContain("border:");
    const appCard = declarationBlock(".csa-ui .app-card");
    expect(appCard).toContain("border: 0");
    expect(appCard).toContain("background: transparent");
    expect(appCard).toContain("border-radius: 14px");
    expect(csaCss).not.toContain(".csa-ui:not(.csa-purchase-ui) .app-card");
    expect(declarationBlock(".csa-ui .content")).not.toContain("background:");
    expect(declarationBlock(".csa-ui .section-head")).not.toContain(
      "margin-top:",
    );
    expect(declarationBlock(".csa-ui .wizard-layout")).toContain(
      "width: min(1060px, 100%)",
    );
  });

  it("matches the Store typography and palette within the purchase flow", () => {
    const purchase = declarationBlock(".csa-ui.csa-purchase-ui");
    expect(purchase).toContain(
      "font-family: var(--font-body), system-ui, sans-serif",
    );
    expect(purchase).toContain("font-size: 0.90625rem");
    expect(purchase).toContain("background: var(--cream)");
    expect(purchase).toContain("color: var(--ink)");

    expect(csaCss).not.toMatch(/\.csa-ui\.csa-purchase-ui h1\s*\{/);
    expect(csaCss).not.toMatch(/\.csa-purchase-ui \.section-head h1\s*\{/);

    const sectionTitle = declarationBlock(".csa-ui.csa-purchase-ui h2");
    expect(sectionTitle).toContain("font-family: system-ui, sans-serif");
    expect(sectionTitle).toContain("font-size: 1.125rem");
    expect(sectionTitle).toContain("font-weight: 700");

    const primary = declarationBlock(".csa-ui.csa-purchase-ui .btn-primary");
    expect(primary).toContain("background: var(--forest)");
    expect(primary).toContain("color: var(--cream)");

    expect(purchase).not.toMatch(
      /(?:width|margin|padding|gap|display|grid-template-columns|position):/,
    );
  });

  it("ports the exact heading scale and four-step progress", () => {
    expect(declarationBlock(".csa-ui h1")).toContain("font-size: 30px");
    expect(declarationBlock(".csa-ui h2")).toContain("font-size: 20px");
    expect(csaCss).toMatch(/\.csa-ui h3\s*\{[^}]*font-size: 18px/);
    expect(declarationBlock(".csa-ui .progress")).toContain(
      "grid-template-columns: repeat(4, minmax(0, 1fr))",
    );
  });

  it("ports the demo package choice grid and package cards", () => {
    expect(declarationBlock(".csa-purchase-ui .package-choice-grid")).toContain(
      "gap: 18px",
    );
    const packageList = declarationBlock(".csa-purchase-ui .package-list");
    expect(packageList).toContain("display: grid");
    expect(packageList).toContain(
      "grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    );
    expect(packageList).toContain("gap: 12px");
    const packageOption = declarationBlock(".csa-purchase-ui .package-option");
    expect(packageOption).toContain("gap: 12px");
    expect(packageOption).toContain("padding: 16px");
    expect(packageOption).toContain("border: 1px solid var(--line)");
    expect(packageOption).toContain("border-radius: 12px");
    expect(csaCss).not.toMatch(/\.csa-ui \.packages\s*\{/);
    expect(csaCss).not.toMatch(/\.csa-ui \.package\s*\{/);
  });

  it("ports the exact duration list, total and action geometry", () => {
    const durationChoice = declarationBlock(
      ".csa-purchase-ui .duration-choice",
    );
    expect(durationChoice).toContain("min-height: 54px");
    expect(durationChoice).toContain("gap: 16px");
    expect(durationChoice).toContain("padding: 11px 12px");
    const durationList = declarationBlock(".csa-purchase-ui .duration-list");
    expect(durationList).toContain("border: 1px solid var(--line)");
    expect(durationList).toContain("border-radius: 10px");
    const chosenTotal = declarationBlock(".csa-purchase-ui .chosen-total");
    expect(chosenTotal).toContain("gap: 14px");
    expect(chosenTotal).toContain("margin-top: 12px");
    expect(chosenTotal).toContain("padding-top: 12px");
    expect(chosenTotal).toContain("border-top: 1px solid var(--line)");
    expect(declarationBlock(".csa-ui .btn-row")).toContain("margin-top: 14px");
    const button = declarationBlock(".csa-ui .btn");
    expect(button).toContain("min-height: 44px");
    expect(button).toContain("padding: 9px 12px");
    expect(button).toContain("border-radius: 10px");
  });

  it("keeps payment-plan typography compact and readable", () => {
    const sectionTitle = declarationBlock(
      ".csa-purchase-ui .payment-plan-section h3",
    );
    expect(sectionTitle).toContain("margin: 0 0 10px");
    expect(sectionTitle).toContain("font-size: 18px");
    expect(sectionTitle).toContain("font-weight: 700");

    const planChoice = declarationBlock(
      ".csa-purchase-ui .payment-plan-choice",
    );
    expect(planChoice).toContain("gap: 8px 12px");
    expect(csaCss).toMatch(
      /\.csa-purchase-ui \.payment-plan-main strong,[\s\S]*?\.csa-purchase-ui \.payment-plan-price > strong\s*\{[^}]*font-size: 16px[^}]*font-weight: 700/,
    );
    const planDescription = declarationBlock(
      ".csa-purchase-ui .payment-plan-main small",
    );
    expect(planDescription).toContain("font-size: 13px");
    expect(planDescription).toContain("color: var(--muted)");
    const installmentLabel = declarationBlock(
      ".csa-purchase-ui .payment-plan-installment strong:first-of-type",
    );
    expect(installmentLabel).toContain("font-size: 13px");
    expect(installmentLabel).toContain("font-weight: 600");
    const installmentAmount = declarationBlock(
      ".csa-purchase-ui .payment-plan-installment strong:last-of-type",
    );
    expect(installmentAmount).toContain("font-size: 14px");
    expect(installmentAmount).toContain("font-weight: 600");
    expect(
      declarationBlock(".csa-purchase-ui .payment-plan-section .saving-badge"),
    ).toContain("font-size: 12px");
    expect(
      declarationBlock(".csa-purchase-ui .chosen-total-payment strong"),
    ).toContain("font-size: 16px");
  });

  it("keeps tracker layout and makes payment responsive from one to two columns", () => {
    expect(csaCss).not.toMatch(
      /\.csa-ui \.(?:topbar|brand|brand-mark|brand-copy|tabs|tab-btn|eyebrow)/,
    );
    expect(declarationBlock(".csa-ui .lookup-wrap")).toContain(
      "width: min(100%, 40rem)",
    );
    const lookupCard = declarationBlock(".csa-ui .lookup-card");
    expect(lookupCard).toContain("border: 1px solid var(--line)");
    const resultCard = declarationBlock(".csa-ui .result-card");
    expect(resultCard).toContain("border: 0");
    expect(resultCard).toContain("background: transparent");
    const resultShell = declarationBlock(".csa-ui .result-shell");
    expect(resultShell).toContain("border: 1px solid var(--line)");
    expect(csaCss).not.toContain(".csa-ui .lookup-head");
    const paymentGrid = declarationBlock(".csa-purchase-ui .payment-grid");
    expect(paymentGrid).toContain("min-width: 0");
    expect(paymentGrid).toContain("display: grid");
    expect(paymentGrid).toContain("gap: 16px");
    expect(paymentGrid).not.toContain("grid-template-columns");
    expect(csaCss).toMatch(
      /@media \(min-width: 900px\)[\s\S]*?\.csa-purchase-ui \.payment-grid\s*\{[^}]*grid-template-columns: minmax\(240px, 0\.85fr\) minmax\(0, 1\.15fr\)/,
    );
    const qrWrap = declarationBlock(".csa-purchase-ui .qr-wrap");
    expect(qrWrap).toContain("width: min(320px, 100%)");
    expect(qrWrap).toContain("max-width: 100%");
    expect(qrWrap).toContain("aspect-ratio: 1 / 1");
    expect(qrWrap).toContain("justify-self: center");
    expect(qrWrap).toContain("flex: 0 0 auto");
    expect(qrWrap).toContain("margin-inline: auto");
    expect(qrWrap).toContain("padding: 8px 10px");
    const qr = declarationBlock(".csa-purchase-ui .qr");
    expect(qr).toContain("width: 100%");
    expect(qr).toContain("height: 100%");
    expect(qr).toContain("object-fit: contain");
    const qrImage = declarationBlock(".csa-purchase-ui .qr-image");
    expect(qrImage).toContain("width: 100%");
    expect(qrImage).toContain("aspect-ratio: 1 / 1");
    expect(qrImage).toContain("position: relative");
    expect(csaCss).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.csa-purchase-ui \.qr-wrap\s*\{[^}]*width: min\(280px, 100%\)/,
    );
    const qrLogo = declarationBlock(".csa-purchase-ui .qr-logo");
    expect(qrLogo).toContain("width: 15%");
    expect(qrLogo).toContain("position: absolute");
    expect(qrLogo).toContain("top: 50%");
    expect(qrLogo).toContain("left: 50%");
    expect(qrLogo).toContain("background: #fff");
    expect(qrLogo).toContain("pointer-events: none");
    expect(qrLogo).toContain("transform: translate(-50%, -50%)");
    expect(csaCss).not.toMatch(/\.csa-ui \.qr(?:-wrap)?\s*\{/);
    expect(csaCss).not.toMatch(/\.csa-ui \.qr-logo\s*\{/);
    expect(declarationBlock(".csa-purchase-ui .qr-unavailable")).toContain(
      "min-width: 0",
    );
    expect(declarationBlock(".csa-purchase-ui .payment-actions")).toContain(
      "margin-top: 16px",
    );
    const paymentLabel = declarationBlock(
      ".csa-ui.csa-purchase-ui .payment-information .bank-row .k",
    );
    expect(paymentLabel).toContain("color: var(--muted)");
    expect(paymentLabel).toContain("font-size: 0.8125rem");
    expect(declarationBlock(".csa-ui .bank-list")).toContain("gap: 10px");
    expect(declarationBlock(".csa-ui .bank-row")).toContain(
      "border-bottom: 1px dashed rgba(23, 63, 52, 0.16)",
    );
    expect(declarationBlock(".csa-ui .result-head")).toContain(
      "grid-template-columns: auto minmax(0, 1fr) auto",
    );
    const schedule = declarationBlock(".csa-purchase-ui .payment-schedule-row");
    expect(schedule).toContain("display: grid");
    expect(schedule).toContain(
      "grid-template-columns: minmax(0, 1fr) auto minmax(8rem, auto)",
    );
    expect(schedule).toContain("gap: 8px");
    expect(
      declarationBlock(".csa-purchase-ui .payment-schedule-label"),
    ).toContain("font-size: 0.8125rem");
    expect(
      declarationBlock(".csa-purchase-ui .payment-schedule-amount"),
    ).toContain("font-size: 0.90625rem");
  });

  it("matches tracker typography to the purchase visual system", () => {
    const tracker = declarationBlock(".csa-ui.csa-tracker-ui");
    expect(tracker).toContain("font-family: var(--font-body), sans-serif");
    expect(tracker).toContain("font-size: 0.90625rem");

    const title = declarationBlock(".csa-tracker-ui .section-head h1");
    expect(title).toContain("font-family: var(--font-body), sans-serif");
    expect(title).toContain("font-size: 1.625rem");
    expect(title).toContain("font-weight: 850");
    expect(title).toContain("line-height: 1.15");
    expect(title).toContain("letter-spacing: -0.035em");
    expect(title).toContain("color: var(--forest)");

    const intro = declarationBlock(".csa-tracker-ui .section-head .lead");
    expect(intro).toContain("max-width: 38rem");
    expect(intro).toContain("font-size: 0.90625rem");
    expect(intro).toContain("font-weight: 400");
    expect(intro).toContain("line-height: 1.6");
    expect(intro).toContain("color: var(--muted)");

    const resultTitle = declarationBlock(".csa-tracker-ui .result-head h2");
    expect(resultTitle).toContain("font-size: 1.125rem");
    expect(resultTitle).toContain("font-weight: 700");
    expect(resultTitle).toContain("line-height: 1.3");
    expect(resultTitle).toContain("color: var(--forest)");

    const label = declarationBlock(".csa-tracker-ui .kv dt");
    expect(label).toContain("font-size: 0.8125rem");
    expect(label).toContain("font-weight: 600");
    expect(label).toContain("color: var(--muted)");

    const value = declarationBlock(".csa-tracker-ui .kv dd");
    expect(value).toContain("font-size: 0.90625rem");
    expect(value).toContain("font-weight: 700");
    expect(value).toContain("line-height: 1.5");
    expect(value).toContain("color: var(--ink)");

    const badge = declarationBlock(".csa-tracker-ui .status-badge");
    expect(badge).toContain("font-size: 0.6875rem");
    expect(badge).toContain("line-height: 1.2");
    expect(badge).toContain("border-radius: 999px");

    const notice = declarationBlock(".csa-tracker-ui .notice");
    expect(notice).toContain("font-size: 0.90625rem");
    expect(notice).toContain("font-weight: 400");
    expect(notice).toContain("line-height: 1.6");

    const button = declarationBlock(".csa-tracker-ui :is(.btn, .ghost-link)");
    expect(button).toContain("font-size: 0.90625rem");
    expect(button).toContain("font-weight: 700");
    expect(button).toContain("line-height: 1.15");

    const formLabel = declarationBlock(".csa-tracker-ui label");
    expect(formLabel).toContain("font-size: 0.8125rem");
    expect(formLabel).toContain("font-weight: 600");
    expect(formLabel).toContain("line-height: 1.35");

    expect(csaCss).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.csa-tracker-ui \.section-head h1\s*\{[^}]*font-size: 1\.4rem/,
    );
  });

  it("adds subtle tracker surface motion with reduced-motion support", () => {
    const surface = declarationBlock(
      ".csa-tracker-ui :is(.lookup-card, .result-shell)",
    );
    expect(surface).toContain(
      "animation: csa-tracker-surface-enter 180ms ease-out both",
    );
    expect(csaCss).toMatch(
      /@keyframes csa-tracker-surface-enter\s*\{[\s\S]*?opacity: 0;[\s\S]*?transform: translateY\(6px\);[\s\S]*?opacity: 1;[\s\S]*?transform: translateY\(0\);/,
    );
    expect(declarationBlock(".csa-tracker-ui .status-dot")).toContain(
      "animation: csa-tracker-status-enter 180ms ease-out both",
    );
    expect(csaCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.csa-ui \*[\s\S]*?animation: none !important/,
    );
  });

  it("ports the demo success presentation without a full-width code box", () => {
    const success = declarationBlock(".csa-ui .success");
    expect(success).toContain("padding: 18px 4px");
    expect(success).toContain("text-align: center");
    const icon = declarationBlock(".csa-ui .success-icon");
    expect(icon).toContain("width: 40px");
    expect(icon).toContain("height: 40px");
    expect(icon).toContain("border-radius: 50%");
    expect(icon).toContain("background: var(--forest)");
    const paragraph = declarationBlock(".csa-ui .success > p");
    expect(paragraph).toContain("max-width: 520px");
    expect(paragraph).toContain("margin: 8px auto");
    expect(paragraph).toContain("color: var(--muted)");
    const code = declarationBlock(".csa-ui .success .code");
    expect(code).toContain("display: inline-block");
    expect(code).toContain("max-width: 100%");
  });

  it("ports demo mobile stacking and reduced motion", () => {
    expect(csaCss).toMatch(
      /@media \(min-width: 900px\)[\s\S]*?\.csa-purchase-ui \.package-list\s*\{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/,
    );
    expect(csaCss).toMatch(
      /@media \(min-width: 600px\) and \(max-width: 899px\)[\s\S]*?\.csa-purchase-ui \.package-list\s*\{[\s\S]*?display: flex[\s\S]*?overflow-x: auto/,
    );
    expect(csaCss).toMatch(
      /@media \(max-width: 599px\)[\s\S]*?\.csa-purchase-ui \.package-list\s*\{[\s\S]*?grid-template-columns: 1fr/,
    );
    expect(csaCss).toMatch(
      /@media \(max-width: 480px\)[\s\S]*?\.csa-ui \.kv\s*\{\s*grid-template-columns: 1fr/,
    );
    expect(csaCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition: none !important/,
    );
    expect(csaCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.csa-purchase-ui \.step\s*\{\s*animation: none;/,
    );
  });
});
