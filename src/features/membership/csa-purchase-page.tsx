"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import { accountApi, AccountApiError } from "@/features/account/api";
import type {
  AdministrativeUnit,
  CSAPaymentQuote,
  CSAPaymentQuoteSummary,
  CSAPurchaseRequestCreated,
  CSAPaymentPlan,
  MembershipPackage,
  MembershipPackagePriceOption,
  PaginationMeta,
} from "@/features/account/types";
import { getCSAPurchaseCopy } from "@/features/membership/csa-purchase-copy";
import {
  type CSAGuestDetails,
  type CSAPurchaseErrorKey,
  type CSAPurchaseStep,
  CSAFlowStateProvider,
  useCSAFlowState,
} from "@/features/membership/csa-flow-state";
import {
  formatMembershipMoney,
  formatMembershipUnits,
  membershipUnitLabel,
} from "@/features/membership/format";
import type { CoreUser } from "@/lib/auth/schemas";
import { normalizeVietnamPhone } from "@/lib/contact";
import { getCsaQuotaPolicyText } from "@/content/site-content";
import { localizedPath, type Locale } from "@/lib/i18n";

type PurchaseCopy = ReturnType<typeof getCSAPurchaseCopy>;

const termsErrorId = "csa-purchase-terms-error";
const couponErrorId = "csa-coupon-error";
const couponHintId = "csa-coupon-hint";
const paymentMethodView = "method";
const paymentQRView = "qr";
const couponQuoteExpiredCode = "coupon_quote_expired";
const paymentQuoteExpiredCode = "csa_payment_quote_expired";
const SINGLE_MONTH_FULL_PAYMENT_ID = "__single_month_full__";
const CSA_AGREEMENT_TERM_IDS = Array.from(
  { length: 11 },
  (_, index) => `csa-program-term-${index + 1}`,
);

const emptyGuestDetails: CSAGuestDetails = {
  name: "",
  phone: "",
  province_code: "",
  ward_code: "",
  address: "",
};

function sortAdministrativeUnits(
  units: AdministrativeUnit[],
  locale: Locale,
): AdministrativeUnit[] {
  return [...units].sort(
    (left, right) =>
      left.name.localeCompare(right.name, locale, { sensitivity: "base" }) ||
      left.code.localeCompare(right.code),
  );
}

function purchaseErrorKey(error: unknown): CSAPurchaseErrorKey {
  if (!(error instanceof AccountApiError)) return "genericError";
  if (error.status === 429) return "rateLimited";
  if (
    [
      "csa_purchase_package_unavailable",
      "package_unavailable",
      "price_option_unavailable",
    ].includes(error.code)
  )
    return "packageUnavailable";
  if (error.code === "csa_purchase_payment_unavailable")
    return "paymentUnavailable";
  if (error.code === "csa_purchase_payment_plan_required")
    return "paymentPlanRequired";
  if (error.code === "csa_purchase_payment_plan_unavailable")
    return "paymentPlanUnavailable";
  if (error.code === "csa_purchase_terms_required") return "termsRequired";
  if (error.code === "csa_purchase_request_open_exists") return "duplicate";
  if (error.code === "csa_purchase_request_expired") return "expired";
  if (error.code === "csa_payment_quote_expired") return "quoteExpired";
  if (error.code === "csa_payment_quote_unavailable") return "quoteUnavailable";
  if (error.code === "csa_payment_quote_identity_mismatch")
    return "quoteIdentityMismatch";
  if (
    ["invalid_csa_purchase_request", "invalid_csa_purchase_address"].includes(
      error.code,
    )
  )
    return "invalidDetails";
  if (
    [
      "csa_purchase_request_not_pending",
      "csa_purchase_request_not_found",
    ].includes(error.code)
  )
    return "notPending";
  return "genericError";
}

export function purchaseErrorMessage(error: unknown, locale: Locale) {
  return getCSAPurchaseCopy(locale)[purchaseErrorKey(error)];
}

export function buildVietQRUrl(request: Pick<CSAPaymentQuote, "qr_payload">) {
  const qr = request.qr_payload;
  if (
    !/^\d{6}$/.test(qr?.acqId ?? "") ||
    !/^\d+$/.test(qr?.accountNo ?? "") ||
    !/^\d+$/.test(qr?.amount ?? "") ||
    !qr?.accountName?.trim() ||
    !qr?.addInfo?.trim()
  )
    return "";
  const parameters = new URLSearchParams({
    amount: qr.amount,
    addInfo: qr.addInfo,
    accountName: qr.accountName,
  });
  return `https://img.vietqr.io/image/${qr.acqId}-${qr.accountNo}-qr_only.png?${parameters}`;
}

function durationLabel(
  option: MembershipPackagePriceOption,
  copy: { month: string; months: string },
) {
  const template = option.duration_months === 1 ? copy.month : copy.months;
  return template.replace("{count}", String(option.duration_months));
}

function positiveInteger(value: string) {
  return /^[1-9]\d*(?:\.0+)?$/.test(value) ? BigInt(value.split(".")[0]) : null;
}

function quoteAmount(value: unknown) {
  return typeof value === "string" ? positiveInteger(value) : null;
}

function isPaymentQuote(
  value: unknown,
  selectedPlan?: CSAPaymentPlan,
): value is CSAPaymentQuote {
  if (!value || typeof value !== "object") return false;
  const quote = value as Record<string, unknown>;
  const payment = quote.payment as Record<string, unknown> | undefined;
  const summary = quote.payment_summary as Record<string, unknown> | undefined;
  const terms = quote.terms as Record<string, unknown> | undefined;
  const qr = quote.qr_payload as Record<string, unknown> | undefined;
  const coupon = quote.coupon as Record<string, unknown> | undefined;
  const installments = summary?.installments;
  if (
    typeof quote.quote_token !== "string" ||
    !quote.quote_token ||
    typeof quote.request_code !== "string" ||
    !/^CSA-[A-Z0-9-]+$/.test(quote.request_code) ||
    typeof quote.expires_at !== "string" ||
    !quote.expires_at.includes("T") ||
    !Number.isFinite(Date.parse(quote.expires_at)) ||
    !payment ||
    !summary ||
    !terms ||
    !qr ||
    !["full", "installment"].includes(String(summary.payment_type)) ||
    !quoteAmount(payment.amount) ||
    !quoteAmount(summary.total_amount) ||
    !quoteAmount(summary.initial_payment_amount) ||
    !Number.isSafeInteger(summary.installment_count) ||
    !Array.isArray(installments) ||
    installments.length !== summary.installment_count ||
    !["vi", "en"].includes(String(terms.locale))
  )
    return false;
  if (
    [
      "bank_code",
      "bank_name",
      "account_number",
      "account_name",
      "transfer_content",
    ].some(
      (key) => typeof payment[key] !== "string" || !String(payment[key]).trim(),
    ) ||
    ["version", "hash"].some(
      (key) => typeof terms[key] !== "string" || !String(terms[key]).trim(),
    ) ||
    ["acqId", "accountNo", "accountName", "amount", "addInfo"].some(
      (key) => typeof qr[key] !== "string" || !String(qr[key]).trim(),
    )
  )
    return false;
  if (
    installments.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        !Number.isSafeInteger((item as Record<string, unknown>).sequence) ||
        Number((item as Record<string, unknown>).sequence) < 1 ||
        !quoteAmount((item as Record<string, unknown>).amount) ||
        !Number.isSafeInteger((item as Record<string, unknown>).cycle_count) ||
        Number((item as Record<string, unknown>).cycle_count) < 1,
    ) ||
    (summary.payment_type === "full" && installments.length !== 1) ||
    (summary.payment_type === "installment" && installments.length < 2)
  )
    return false;
  const sequences = installments.map(
    (item) => (item as Record<string, unknown>).sequence,
  );
  if (
    new Set(sequences).size !== sequences.length ||
    !sequences.includes(1) ||
    [...sequences]
      .sort((a, b) => Number(a) - Number(b))
      .some((sequence, index) => sequence !== index + 1)
  )
    return false;
  const installmentAmounts = installments.map((item) =>
    quoteAmount((item as Record<string, unknown>).amount),
  );
  const totalAmount = quoteAmount(summary.total_amount);
  const initialAmount = quoteAmount(summary.initial_payment_amount);
  const qrAmount = quoteAmount(qr.amount);
  if (
    installmentAmounts.some((amount) => amount === null) ||
    totalAmount === null ||
    initialAmount === null ||
    qrAmount === null ||
    qrAmount !== initialAmount ||
    quoteAmount(payment.amount) !== initialAmount ||
    qr.acqId !== payment.bank_code ||
    qr.accountNo !== payment.account_number ||
    qr.accountName !== payment.account_name ||
    qr.addInfo !== payment.transfer_content
  )
    return false;
  const validInstallmentAmounts = installmentAmounts as bigint[];
  const firstInstallmentIndex = sequences.findIndex(
    (sequence) => Number(sequence) === 1,
  );
  const installmentTotal = validInstallmentAmounts.reduce(
    (total, amount) => total + amount,
    BigInt(0),
  );
  if (validInstallmentAmounts[firstInstallmentIndex] !== initialAmount)
    return false;
  if (selectedPlan) {
    const originalInstallments = selectedPlan.installments;
    if (
      summary.payment_type !== selectedPlan.payment_type ||
      installments.length !== originalInstallments.length ||
      selectedPlan.installment_count !== installments.length ||
      quoteAmount(selectedPlan.total_amount) !== totalAmount ||
      installments.some((item) => {
        const row = item as Record<string, unknown>;
        const original = originalInstallments.find(
          (candidate) => candidate.sequence === row.sequence,
        );
        return (
          !original ||
          original.cycle_count !== row.cycle_count ||
          (row.sequence !== 1 &&
            quoteAmount(original.amount) !== quoteAmount(row.amount))
        );
      })
    )
      return false;
  }
  if (!coupon) return installmentTotal === totalAmount;
  const discount = quoteAmount(coupon.discount_amount);
  const before = quoteAmount(summary.initial_payment_before_discount);
  const payable = quoteAmount(summary.customer_payable_total);
  const planTotal = quoteAmount(summary.payment_plan_total_before_discount);
  const contractTotal = quoteAmount(summary.contract_total_before_discount);
  return Boolean(
    typeof coupon.code === "string" &&
    /^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(coupon.code) &&
    (coupon.discount_type === "percent" || coupon.discount_type === "fixed") &&
    typeof coupon.discount_value === "string" &&
    /^\d+(?:\.\d{1,2})?$/.test(coupon.discount_value) &&
    discount !== null &&
    quoteAmount(summary.discount_amount) === discount &&
    before !== null &&
    payable !== null &&
    planTotal === totalAmount &&
    contractTotal !== null &&
    (!selectedPlan ||
      quoteAmount(
        selectedPlan.installments.find((item) => item.sequence === 1)?.amount,
      ) === before) &&
    before - discount === initialAmount &&
    totalAmount - discount === payable &&
    installmentTotal === payable,
  );
}

function priceOptionSaving(
  option: MembershipPackagePriceOption,
  oneMonthOption?: MembershipPackagePriceOption,
) {
  if (!oneMonthOption) return null;
  const monthlyPrice = positiveInteger(oneMonthOption.monthly_price_vnd);
  const selectedTotal = positiveInteger(option.total_price_vnd);
  if (
    monthlyPrice === null ||
    selectedTotal === null ||
    !Number.isSafeInteger(option.duration_months) ||
    option.duration_months <= 1
  ) {
    return null;
  }
  const regularTotal = monthlyPrice * BigInt(option.duration_months);
  const saving = regularTotal - selectedTotal;
  if (regularTotal <= 0 || saving <= 0) return null;
  return {
    baseline: regularTotal.toString(),
    amount: saving.toString(),
    percent: savingPercent(saving, regularTotal),
  };
}

function savingPercent(amount: bigint, baseline: bigint) {
  const hundredths = (amount * BigInt(10000) + baseline / BigInt(2)) / baseline;
  return `${hundredths / BigInt(100)}.${(hundredths % BigInt(100)).toString().padStart(2, "0")}`;
}

function localizedSavingPercent(percent: string, locale: Locale) {
  return locale === "vi" ? percent.replace(".", ",") : percent;
}

function activePriceOptions(item: MembershipPackage) {
  return item.price_options.filter((option) => option.is_active !== false);
}

function validPaymentPlan(plan: CSAPaymentPlan, durationMonths: number) {
  if (!plan.id || !positiveInteger(plan.total_amount)) return false;
  if (plan.payment_type !== "full" && plan.payment_type !== "installment")
    return false;
  if (!Array.isArray(plan.installments)) return false;
  if (plan.payment_type === "full" && plan.installment_count !== 1)
    return false;
  if (plan.payment_type === "installment" && plan.installment_count < 2)
    return false;
  const installments = [...plan.installments].sort(
    (a, b) => a.sequence - b.sequence,
  );
  if (installments.length !== plan.installment_count) return false;
  const amounts = installments.map((row) => positiveInteger(row.amount));
  if (amounts.some((amount) => amount === null)) return false;
  if (
    installments.some(
      (row, index) =>
        row.sequence !== index + 1 ||
        !Number.isSafeInteger(row.cycle_count) ||
        row.cycle_count < 1,
    )
  )
    return false;
  const summedAmount = amounts.reduce<bigint>(
    (total, amount) => total + (amount ?? BigInt(0)),
    BigInt(0),
  );
  return (
    summedAmount === positiveInteger(plan.total_amount) &&
    installments.reduce((total, row) => total + row.cycle_count, 0) ===
      durationMonths
  );
}

function sortedInstallments(plan: CSAPaymentPlan) {
  return [...plan.installments].sort((a, b) => a.sequence - b.sequence);
}

function paymentPlanLabel(plan: CSAPaymentPlan, copy: PurchaseCopy) {
  return plan.payment_type === "full"
    ? copy.payFull
    : copy.payInstallments.replace("{count}", String(plan.installment_count));
}

function installmentMonthsLabel(
  cycleCount: number,
  index: number,
  total: number,
  copy: PurchaseCopy,
) {
  const template =
    index === 0
      ? copy.installmentBeginning
      : index === total - 1
        ? copy.installmentFinal
        : copy.installmentFollowing;
  return template.replace("{count}", String(cycleCount));
}

function validPaymentPlans(option: MembershipPackagePriceOption) {
  return (option.payment_plans ?? []).filter((plan) =>
    validPaymentPlan(plan, option.duration_months),
  );
}

function singleMonthFullPaymentPlan(
  option: MembershipPackagePriceOption | undefined,
): CSAPaymentPlan | null {
  if (!option || option.duration_months !== 1) return null;
  return {
    id: SINGLE_MONTH_FULL_PAYMENT_ID,
    name: "",
    payment_type: "full",
    total_amount: option.total_price_vnd,
    installment_count: 1,
    initial_payment_amount: option.total_price_vnd,
    installments: [
      { sequence: 1, amount: option.total_price_vnd, cycle_count: 1 },
    ],
  };
}

function plansForOption(
  option: MembershipPackagePriceOption | undefined,
  plans: CSAPaymentPlan[],
) {
  return plans.length
    ? plans
    : ([singleMonthFullPaymentPlan(option)].filter(
        Boolean,
      ) as CSAPaymentPlan[]);
}

function paymentPlanSaving(
  plan: CSAPaymentPlan,
  selectedPlanId: string,
  plans: CSAPaymentPlan[],
) {
  if (plan.payment_type !== "full") return null;
  const selectedInstallment = plans.find(
    (item) => item.id === selectedPlanId && item.payment_type === "installment",
  );
  const installment =
    selectedInstallment ??
    plans.find((item) => item.payment_type === "installment");
  const fullTotal = positiveInteger(plan.total_amount);
  const installmentTotal = installment
    ? positiveInteger(installment.total_amount)
    : null;
  if (
    fullTotal === null ||
    installmentTotal === null ||
    fullTotal <= 0 ||
    installmentTotal <= fullTotal
  )
    return null;
  const amount = installmentTotal - fullTotal;
  if (amount <= 0) return null;
  return {
    amount: amount.toString(),
    percent: savingPercent(amount, installmentTotal),
  };
}

function firstAvailableSelection(items: MembershipPackage[]) {
  for (const item of items) {
    if (item.is_active === false) continue;
    const option = activePriceOptions(item)[0];
    if (option) return { packageId: item.id, optionId: option.id };
  }
  return { packageId: "", optionId: "" };
}

function progressClass(number: number, current: number) {
  if (number === current) return "progress-item active";
  if (number < current) return "progress-item done";
  return "progress-item";
}

function isReloadNavigation() {
  if (typeof performance === "undefined" || !performance.getEntriesByType)
    return false;
  return performance.getEntriesByType("navigation").some((entry) => {
    return "type" in entry && entry.type === "reload";
  });
}

// Navigation timing describes the whole document lifetime. Read it once so a
// route or locale remount cannot be mistaken for another browser reload.
const documentWasReloaded = isReloadNavigation();

function PurchaseLoadingOverlay({
  message,
  statusRef,
}: {
  message: string;
  statusRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="csa-loading-backdrop">
      <div
        className="csa-loading-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-busy="true"
        tabIndex={-1}
        ref={statusRef}
      >
        <span className="csa-loading-spinner" aria-hidden="true" />
        <p>{message}</p>
      </div>
    </div>
  );
}

function PurchaseLoadingSurface({
  children,
  loadingMessage,
}: {
  children: React.ReactNode;
  loadingMessage: string | null;
}) {
  const regionRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const region = regionRef.current;
    if (region) {
      (region as HTMLDivElement & { inert?: boolean }).inert =
        Boolean(loadingMessage);
    }
    if (loadingMessage && !loadingRef.current) {
      const active = document.activeElement;
      previousFocusRef.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : null;
      statusRef.current?.focus({ preventScroll: true });
    } else if (!loadingMessage && loadingRef.current) {
      const previous = previousFocusRef.current;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      previousFocusRef.current = null;
    }
    loadingRef.current = Boolean(loadingMessage);
  }, [loadingMessage]);

  return (
    <>
      <div ref={regionRef} aria-busy={Boolean(loadingMessage)}>
        {children}
      </div>
      {loadingMessage ? (
        <PurchaseLoadingOverlay
          message={loadingMessage}
          statusRef={statusRef}
        />
      ) : null}
    </>
  );
}

function PurchaseChrome({
  children,
  restored = false,
  loadingMessage = null,
}: {
  children: React.ReactNode;
  restored?: boolean;
  loadingMessage?: string | null;
}) {
  return (
    <main
      className={["csa-ui", "csa-purchase-ui", restored && "csa-flow-restored"]
        .filter(Boolean)
        .join(" ")}
      aria-busy={Boolean(loadingMessage)}
    >
      <PurchaseLoadingSurface loadingMessage={loadingMessage}>
        <div className="shell">
          <div className="app-card">
            <div className="content">{children}</div>
          </div>
        </div>
      </PurchaseLoadingSurface>
    </main>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="8" y="8" width="10" height="10" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function currentStep(number: number, current: number) {
  if (number === current) return "step";
  return undefined;
}

function describedBy(invalid: boolean, errorId: string) {
  return invalid ? errorId : undefined;
}

function PaymentPlanSection({
  selectedOption,
  plans,
  selectedPlanId,
  locale,
  copy,
  disabled,
  onSelect,
}: {
  selectedOption: MembershipPackagePriceOption | undefined;
  plans: CSAPaymentPlan[];
  selectedPlanId: string;
  locale: Locale;
  copy: PurchaseCopy;
  disabled: boolean;
  onSelect: (planId: string) => void;
}) {
  return (
    <div className="payment-plan-section">
      {selectedOption &&
      selectedOption.duration_months > 1 &&
      plans.length === 0 ? (
        <p className="notice error" role="alert">
          {copy.paymentPlanMissing}
        </p>
      ) : null}
      <div
        className="payment-plan-list"
        role="group"
        aria-label={copy.paymentPlanTitle}
      >
        {plans.map((plan) => {
          const installments = sortedInstallments(plan);
          const saving = paymentPlanSaving(plan, selectedPlanId, plans);
          return (
            <button
              className={[
                "payment-plan-choice",
                selectedPlanId === plan.id && "selected",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              key={plan.id}
              data-payment-plan={plan.id}
              aria-label={paymentPlanLabel(plan, copy)}
              aria-pressed={selectedPlanId === plan.id}
              disabled={disabled}
              onClick={() => onSelect(plan.id)}
            >
              <span className="payment-plan-main">
                <strong>{paymentPlanLabel(plan, copy)}</strong>
                <small>
                  {(plan.payment_type === "full"
                    ? copy.entirePackage
                    : copy.packageDuration
                  ).replace(
                    "{count}",
                    String(selectedOption?.duration_months ?? 0),
                  )}
                </small>
              </span>
              <span className="payment-plan-price">
                <strong>
                  {formatMembershipMoney(plan.total_amount, locale)}
                </strong>
                {saving ? (
                  <span className="saving-badge">
                    {copy.paymentPlanSaving
                      .replace(
                        "{amount}",
                        formatMembershipMoney(saving.amount, locale),
                      )
                      .replace(
                        "{percent}",
                        localizedSavingPercent(saving.percent, locale),
                      )}
                  </span>
                ) : null}
              </span>
              {plan.payment_type === "installment" ? (
                <span className="payment-plan-detail">
                  {installments.map((row, index) => (
                    <span
                      className="payment-plan-installment"
                      key={row.sequence}
                    >
                      <strong>
                        {copy.installmentNumber.replace(
                          "{number}",
                          String(row.sequence),
                        )}
                      </strong>
                      <strong>
                        {formatMembershipMoney(row.amount, locale)}
                      </strong>
                      <small>
                        {installmentMonthsLabel(
                          row.cycle_count,
                          index,
                          installments.length,
                          copy,
                        )}
                      </small>
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function couponErrorCopy(code: string | null, copy: PurchaseCopy) {
  if (!code) return "";
  const messages: Record<string, string> = {
    coupon_invalid: copy.couponInvalid,
    coupon_not_started: copy.couponNotStarted,
    coupon_expired: copy.couponExpired,
    coupon_inactive: copy.couponInactive,
    coupon_usage_exhausted: copy.couponExhausted,
    coupon_not_applicable: copy.couponNotApplicable,
    coupon_minimum_amount_not_met: copy.couponMinimum,
    coupon_already_used: copy.couponAlreadyUsed,
    coupon_quote_expired: copy.couponQuoteExpired,
    csa_payment_quote_expired: copy.couponQuoteExpired,
    csa_payment_quote_unavailable: copy.quoteUnavailable,
    coupon_required: copy.couponRequired,
  };
  return messages[code] ?? copy.quoteUnavailable;
}

function CouponControl({
  copy,
  code,
  appliedCode,
  error,
  busy,
  onChange,
  onApply,
  onRemove,
}: {
  copy: PurchaseCopy;
  code: string;
  appliedCode: string | null;
  error: string;
  busy: boolean;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}) {
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus({ preventScroll: true });
  }, [error]);
  return (
    <div className="csa-coupon-control" aria-busy={busy}>
      <form
        className="field"
        onSubmit={(event) => {
          event.preventDefault();
          if (!appliedCode) onApply();
        }}
      >
        <label htmlFor="csa-coupon-code">{copy.couponLabel}</label>
        <div className="csa-coupon-entry">
          <input
            id="csa-coupon-code"
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder={copy.couponPlaceholder}
            value={code}
            disabled={busy || Boolean(appliedCode)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? couponErrorId : couponHintId}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
          />
          {appliedCode ? (
            <button
              className="btn btn-secondary"
              type="button"
              disabled={busy}
              onClick={onRemove}
            >
              {copy.couponRemove}
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              type="submit"
              disabled={busy || !code.trim()}
            >
              {copy.couponApply}
            </button>
          )}
        </div>
      </form>
      <span className="sr-only" id={couponHintId}>
        {copy.couponPlaceholder}
      </span>
      {error ? (
        <p
          className="notice error"
          id={couponErrorId}
          role="alert"
          ref={errorRef}
          tabIndex={-1}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CouponQuoteSummary({
  summary,
  locale,
  copy,
}: {
  summary: CSAPaymentQuoteSummary;
  locale: Locale;
  copy: PurchaseCopy;
}) {
  const { coupon, payment_summary: paymentSummary } = summary;
  const full = paymentSummary.payment_type === "full";
  return (
    <div className="csa-coupon-summary" role="status">
      <dl className="bank-list">
        <div className="bank-row">
          <dt className="k">{copy.packageValue}</dt>
          <dd className="v">
            {formatMembershipMoney(
              paymentSummary.contract_total_before_discount!,
              locale,
            )}
          </dd>
        </div>
        <div className="bank-row">
          <dt className="k">
            {full ? copy.couponPlanPrice : copy.couponFirstBefore}
          </dt>
          <dd className="v">
            {formatMembershipMoney(
              full
                ? paymentSummary.payment_plan_total_before_discount!
                : paymentSummary.initial_payment_before_discount!,
              locale,
            )}
          </dd>
        </div>
        <div className="bank-row">
          <dt className="k">{copy.couponDiscount}</dt>
          <dd className="v">
            -{formatMembershipMoney(coupon.discount_amount, locale)}
          </dd>
        </div>
        <div className="bank-row">
          <dt className="k">
            {full ? copy.couponPayable : copy.couponFirstAfter}
          </dt>
          <dd className="v">
            <strong>
              {formatMembershipMoney(
                paymentSummary.initial_payment_amount,
                locale,
              )}
            </strong>
          </dd>
        </div>
      </dl>
      {!full ? <p className="notice">{copy.couponFirstOnly}</p> : null}
    </div>
  );
}

function WizardProgress({
  current,
  locale,
  progressRef,
}: {
  current: number;
  locale: Locale;
  progressRef: RefObject<HTMLOListElement | null>;
}) {
  const copy = getCSAPurchaseCopy(locale);
  return (
    <ol className="progress" aria-label={copy.progressLabel} ref={progressRef}>
      {copy.steps.map((label, index) => {
        const number = index + 1;
        return (
          <li
            className={progressClass(number, current)}
            aria-current={currentStep(number, current)}
            key={label}
          >
            <span className="progress-line" aria-hidden="true">
              <span />
            </span>
            <strong className="progress-label">
              {number}. {label}
            </strong>
          </li>
        );
      })}
    </ol>
  );
}

function CSAPurchaseWizard({
  locale,
  currentUser,
  onReset,
  onAuthAccount,
  profileRefreshVersion,
}: {
  locale: Locale;
  currentUser: CoreUser | null;
  onReset: () => void;
  onAuthAccount: () => void;
  profileRefreshVersion: number;
}) {
  const copy = getCSAPurchaseCopy(locale);
  const authAccountUrl = `/api/auth/account?returnTo=${encodeURIComponent(
    `/csa/purchase/${locale}`,
  )}`;
  const {
    purchase: purchaseMemory,
    setPurchase: savePurchase,
    quoteCreation,
    createQuote: startQuoteCreation,
    invalidateQuote,
    confirmation,
    confirmTransfer: startConfirmation,
  } = useCSAFlowState();
  const initialMemory = useRef(purchaseMemory).current;
  const restoredFromMemory = initialMemory !== null;
  const [step, setStep] = useState<CSAPurchaseStep>(initialMemory?.step ?? 1);
  const [packages, setPackages] = useState<MembershipPackage[]>(
    initialMemory?.packages ?? [],
  );
  const [packagesLocale, setPackagesLocale] = useState<Locale | null>(
    initialMemory?.packagesLocale ?? null,
  );
  const [packagesState, setPackagesState] = useState<
    "loading" | "ready" | "error"
  >(initialMemory?.packagesState ?? "loading");
  const packageRequest = useRef<{
    sequence: number;
    locale: Locale;
    controller: AbortController;
  } | null>(null);
  const packageSequence = useRef(0);
  const currentLocale = useRef(locale);
  currentLocale.current = locale;
  const user = currentUser;
  const sessionReady = true;
  const [provinces, setProvinces] = useState<AdministrativeUnit[]>(
    initialMemory?.provinces ?? [],
  );
  const [provincesLocale, setProvincesLocale] = useState<Locale | null>(
    initialMemory?.provincesLocale ?? null,
  );
  const [wards, setWards] = useState<AdministrativeUnit[]>(
    initialMemory?.wards ?? [],
  );
  const [wardsResourceKey, setWardsResourceKey] = useState(
    initialMemory?.wardsResourceKey ?? "",
  );
  const [wardsLoading, setWardsLoading] = useState(false);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const wardRequest = useRef<{
    sequence: number;
    resourceKey: string;
    controller: AbortController;
  } | null>(null);
  const wardSequence = useRef(0);
  const [selectedPackageId, setSelectedPackageId] = useState(
    initialMemory?.selectedPackageId ?? "",
  );
  const [selectedOptionId, setSelectedOptionId] = useState(
    initialMemory?.selectedOptionId ?? "",
  );
  const [selectedPlanId, setSelectedPlanId] = useState(
    initialMemory?.selectedPlanId ?? "",
  );
  const selectionRef = useRef({
    packageId: selectedPackageId,
    optionId: selectedOptionId,
    planId: selectedPlanId,
  });
  selectionRef.current = {
    packageId: selectedPackageId,
    optionId: selectedOptionId,
    planId: selectedPlanId,
  };
  const [guest, setGuest] = useState(initialMemory?.guest ?? emptyGuestDetails);
  const currentWardSelection = useRef({
    locale,
    provinceCode: guest.province_code,
  });
  currentWardSelection.current = { locale, provinceCode: guest.province_code };
  const [acceptedTermIds, setAcceptedTermIds] = useState<string[]>(() => {
    const restoredIds = initialMemory?.acceptedTermIds;
    if (restoredIds) {
      return CSA_AGREEMENT_TERM_IDS.filter((id) => restoredIds.includes(id));
    }
    return initialMemory?.termsAccepted ? CSA_AGREEMENT_TERM_IDS : [];
  });
  const termsAccepted =
    acceptedTermIds.length === CSA_AGREEMENT_TERM_IDS.length;
  const [informationSubmitted, setInformationSubmitted] = useState(
    initialMemory?.informationSubmitted ?? false,
  );
  const [termsSubmitted, setTermsSubmitted] = useState(
    initialMemory?.termsSubmitted ?? false,
  );
  const creating = quoteCreation.status === "pending";
  const quoteCreationStatusRef = useRef(quoteCreation.status);
  quoteCreationStatusRef.current = quoteCreation.status;
  const confirming = confirmation.status === "pending";
  const [profileIncomplete, setProfileIncomplete] = useState(
    initialMemory?.profileIncomplete ?? false,
  );
  const previousProfileRefreshVersion = useRef(profileRefreshVersion);
  const [errorKey, setErrorKey] = useState<CSAPurchaseErrorKey | null>(
    initialMemory?.errorKey ?? null,
  );
  const error = errorKey ? copy[errorKey] : "";
  const [purchase, setPurchase] = useState<CSAPurchaseRequestCreated | null>(
    initialMemory?.purchase ?? null,
  );
  const [quote, setQuote] = useState<CSAPaymentQuote | null>(
    initialMemory?.quote ?? null,
  );
  const [paymentView, setPaymentView] = useState<"method" | "qr">(
    initialMemory?.paymentView ??
      (initialMemory?.quote ? paymentQRView : paymentMethodView),
  );
  const [quoteTarget, setQuoteTarget] = useState<"method" | "qr">(
    initialMemory?.quoteTarget ?? "qr",
  );
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    initialMemory?.appliedCouponCode ??
      initialMemory?.quote?.coupon?.code ??
      null,
  );
  const [couponInput, setCouponInput] = useState(
    initialMemory?.couponInput ?? "",
  );
  const [couponErrorCode, setCouponErrorCode] = useState<string | null>(
    initialMemory?.couponErrorCode ?? null,
  );
  const [couponSummary, setCouponSummary] =
    useState<CSAPaymentQuoteSummary | null>(
      initialMemory?.couponSummary ?? null,
    );
  const [couponAction, setCouponAction] = useState<"apply" | "remove" | null>(
    null,
  );
  const couponActionRef = useRef<"apply" | "remove" | null>(null);
  const handledQuoteErrorRef = useRef<typeof quoteCreation | null>(null);
  const handledConfirmationErrorRef = useRef<typeof confirmation | null>(null);
  const restoreCouponFocus = useRef(false);
  const [confirmed, setConfirmed] = useState(initialMemory?.confirmed ?? false);
  const [qrFailed, setQrFailed] = useState(initialMemory?.qrFailed ?? false);
  const [expired, setExpired] = useState(initialMemory?.expired ?? false);
  const paymentExpired = Boolean(
    expired ||
    (quote?.expires_at &&
      Number.isFinite(Date.parse(quote.expires_at)) &&
      Date.parse(quote.expires_at) <= Date.now()),
  );
  const [copiedField, setCopiedField] = useState<"account" | "content" | null>(
    null,
  );
  const progressRef = useRef<HTMLOListElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const stepScrollFrameRef = useRef<number | null>(null);
  const activeWizardStep = confirmed ? 5 : step;
  const previousNavigationRef = useRef({
    step: activeWizardStep,
    paymentView,
  });

  const normalizedCouponInput = couponInput.trim().toUpperCase();
  const couponApplied = Boolean(
    appliedCouponCode && normalizedCouponInput === appliedCouponCode,
  );
  const couponBlocksContinue = Boolean(normalizedCouponInput) && !couponApplied;
  const loadingMessage = confirming
    ? copy.confirmingTransfer
    : creating
      ? couponAction === "apply"
        ? copy.applyingDiscountCode
        : couponAction === "remove"
          ? copy.processing
          : copy.preparingPaymentDetails
      : packagesState === "loading" || provincesLoading || wardsLoading
        ? copy.processing
        : null;

  const resetQuoteAndCoupon = useCallback(() => {
    invalidateQuote();
    quoteCreationStatusRef.current = "idle";
    setQuote(null);
    setPaymentView("method");
    setQrFailed(false);
    setExpired(false);
    setCouponErrorCode(null);
    setCouponSummary(null);
    setCouponInput("");
    setAppliedCouponCode(null);
    setCouponAction(null);
    couponActionRef.current = null;
  }, [invalidateQuote]);

  const clearQuoteForPayment = useCallback(() => {
    invalidateQuote();
    quoteCreationStatusRef.current = "idle";
    setQuote(null);
    setQrFailed(false);
    setExpired(false);
    setCouponAction(null);
    couponActionRef.current = null;
  }, [invalidateQuote]);

  const expireQuote = useCallback(
    (hadCoupon: boolean) => {
      invalidateQuote();
      quoteCreationStatusRef.current = "idle";
      setQuote(null);
      setQrFailed(false);
      setCouponAction(null);
      couponActionRef.current = null;
      if (hadCoupon) {
        setAppliedCouponCode(null);
        setCouponErrorCode(couponQuoteExpiredCode);
        setCouponSummary(null);
        setExpired(false);
      } else {
        setExpired(paymentView === "qr");
        if (paymentView === "method") setErrorKey("quoteExpired");
      }
    },
    [invalidateQuote, paymentView],
  );

  useEffect(() => {
    if (previousProfileRefreshVersion.current === profileRefreshVersion) return;
    previousProfileRefreshVersion.current = profileRefreshVersion;
    setProfileIncomplete(false);
  }, [profileRefreshVersion]);

  useEffect(() => {
    savePurchase((current) => ({
      identity: user?.sub ?? null,
      step,
      packages,
      packagesLocale,
      packagesState,
      user,
      sessionReady,
      provinces,
      provincesLocale,
      wards,
      wardsResourceKey,
      selectedPackageId,
      selectedOptionId,
      selectedPlanId,
      paymentView,
      quoteTarget,
      appliedCouponCode,
      guest,
      termsAccepted,
      acceptedTermIds,
      informationSubmitted,
      termsSubmitted,
      profileIncomplete,
      errorKey,
      confirmed: confirmed || current?.confirmed || false,
      qrFailed,
      expired,
      quote:
        quote ??
        (quoteCreationStatusRef.current === "success"
          ? (current?.quote ?? null)
          : null),
      couponInput,
      couponErrorCode,
      couponSummary,
      // A creation response can arrive at the provider while a locale route is remounting.
      purchase: purchase ?? current?.purchase ?? null,
    }));
  }, [
    confirmed,
    paymentView,
    quoteTarget,
    appliedCouponCode,
    couponInput,
    couponErrorCode,
    couponSummary,
    errorKey,
    expired,
    guest,
    informationSubmitted,
    packages,
    packagesLocale,
    packagesState,
    profileIncomplete,
    provinces,
    provincesLocale,
    purchase,
    quote,
    qrFailed,
    savePurchase,
    selectedOptionId,
    selectedPlanId,
    selectedPackageId,
    sessionReady,
    step,
    acceptedTermIds,
    termsAccepted,
    termsSubmitted,
    user,
    wards,
    wardsResourceKey,
  ]);

  useEffect(() => {
    if (!purchase && purchaseMemory?.purchase) {
      setPurchase(purchaseMemory.purchase);
      setStep(4);
    }
  }, [purchase, purchaseMemory?.purchase]);

  useEffect(() => {
    if (!quote && quoteCreation.status === "success" && purchaseMemory?.quote) {
      if (couponActionRef.current === "remove") {
        invalidateQuote();
        setQuote(null);
        setPaymentView("method");
        return;
      }
      setQuote(purchaseMemory.quote);
      setPaymentView(quoteTarget);
      setAppliedCouponCode(purchaseMemory.quote.coupon?.code ?? null);
      setStep(4);
    }
  }, [
    invalidateQuote,
    purchaseMemory?.quote,
    quote,
    quoteCreation.status,
    quoteTarget,
  ]);

  useEffect(() => {
    if (quote?.coupon) {
      setCouponSummary({
        payment_summary: quote.payment_summary,
        coupon: quote.coupon,
      });
    }
  }, [quote]);

  useEffect(() => {
    if (!quote && restoreCouponFocus.current) {
      restoreCouponFocus.current = false;
      document
        .getElementById("csa-coupon-code")
        ?.focus({ preventScroll: true });
    }
  }, [quote]);

  useEffect(() => {
    if (purchaseMemory?.confirmed && !confirmed) setConfirmed(true);
    if (purchaseMemory?.expired && !expired) setExpired(true);
  }, [confirmed, expired, purchaseMemory?.confirmed, purchaseMemory?.expired]);

  useEffect(() => {
    if (
      quoteCreation.status !== "error" ||
      handledQuoteErrorRef.current === quoteCreation
    )
      return;
    handledQuoteErrorRef.current = quoteCreation;
    setPaymentView("method");
    const failedCouponAction = couponActionRef.current;
    if (
      failedCouponAction ||
      (quoteTarget === "method" &&
        couponInput &&
        (quoteCreation.error.code.startsWith("coupon_") ||
          [paymentQuoteExpiredCode, "csa_payment_quote_unavailable"].includes(
            quoteCreation.error.code,
          )))
    ) {
      couponActionRef.current = null;
      setCouponErrorCode(quoteCreation.error.code);
      setCouponAction(null);
      setAppliedCouponCode(null);
      setCouponSummary(null);
      if (failedCouponAction === "apply") setCouponInput("");
      invalidateQuote();
      return;
    }
    const creationError = new AccountApiError(
      quoteCreation.error.code,
      quoteCreation.error.status,
    );
    if (creationError.code === "csa_purchase_auth_account_incomplete") {
      setProfileIncomplete(true);
      setStep(2);
    } else if (
      creationError.code.startsWith("coupon_") ||
      (appliedCouponCode && creationError.code === "csa_payment_quote_expired")
    ) {
      setCouponErrorCode(creationError.code);
      setAppliedCouponCode(null);
      setCouponSummary(null);
      if (creationError.code.startsWith("coupon_")) setCouponInput("");
    } else {
      setErrorKey(purchaseErrorKey(creationError));
    }
  }, [
    appliedCouponCode,
    couponInput,
    invalidateQuote,
    quoteCreation,
    quoteTarget,
  ]);

  useEffect(() => {
    if (quoteCreation.status === "success" && couponAction) {
      couponActionRef.current = null;
      setCouponErrorCode(null);
      setCouponAction(null);
    }
  }, [quoteCreation.status, couponAction]);

  useEffect(() => {
    if (
      confirmation.status !== "error" ||
      handledConfirmationErrorRef.current === confirmation
    )
      return;
    handledConfirmationErrorRef.current = confirmation;
    if (confirmation.error.code === "csa_purchase_request_expired") {
      resetQuoteAndCoupon();
      setPaymentView("qr");
      setExpired(true);
      return;
    }
    if (confirmation.error.code === "csa_payment_quote_expired") {
      if (quote) expireQuote(Boolean(quote.coupon));
      return;
    }
    setErrorKey(
      purchaseErrorKey(
        new AccountApiError(confirmation.error.code, confirmation.error.status),
      ),
    );
  }, [confirmation, expireQuote, quote, resetQuoteAndCoupon]);

  useEffect(() => {
    if (!quote || confirmed || expired || !quote.expires_at) return;
    const expiresAt = Date.parse(quote.expires_at);
    if (!Number.isFinite(expiresAt)) return;
    let timer: number;
    const schedule = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        // Confirmation may have reached the server. Keep its token and response
        // until the result is known, including a safe retry after a timeout.
        if (confirming || confirmation.status === "error") return;
        expireQuote(Boolean(quote.coupon));
        return;
      }
      timer = window.setTimeout(schedule, Math.min(remaining, 2_147_483_647));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [confirmed, confirming, confirmation.status, expired, expireQuote, quote]);

  useEffect(() => {
    const previous = previousNavigationRef.current;
    if (
      previous.step !== activeWizardStep ||
      previous.paymentView !== paymentView
    ) {
      previousNavigationRef.current = { step: activeWizardStep, paymentView };
      const frame = window.requestAnimationFrame(() => {
        stepScrollFrameRef.current = null;
        const heading = stepHeadingRef.current;
        const scrollTarget = progressRef.current;
        if (!heading || !scrollTarget) return;
        scrollTarget.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
        heading.focus({ preventScroll: true });
      });
      stepScrollFrameRef.current = frame;
    }
    return () => {
      if (stepScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(stepScrollFrameRef.current);
        stepScrollFrameRef.current = null;
      }
    };
  }, [activeWizardStep, paymentView]);

  function focusFirstInvalidField(fallbackSelector?: string) {
    if (stepScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(stepScrollFrameRef.current);
      stepScrollFrameRef.current = null;
    }
    const frame = window.requestAnimationFrame(() => {
      stepScrollFrameRef.current = null;
      const panel = stepHeadingRef.current?.closest(".main-panel");
      const field = panel?.querySelector<HTMLElement>(
        ['[aria-invalid="true"]', fallbackSelector].filter(Boolean).join(", "),
      );
      if (!field) return;
      field.scrollIntoView({
        behavior: "auto",
        block: "center",
      });
      field.focus({ preventScroll: true });
    });
    stepScrollFrameRef.current = frame;
  }

  const loadPackages = useCallback(async () => {
    if (packageRequest.current?.locale === locale) return;
    packageRequest.current?.controller.abort();
    const controller = new AbortController();
    const sequence = ++packageSequence.current;
    packageRequest.current = { sequence, locale, controller };
    const isCurrent = () =>
      packageRequest.current?.sequence === sequence &&
      !controller.signal.aborted &&
      currentLocale.current === locale;
    setPackagesState("loading");
    try {
      const allPackages: MembershipPackage[] = [];
      let page = 1;
      while (true) {
        const payload = await accountApi<MembershipPackage[], PaginationMeta>(
          `membership-packages?page=${page}&locale=${locale}`,
          { signal: controller.signal },
        );
        if (!isCurrent()) return;
        const meta = payload.meta;
        if (
          !Array.isArray(payload.data) ||
          !meta ||
          meta.page !== page ||
          !Number.isSafeInteger(meta.page_size) ||
          meta.page_size <= 0 ||
          !Number.isSafeInteger(meta.total) ||
          meta.total < 0 ||
          payload.data.length > meta.page_size
        ) {
          throw new Error("Invalid package pagination response");
        }
        allPackages.push(...payload.data);
        if (page * meta.page_size >= meta.total) {
          if (allPackages.length < meta.total)
            throw new Error("Incomplete package pagination response");
          break;
        }
        if (payload.data.length === 0)
          throw new Error("Incomplete package pagination response");
        page += 1;
      }
      const selection = firstAvailableSelection(allPackages);
      const previousSelection = selectionRef.current;
      const currentPackage = allPackages.find(
        (item) =>
          item.id === previousSelection.packageId &&
          item.is_active !== false &&
          activePriceOptions(item).length > 0,
      );
      const packageId = currentPackage?.id ?? selection.packageId;
      const packageForOptions = allPackages.find(
        (item) => item.id === packageId,
      );
      const options = packageForOptions
        ? activePriceOptions(packageForOptions)
        : [];
      const optionId = options.some(
        (option) => option.id === previousSelection.optionId,
      )
        ? previousSelection.optionId
        : (options[0]?.id ?? "");
      const optionForPlans = options.find((option) => option.id === optionId);
      const plans = optionForPlans ? validPaymentPlans(optionForPlans) : [];
      const planId = plans.some((plan) => plan.id === previousSelection.planId)
        ? previousSelection.planId
        : (plans[0]?.id ??
          (optionForPlans?.duration_months === 1
            ? SINGLE_MONTH_FULL_PAYMENT_ID
            : ""));
      if (
        previousSelection.packageId &&
        (packageId !== previousSelection.packageId ||
          optionId !== previousSelection.optionId ||
          planId !== previousSelection.planId)
      ) {
        resetQuoteAndCoupon();
      }
      setPackages(allPackages);
      setPackagesLocale(locale);
      setSelectedPackageId(packageId);
      setSelectedOptionId(optionId);
      setSelectedPlanId(planId);
      setPackagesState("ready");
    } catch {
      if (isCurrent()) {
        setPackages([]);
        setPackagesState("error");
      }
    } finally {
      if (isCurrent()) packageRequest.current = null;
    }
  }, [locale, resetQuoteAndCoupon]);

  useEffect(
    () => () => {
      packageSequence.current += 1;
      packageRequest.current?.controller.abort();
      packageRequest.current = null;
    },
    [locale],
  );

  const loadWards = useCallback(
    async (provinceCode: string) => {
      if (!provinceCode) return;
      const resourceKey = `${locale}:${provinceCode}`;
      if (wardRequest.current?.resourceKey === resourceKey) return;
      wardRequest.current?.controller.abort();
      const controller = new AbortController();
      const sequence = ++wardSequence.current;
      wardRequest.current = { sequence, resourceKey, controller };
      setWards([]);
      setWardsResourceKey("");
      setWardsLoading(true);
      const isCurrent = () =>
        wardRequest.current?.sequence === sequence &&
        !controller.signal.aborted &&
        currentWardSelection.current.locale === locale &&
        currentWardSelection.current.provinceCode === provinceCode;
      try {
        const payload = await accountApi<AdministrativeUnit[]>(
          `administrative-wards?province=${encodeURIComponent(provinceCode)}`,
          { headers: { "Accept-Language": locale }, signal: controller.signal },
        );
        if (isCurrent()) setWards(payload.data);
      } catch {
        if (isCurrent()) setWards([]);
      } finally {
        if (isCurrent()) {
          wardRequest.current = null;
          setWardsResourceKey(resourceKey);
          setWardsLoading(false);
        }
      }
    },
    [locale],
  );

  useEffect(
    () => () => {
      wardSequence.current += 1;
      wardRequest.current?.controller.abort();
      wardRequest.current = null;
    },
    [],
  );

  useEffect(() => {
    if (confirmed) return;
    if (packagesLocale !== locale) {
      void loadPackages();
    }
  }, [confirmed, loadPackages, locale, packagesLocale]);

  useEffect(() => {
    if (confirmed) return;
    const headers = { "Accept-Language": locale };
    if (provincesLocale !== locale) {
      const controller = new AbortController();
      let active = true;
      setProvincesLoading(true);
      void accountApi<AdministrativeUnit[]>("administrative-provinces", {
        headers,
        signal: controller.signal,
      })
        .then((payload) => {
          if (active) {
            setProvinces(payload.data);
            setProvincesLocale(locale);
          }
        })
        .catch(() => {
          if (active) setProvinces([]);
        })
        .finally(() => {
          if (active) setProvincesLoading(false);
        });
      return () => {
        active = false;
        controller.abort();
      };
    }
  }, [confirmed, locale, provincesLocale]);

  useEffect(() => {
    if (confirmed) return;
    if (!guest.province_code) return;
    if (wardsResourceKey === `${locale}:${guest.province_code}`) return;
    void loadWards(guest.province_code);
  }, [confirmed, guest.province_code, loadWards, locale, wardsResourceKey]);

  const availablePackages = useMemo(
    () =>
      packagesState === "ready"
        ? packages.filter((item) => item.is_active !== false)
        : [],
    [packages, packagesState],
  );
  const orderedProvinces = useMemo(
    () => sortAdministrativeUnits(provinces, locale),
    [locale, provinces],
  );
  const orderedWards = useMemo(
    () => sortAdministrativeUnits(wards, locale),
    [locale, wards],
  );
  const selectedPackage = useMemo(
    () => availablePackages.find((item) => item.id === selectedPackageId),
    [availablePackages, selectedPackageId],
  );
  const availableOptions = useMemo(
    () => (selectedPackage ? activePriceOptions(selectedPackage) : []),
    [selectedPackage],
  );
  const selectedOption = availableOptions.find(
    (item) => item.id === selectedOptionId,
  );
  const availablePlans = selectedOption
    ? validPaymentPlans(selectedOption)
    : [];
  const displayPlans = plansForOption(selectedOption, availablePlans);
  const selectedPlan = displayPlans.find((item) => item.id === selectedPlanId);
  const normalizedPhone = normalizeVietnamPhone(guest.phone);
  const phoneHasValue = Boolean(guest.phone.trim());
  const phoneInvalid = phoneHasValue && !normalizedPhone;
  const phoneHasError =
    phoneInvalid || (informationSubmitted && !normalizedPhone);
  const guestComplete = Boolean(
    guest.name.trim() &&
    normalizedPhone &&
    guest.province_code &&
    guest.ward_code &&
    guest.address.trim(),
  );
  const packageComplete = Boolean(selectedPackage && selectedOption);
  const informationComplete = Boolean(sessionReady && (user || guestComplete));
  const canCreate = Boolean(
    packageComplete && informationComplete && termsAccepted && !creating,
  );

  function updateGuest(update: (current: CSAGuestDetails) => CSAGuestDetails) {
    resetQuoteAndCoupon();
    setGuest(update);
  }

  async function selectProvince(provinceCode: string) {
    resetQuoteAndCoupon();
    currentWardSelection.current = { locale, provinceCode };
    wardRequest.current?.controller.abort();
    wardRequest.current = null;
    wardSequence.current += 1;
    setGuest((current) => ({
      ...current,
      province_code: provinceCode,
      ward_code: "",
    }));
    setWards([]);
    setWardsResourceKey("");
    setWardsLoading(Boolean(provinceCode));
    if (provinceCode) await loadWards(provinceCode);
  }

  function createQuote(
    planOverride?: CSAPaymentPlan,
    couponCode?: string | null,
    action: "apply" | "remove" | null = null,
  ) {
    if (creating || confirming || (!action && couponBlocksContinue)) return;
    const expectedCouponCode =
      couponCode === undefined
        ? couponInput.trim().toUpperCase() || appliedCouponCode
        : couponCode;
    if (quote) clearQuoteForPayment();
    couponActionRef.current = action;
    setCouponAction(action);
    setQuoteTarget(action ? paymentMethodView : paymentQRView);
    if (!action) setCouponErrorCode(null);
    setTermsSubmitted(true);
    setErrorKey(null);
    setProfileIncomplete(false);
    const plan = planOverride ?? selectedPlan;
    if (
      !packageComplete ||
      !informationComplete ||
      !termsAccepted ||
      !selectedPackage ||
      !selectedOption ||
      !plan
    )
      return;
    const guestIdentity = user
      ? null
      : {
          name: guest.name.trim(),
          phone: normalizedPhone,
          province_code: guest.province_code,
          ward_code: guest.ward_code,
          address: guest.address.trim(),
        };
    setStep(4);
    startQuoteCreation(
      user?.sub ?? null,
      () =>
        accountApi<CSAPaymentQuote>("csa-payment-quotes", {
          method: "POST",
          body: JSON.stringify({
            package_id: selectedPackage.id,
            price_option_id: selectedOption.id,
            ...(plan.id !== SINGLE_MONTH_FULL_PAYMENT_ID
              ? { payment_plan_id: plan.id }
              : {}),
            terms_accepted: true,
            terms_locale: locale,
            ...(expectedCouponCode ? { coupon_code: expectedCouponCode } : {}),
            ...(guestIdentity ? { guest_identity: guestIdentity } : {}),
          }),
        }).then((payload) => {
          if (
            !isPaymentQuote(payload.data, plan) ||
            !buildVietQRUrl(payload.data) ||
            (payload.data.coupon &&
              positiveInteger(
                payload.data.payment_summary.contract_total_before_discount ??
                  "",
              ) !== positiveInteger(selectedOption.total_price_vnd)) ||
            (expectedCouponCode
              ? payload.data.coupon?.code !== expectedCouponCode
              : Boolean(payload.data.coupon))
          )
            throw new AccountApiError("csa_payment_quote_unavailable", 502);
          if (Date.parse(payload.data.expires_at) <= Date.now())
            throw new AccountApiError(
              expectedCouponCode
                ? couponQuoteExpiredCode
                : paymentQuoteExpiredCode,
              409,
            );
          return payload.data;
        }),
    );
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponErrorCode("coupon_required");
      return;
    }
    if (!selectedPlan || creating) return;
    clearQuoteForPayment();
    setCouponInput(code);
    createQuote(selectedPlan, code, "apply");
  }

  function removeCoupon() {
    if (!selectedPlan || creating) return;
    clearQuoteForPayment();
    setCouponInput("");
    setAppliedCouponCode(null);
    setCouponSummary(null);
    createQuote(selectedPlan, null, "remove");
  }

  function changeCouponInput(value: string) {
    if (quote) restoreCouponFocus.current = true;
    if (quote || creating) clearQuoteForPayment();
    setCouponInput(value);
    setAppliedCouponCode(null);
    setCouponSummary(null);
    setCouponErrorCode(null);
  }

  function setTermAccepted(termId: string, accepted: boolean) {
    setAcceptedTermIds((current) => {
      if (accepted) {
        return current.includes(termId) ? current : [...current, termId];
      }
      return current.filter((id) => id !== termId);
    });
  }

  function setAllTermsAccepted(accepted: boolean) {
    setAcceptedTermIds(accepted ? [...CSA_AGREEMENT_TERM_IDS] : []);
  }

  function submitWizard(event: React.FormEvent) {
    event.preventDefault();
    setErrorKey(null);
    if (step === 1) {
      if (packageComplete) {
        setStep(2);
      } else {
        focusFirstInvalidField(
          selectedPackageId
            ? ".csa-price-option-button:not(:disabled)"
            : ".csa-price-option-button:not(:disabled)",
        );
      }
      return;
    }
    if (step === 2) {
      setInformationSubmitted(true);
      if (informationComplete) {
        setStep(3);
      } else {
        focusFirstInvalidField();
      }
      return;
    }
    if (!termsAccepted) {
      setTermsSubmitted(true);
      focusFirstInvalidField('input[name="csa_program_term"]:not(:checked)');
      return;
    }
    setStep(4);
    setPaymentView("method");
  }

  function confirmPayment() {
    if (!quote || confirming || confirmed) return;
    const retryingUncertainConfirmation =
      confirmation.status === "error" &&
      !["csa_payment_quote_expired", "csa_purchase_request_expired"].includes(
        confirmation.error.code,
      );
    if (
      !retryingUncertainConfirmation &&
      quote.expires_at &&
      Date.parse(quote.expires_at) <= Date.now()
    ) {
      expireQuote(Boolean(quote.coupon));
      return;
    }
    setErrorKey(null);
    const guestIdentity = user
      ? null
      : {
          name: guest.name.trim(),
          phone: normalizedPhone,
          province_code: guest.province_code,
          ward_code: guest.ward_code,
          address: guest.address.trim(),
        };
    startConfirmation(user?.sub ?? null, () =>
      accountApi<CSAPurchaseRequestCreated>(
        "csa-purchase-requests/confirm-transfer",
        {
          method: "POST",
          body: JSON.stringify({
            quote_token: quote.quote_token,
            ...(guestIdentity ? { guest_identity: guestIdentity } : {}),
          }),
        },
      ).then((payload) => payload.data),
    );
  }

  async function copyPaymentValue(field: "account" | "content", value: string) {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
    } catch {
      setCopiedField(null);
    }
  }

  if (confirmed)
    return (
      <PurchaseChrome
        restored={restoredFromMemory}
        loadingMessage={loadingMessage}
      >
        <div className="wizard-layout">
          <WizardProgress
            current={5}
            locale={locale}
            progressRef={progressRef}
          />
          <section
            className="main-panel"
            aria-labelledby="purchase-success-title"
            aria-live="polite"
          >
            <div className="step" id="success-view">
              <div className="success">
                <div className="success-icon" aria-hidden="true">
                  ✓
                </div>
                <h2
                  className="step-heading"
                  id="purchase-success-title"
                  ref={stepHeadingRef}
                  tabIndex={-1}
                >
                  {copy.successTitle}
                </h2>
                <p>{copy.success}</p>
                {purchase ? (
                  <>
                    <div className="code">{purchase.request_code}</div>
                    <div>
                      <Link href={localizedPath(locale, "/csa/track")}>
                        {copy.trackLater}
                      </Link>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </PurchaseChrome>
    );

  if (step === 4 && paymentView === "qr" && (paymentExpired || !quote))
    return (
      <PurchaseChrome
        restored={restoredFromMemory}
        loadingMessage={loadingMessage}
      >
        <div className="wizard-layout">
          <WizardProgress
            current={4}
            locale={locale}
            progressRef={progressRef}
          />
          <section
            className="main-panel"
            aria-labelledby="payment-expired-title"
          >
            <div className="step payment-qr-state">
              <h2
                className="step-title step-heading"
                id="payment-expired-title"
                ref={stepHeadingRef}
                tabIndex={-1}
              >
                {copy.steps[3]}
              </h2>
              {confirmation.status === "error" && quote ? (
                <>
                  <p className="notice error" role="alert">
                    {copy.confirmationUncertain}
                  </p>
                  <div className="btn-row">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={confirmPayment}
                    >
                      {copy.retryConfirmation}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="notice error" role="alert">
                    {confirmation.status === "error" &&
                    confirmation.error.code === "csa_purchase_request_expired"
                      ? copy.requestExpired
                      : couponErrorCode
                        ? couponErrorCopy(couponErrorCode, copy)
                        : copy.quoteExpired}
                  </p>
                  <div className="btn-row">
                    {confirmation.status === "error" &&
                    confirmation.error.code ===
                      "csa_purchase_request_expired" ? (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={onReset}
                      >
                        {copy.newRequest}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => {
                          clearQuoteForPayment();
                          setPaymentView("method");
                        }}
                      >
                        {copy.previous}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </PurchaseChrome>
    );

  if (step === 4 && paymentView === "method") {
    return (
      <PurchaseChrome
        restored={restoredFromMemory}
        loadingMessage={loadingMessage}
      >
        <div className="wizard-layout">
          <WizardProgress
            current={4}
            locale={locale}
            progressRef={progressRef}
          />
          <section
            className="main-panel"
            aria-labelledby="payment-title"
            aria-busy={creating}
          >
            <div className="step payment-method-state">
              <h2
                className="step-title step-heading"
                id="payment-title"
                ref={stepHeadingRef}
                tabIndex={-1}
              >
                {copy.paymentPlanTitle}
              </h2>
              <div className="payment-amount-preview">
                <span>
                  {selectedPlan
                    ? copy.paymentAmountDue
                    : copy.paymentDurationTotal}
                </span>
                <strong>
                  {selectedPlan?.initial_payment_amount
                    ? formatMembershipMoney(
                        selectedPlan.initial_payment_amount,
                        locale,
                      )
                    : selectedOption
                      ? formatMembershipMoney(
                          selectedOption.total_price_vnd,
                          locale,
                        )
                      : "—"}
                </strong>
              </div>
              <PaymentPlanSection
                selectedOption={selectedOption}
                plans={displayPlans}
                selectedPlanId={selectedPlanId}
                locale={locale}
                copy={copy}
                disabled={Boolean(purchase) || creating}
                onSelect={(planId) => {
                  if (planId === selectedPlanId) return;
                  resetQuoteAndCoupon();
                  setErrorKey(null);
                  setSelectedPlanId(planId);
                }}
              />
              {selectedPlanId ? (
                <CouponControl
                  copy={copy}
                  code={couponInput}
                  appliedCode={appliedCouponCode}
                  error={couponErrorCopy(couponErrorCode, copy)}
                  busy={creating}
                  onChange={changeCouponInput}
                  onApply={applyCoupon}
                  onRemove={removeCoupon}
                />
              ) : null}
              {couponSummary && !paymentExpired ? (
                <CouponQuoteSummary
                  summary={couponSummary}
                  locale={locale}
                  copy={copy}
                />
              ) : null}
              {selectedPlanId && error && !creating ? (
                <p className="notice error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="btn-row payment-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setStep(3)}
                >
                  {copy.previous}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={
                    !canCreate ||
                    !selectedPlan ||
                    Boolean(loadingMessage) ||
                    couponBlocksContinue
                  }
                  onClick={() => createQuote()}
                >
                  {copy.next}
                </button>
              </div>
            </div>
          </section>
        </div>
      </PurchaseChrome>
    );
  }

  if (paymentView === "qr" && isPaymentQuote(quote) && step === 4) {
    const paymentPlan: CSAPaymentPlan = {
      id: "quote",
      name: "",
      payment_type: quote.payment_summary.payment_type,
      total_amount: quote.payment_summary.total_amount,
      installment_count: quote.payment_summary.installment_count,
      initial_payment_amount: quote.payment_summary.initial_payment_amount,
      installments: quote.payment_summary.installments,
    };
    const schedule = paymentPlan?.installments ?? [];
    const firstPayment = schedule.find((item) => item.sequence === 1);
    const initialAmount = positiveInteger(
      quote.payment_summary.initial_payment_amount,
    );
    const paymentSnapshotComplete = Boolean(
      paymentPlan &&
      (quote.coupon ||
        validPaymentPlan(paymentPlan, selectedOption?.duration_months ?? 0)) &&
      (!quote.coupon ||
        (selectedOption &&
          schedule.reduce((total, row) => total + row.cycle_count, 0) ===
            selectedOption.duration_months &&
          positiveInteger(
            quote.payment_summary.contract_total_before_discount ?? "",
          ) === positiveInteger(selectedOption.total_price_vnd))) &&
      positiveInteger(paymentPlan.total_amount) ===
        positiveInteger(quote.payment_summary.total_amount) &&
      firstPayment &&
      initialAmount !== null &&
      initialAmount === positiveInteger(firstPayment.amount) &&
      (quote.coupon ||
        paymentPlan.payment_type !== "full" ||
        initialAmount ===
          positiveInteger(quote.payment_summary.total_amount)) &&
      positiveInteger(firstPayment.amount) ===
        positiveInteger(quote.qr_payload.amount),
    );
    const qrUrl = paymentSnapshotComplete ? buildVietQRUrl(quote) : "";
    const bankDataComplete = Boolean(
      paymentSnapshotComplete &&
      quote.payment.bank_code &&
      quote.payment.bank_name &&
      quote.payment.account_number &&
      quote.payment.account_name &&
      quote.payment.amount &&
      quote.payment.transfer_content,
    );
    const paymentComplete = Boolean(bankDataComplete && qrUrl && !qrFailed);
    return (
      <PurchaseChrome
        restored={restoredFromMemory}
        loadingMessage={loadingMessage}
      >
        <div className="wizard-layout">
          <WizardProgress
            current={4}
            locale={locale}
            progressRef={progressRef}
          />
          <section
            className="main-panel"
            aria-labelledby="payment-title"
            aria-busy={confirming}
          >
            <div className="step payment-qr-state">
              <h2
                className="step-title step-heading"
                id="payment-title"
                ref={stepHeadingRef}
                tabIndex={-1}
              >
                {copy.steps[3]}
              </h2>
              {paymentComplete ? (
                <p className="step-desc">{copy.paymentIntro}</p>
              ) : null}
              <div className="payment-grid">
                <div className="payment-qr">
                  <h3 className="payment-qr-title">{copy.qrTitle}</h3>
                  {qrUrl && !qrFailed ? (
                    <div className="qr-wrap">
                      <div className="qr-image">
                        {/* The URL is generated exclusively from the validated backend QR payload. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="qr"
                          src={qrUrl}
                          alt={copy.qrAlt}
                          onError={() => setQrFailed(true)}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="qr-logo"
                          src="/images/logo-mark.png"
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="qr-wrap qr-unavailable"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="payment-information">
                  {bankDataComplete ? (
                    <>
                      <h3 className="payment-details-title">
                        {copy.paymentTitle}
                      </h3>
                      <dl className="bank-list">
                        <div className="bank-row">
                          <dt className="k">
                            {paymentPlan?.payment_type === "installment"
                              ? copy.initialPayment
                              : copy.paymentAmountDue}
                          </dt>
                          <dd className="v">
                            <strong>
                              {formatMembershipMoney(
                                quote.qr_payload.amount,
                                locale,
                              )}
                            </strong>
                          </dd>
                        </div>
                        <div className="bank-row">
                          <dt className="k">{copy.bank}</dt>
                          <dd className="v">
                            <strong>{quote.payment.bank_name}</strong>
                          </dd>
                        </div>
                        <div className="bank-row">
                          <dt className="k">{copy.accountNumber}</dt>
                          <dd className="v">
                            <strong>{quote.payment.account_number}</strong>
                            <button
                              className="copy"
                              type="button"
                              title={copy.copy}
                              onClick={() =>
                                void copyPaymentValue(
                                  "account",
                                  quote.payment.account_number,
                                )
                              }
                            >
                              <CopyIcon />
                              <span>
                                {copiedField === "account"
                                  ? copy.copied
                                  : copy.copy}
                              </span>
                            </button>
                          </dd>
                        </div>
                        <div className="bank-row">
                          <dt className="k">{copy.accountName}</dt>
                          <dd className="v">
                            <strong>{quote.payment.account_name}</strong>
                          </dd>
                        </div>
                        <div className="bank-row">
                          <dt className="k">{copy.transferContent}</dt>
                          <dd className="v">
                            <strong>{quote.payment.transfer_content}</strong>
                            <button
                              className="copy"
                              type="button"
                              title={copy.copy}
                              onClick={() =>
                                void copyPaymentValue(
                                  "content",
                                  quote.payment.transfer_content,
                                )
                              }
                            >
                              <CopyIcon />
                              <span>
                                {copiedField === "content"
                                  ? copy.copied
                                  : copy.copy}
                              </span>
                            </button>
                          </dd>
                        </div>
                      </dl>
                      {paymentPlan?.payment_type === "installment" &&
                      schedule.length > 0 ? (
                        <div className="payment-schedule">
                          <h4>{copy.paymentSchedule}</h4>
                          <ol>
                            {[...schedule]
                              .sort((a, b) => a.sequence - b.sequence)
                              .map((item, index, installments) => (
                                <li
                                  className="payment-schedule-row"
                                  key={item.sequence}
                                >
                                  <span className="payment-schedule-label">
                                    {copy.installmentNumber.replace(
                                      "{number}",
                                      String(item.sequence),
                                    )}
                                  </span>
                                  <strong className="payment-schedule-amount">
                                    {formatMembershipMoney(item.amount, locale)}
                                  </strong>
                                  <span className="payment-schedule-months">
                                    {installmentMonthsLabel(
                                      item.cycle_count,
                                      index,
                                      installments.length,
                                      copy,
                                    )}
                                  </span>
                                </li>
                              ))}
                          </ol>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {!paymentComplete ? (
                    <p className="notice error" role="alert">
                      {initialAmount === null
                        ? copy.initialPaymentMissing
                        : !paymentSnapshotComplete
                          ? copy.paymentSnapshotInvalid
                          : copy.paymentDataError}
                    </p>
                  ) : null}
                  {error ? (
                    <p className="notice error" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="btn-row payment-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={confirming}
                  onClick={() => {
                    clearQuoteForPayment();
                    setPaymentView("method");
                  }}
                >
                  {copy.previous}
                </button>
                {paymentComplete ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={confirming}
                    onClick={() => void confirmPayment()}
                  >
                    {copy.confirm}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </PurchaseChrome>
    );
  }

  return (
    <PurchaseChrome
      restored={restoredFromMemory}
      loadingMessage={loadingMessage}
    >
      <WizardProgress
        current={step}
        locale={locale}
        progressRef={progressRef}
      />
      <div className="wizard-layout">
        <form
          className={
            step === 1 ? "main-panel package-step-panel" : "main-panel"
          }
          onSubmit={submitWizard}
          noValidate
          aria-busy={
            creating ||
            packagesState === "loading" ||
            (step === 2 && !sessionReady)
          }
        >
          {step === 1 ? (
            <div className="step" aria-labelledby="purchase-package-title">
              <div className="package-section-head">
                <h2
                  className="step-heading"
                  id="purchase-package-title"
                  ref={stepHeadingRef}
                  tabIndex={-1}
                >
                  {copy.packageStepTitle}
                </h2>
                <p>{copy.packageStepDescription}</p>
              </div>
              {packagesState === "error" ? (
                <div className="notice error" role="alert">
                  <p>{copy.packagesError}</p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => void loadPackages()}
                  >
                    {copy.retry}
                  </button>
                </div>
              ) : null}
              {packagesState === "ready" && availablePackages.length === 0 ? (
                <p className="notice">{copy.packagesEmpty}</p>
              ) : null}
              <div
                className={[
                  "csa-package-list",
                  availablePackages.length === 1 && "is-single",
                  availablePackages.length === 2 && "is-pair",
                  availablePackages.length > 3 && "is-scrollable",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {availablePackages.map((item) => {
                  const options = activePriceOptions(item);
                  const oneMonthOption = options.find(
                    (option) => option.duration_months === 1,
                  );
                  const savings = options.map((option) =>
                    priceOptionSaving(option, oneMonthOption),
                  );
                  return (
                    <article
                      className={[
                        "csa-package-card",
                        selectedPackageId === item.id && "selected",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      data-package={item.id}
                      key={item.id}
                    >
                      <div className="csa-package-summary">
                        <div>
                          <h3>{item.name}</h3>
                          {item.description ? <p>{item.description}</p> : null}
                        </div>
                      </div>
                      <div className="csa-package-allocation">
                        <h4>{copy.packageProducts}</h4>
                        <ul>
                          {item.items.length ? (
                            item.items.map((product) => (
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
                            ))
                          ) : (
                            <li>
                              <span>{copy.noPackageProducts}</span>
                            </li>
                          )}
                        </ul>
                        <div className="csa-package-policy">
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 11v5M12 8h.01" />
                          </svg>
                          <p>
                            {getCsaQuotaPolicyText(locale, item.quota_policy)}
                          </p>
                        </div>
                      </div>
                      <div className="csa-package-price-options">
                        <h4>{copy.durationOptionsTitle}</h4>
                        <ul>
                          {options.map((option, index) => {
                            const saving = savings[index];
                            return (
                              <li
                                key={option.id}
                                className={
                                  selectedOptionId === option.id
                                    ? "selected"
                                    : undefined
                                }
                              >
                                <button
                                  className="csa-price-option-button"
                                  type="button"
                                  aria-pressed={selectedOptionId === option.id}
                                  disabled={Boolean(purchase)}
                                  onClick={() => {
                                    if (
                                      item.id === selectedPackageId &&
                                      option.id === selectedOptionId
                                    )
                                      return;
                                    resetQuoteAndCoupon();
                                    setSelectedPackageId(item.id);
                                    setSelectedOptionId(option.id);
                                    const plans = validPaymentPlans(option);
                                    setSelectedPlanId(
                                      plans.length === 1
                                        ? plans[0].id
                                        : option.duration_months === 1
                                          ? SINGLE_MONTH_FULL_PAYMENT_ID
                                          : "",
                                    );
                                  }}
                                >
                                  <span className="csa-price-option-heading">
                                    <strong>
                                      {durationLabel(option, copy)}
                                    </strong>
                                    <span className="csa-price-option-badges">
                                      {selectedOptionId === option.id ? (
                                        <span className="csa-selected-badge">
                                          {copy.selectedOption}
                                        </span>
                                      ) : null}
                                    </span>
                                  </span>
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
                                  {saving ? (
                                    <p className="csa-price-saving">
                                      {copy.savingAmount.replace(
                                        "{amount}",
                                        formatMembershipMoney(
                                          saving.amount,
                                          locale,
                                        ),
                                      )}
                                    </p>
                                  ) : null}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="btn-row">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!packageComplete}
                >
                  {copy.next}
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <section
              className="step"
              aria-labelledby="purchase-information-title"
            >
              <header>
                <h2
                  className="step-title step-heading"
                  id="purchase-information-title"
                  ref={stepHeadingRef}
                  tabIndex={-1}
                >
                  {copy.informationStepTitle}
                </h2>
                <p className="step-desc">{copy.informationStepDescription}</p>
              </header>
              {user ? (
                <div className="profile-box">
                  <div className="status-line">
                    <span className="badge ok">✓ {copy.signedInNote}</span>
                  </div>
                  <dl className="form-grid">
                    <div className="field">
                      <dt>{copy.name}</dt>
                      <dd>{user.name}</dd>
                    </div>
                    <div className="field">
                      <dt>{copy.email}</dt>
                      <dd>{user.email}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="csa-purchase-name">{copy.name}</label>
                    <input
                      id="csa-purchase-name"
                      value={guest.name}
                      onChange={(event) =>
                        updateGuest((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      autoComplete="name"
                      placeholder={copy.nameHint}
                      aria-invalid={informationSubmitted && !guest.name.trim()}
                      aria-describedby={describedBy(
                        informationSubmitted && !guest.name.trim(),
                        "csa-purchase-name-error",
                      )}
                      required
                    />
                    {informationSubmitted && !guest.name.trim() ? (
                      <small id="csa-purchase-name-error" role="alert">
                        {copy.required}
                      </small>
                    ) : null}
                  </div>
                  <div className="field">
                    <label htmlFor="csa-purchase-phone">{copy.phone}</label>
                    <input
                      id="csa-purchase-phone"
                      type="tel"
                      value={guest.phone}
                      onChange={(event) =>
                        updateGuest((current) => ({
                          ...current,
                          phone: event.target.value.replace(/(?!^\+)\D/g, ""),
                        }))
                      }
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={copy.phoneHint}
                      aria-invalid={phoneHasError}
                      aria-describedby={describedBy(
                        phoneHasError,
                        "csa-purchase-phone-error",
                      )}
                      required
                    />
                    {phoneHasError ? (
                      <small id="csa-purchase-phone-error" role="alert">
                        {copy.invalidPhone}
                      </small>
                    ) : null}
                  </div>
                  <div className="field">
                    <label htmlFor="csa-purchase-province">
                      {copy.province}
                    </label>
                    <select
                      id="csa-purchase-province"
                      value={guest.province_code}
                      onChange={(event) =>
                        void selectProvince(event.target.value)
                      }
                      aria-invalid={
                        informationSubmitted && !guest.province_code
                      }
                      aria-describedby={describedBy(
                        informationSubmitted && !guest.province_code,
                        "csa-purchase-province-error",
                      )}
                      required
                    >
                      <option value="">{copy.selectProvince}</option>
                      {orderedProvinces.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {informationSubmitted && !guest.province_code ? (
                      <small id="csa-purchase-province-error" role="alert">
                        {copy.required}
                      </small>
                    ) : null}
                  </div>
                  <div className="field">
                    <label htmlFor="csa-purchase-ward">{copy.ward}</label>
                    <select
                      id="csa-purchase-ward"
                      value={guest.ward_code}
                      onChange={(event) =>
                        updateGuest((current) => ({
                          ...current,
                          ward_code: event.target.value,
                        }))
                      }
                      disabled={
                        !guest.province_code ||
                        wardsLoading ||
                        wardsResourceKey !== `${locale}:${guest.province_code}`
                      }
                      aria-invalid={informationSubmitted && !guest.ward_code}
                      aria-describedby={describedBy(
                        informationSubmitted && !guest.ward_code,
                        "csa-purchase-ward-error",
                      )}
                      required
                    >
                      <option value="">{copy.selectWard}</option>
                      {(wardsResourceKey === `${locale}:${guest.province_code}`
                        ? orderedWards
                        : []
                      ).map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {informationSubmitted && !guest.ward_code ? (
                      <small id="csa-purchase-ward-error" role="alert">
                        {copy.required}
                      </small>
                    ) : null}
                  </div>
                  <div className="field full">
                    <label htmlFor="csa-purchase-address">{copy.address}</label>
                    <textarea
                      id="csa-purchase-address"
                      value={guest.address}
                      onChange={(event) =>
                        updateGuest((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      autoComplete="street-address"
                      placeholder={copy.addressHint}
                      aria-invalid={
                        informationSubmitted && !guest.address.trim()
                      }
                      aria-describedby={describedBy(
                        informationSubmitted && !guest.address.trim(),
                        "csa-purchase-address-error",
                      )}
                      rows={3}
                      required
                    />
                    {informationSubmitted && !guest.address.trim() ? (
                      <small id="csa-purchase-address-error" role="alert">
                        {copy.required}
                      </small>
                    ) : null}
                  </div>
                </div>
              )}
              {profileIncomplete ? (
                <div
                  className="notice error profile-incomplete-notice"
                  role="alert"
                >
                  <p className="profile-incomplete-notice-message">
                    {copy.profileIncomplete}
                  </p>
                  <a
                    className="btn btn-terra"
                    href={authAccountUrl}
                    onClick={onAuthAccount}
                  >
                    {copy.updateAccount}
                  </a>
                </div>
              ) : null}
              <div className="btn-row">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  {copy.previous}
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!informationComplete || profileIncomplete}
                >
                  {copy.next}
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="step" aria-labelledby="purchase-terms-title">
              <header>
                <h2
                  className="step-title step-heading"
                  id="purchase-terms-title"
                  ref={stepHeadingRef}
                  tabIndex={-1}
                >
                  {copy.termsStepTitle}
                </h2>
                <p className="step-desc">{copy.termsStepDescription}</p>
              </header>
              <div className="terms-reader">
                <div
                  className="terms-checklist"
                  role="group"
                  aria-describedby={
                    termsSubmitted && !termsAccepted ? termsErrorId : undefined
                  }
                >
                  {copy.terms.items.map((term, index) => {
                    const termId = CSA_AGREEMENT_TERM_IDS[index];
                    const isAccepted = acceptedTermIds.includes(termId);
                    return (
                      <div className="term-check-item" key={termId}>
                        <input
                          id={termId}
                          type="checkbox"
                          name="csa_program_term"
                          checked={isAccepted}
                          disabled={creating}
                          onChange={(event) =>
                            setTermAccepted(termId, event.target.checked)
                          }
                          aria-invalid={termsSubmitted && !isAccepted}
                          aria-describedby={
                            termsSubmitted && !isAccepted
                              ? termsErrorId
                              : undefined
                          }
                        />
                        <label htmlFor={termId}>{term}</label>
                      </div>
                    );
                  })}
                  <div className="term-check-item terms-check-all">
                    <input
                      id="csa-program-terms-all"
                      type="checkbox"
                      name="csa_program_terms_all"
                      checked={termsAccepted}
                      disabled={creating}
                      aria-controls={CSA_AGREEMENT_TERM_IDS.join(" ")}
                      onChange={(event) =>
                        setAllTermsAccepted(event.target.checked)
                      }
                    />
                    <label htmlFor="csa-program-terms-all">
                      {copy.termsCheckAll}
                    </label>
                  </div>
                </div>
                {termsSubmitted && !termsAccepted ? (
                  <small className="terms-error" id={termsErrorId} role="alert">
                    {copy.termsRequired}
                  </small>
                ) : null}
              </div>
              {error ? (
                <p className="notice error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="btn-row">
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={creating}
                  onClick={() => setStep(2)}
                >
                  {copy.previous}
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!canCreate}
                >
                  {copy.continue}
                </button>
              </div>
            </section>
          ) : null}
        </form>
      </div>
    </PurchaseChrome>
  );
}

function CSAPurchasePageContent({ locale }: { locale: Locale }) {
  const copy = getCSAPurchaseCopy(locale);
  const {
    purchase,
    clearPurchase,
    profileRefreshPending,
    markProfileRefreshPending,
    completeProfileRefresh,
  } = useCSAFlowState();
  const [session, setSession] = useState<
    | { status: "checking" | "error"; user: null }
    | { status: "ready"; user: CoreUser | null }
  >({ status: "checking", user: null });
  const [flowVersion, setFlowVersion] = useState(0);
  const [profileRefreshVersion, setProfileRefreshVersion] = useState(0);
  const [profileRefreshing, setProfileRefreshing] = useState(false);
  const profileRefreshPendingRef = useRef(profileRefreshPending);
  const profileRefreshInFlight = useRef(false);
  const currentSessionUser = useRef<CoreUser | null>(null);
  const purchaseRef = useRef(purchase);
  const mounted = useRef(true);
  const resetCompletedFlowOnEntry = useRef(
    documentWasReloaded && Boolean(purchase?.confirmed),
  );
  profileRefreshPendingRef.current = profileRefreshPending;
  currentSessionUser.current = session.user;
  purchaseRef.current = purchase;

  const readCurrentSession = useCallback(async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("session_unavailable");
    const payload = (await response.json()) as {
      data?: { user?: CoreUser | null };
    };
    return payload.data?.user ?? null;
  }, []);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const resetCompletedFlow = useCallback(() => {
    if (!purchaseRef.current?.confirmed) return;
    clearPurchase();
    setFlowVersion((current) => current + 1);
  }, [clearPurchase]);

  useEffect(() => {
    if (!resetCompletedFlowOnEntry.current) return;
    resetCompletedFlowOnEntry.current = false;
    resetCompletedFlow();
  }, [resetCompletedFlow]);

  useEffect(() => {
    let active = true;
    void readCurrentSession()
      .then((user) => {
        if (active) setSession({ status: "ready", user });
      })
      .catch(() => {
        if (active) setSession({ status: "error", user: null });
      });
    return () => {
      active = false;
    };
  }, [readCurrentSession]);

  const revalidateProfileAfterAuthAccount = useCallback(() => {
    if (!profileRefreshPendingRef.current || profileRefreshInFlight.current)
      return;
    profileRefreshInFlight.current = true;
    setProfileRefreshing(true);
    const expectedIdentity = currentSessionUser.current?.sub ?? null;
    void readCurrentSession()
      .then((user) => {
        if (!mounted.current) return;
        setSession({ status: "ready", user });
        if (user?.sub === expectedIdentity) {
          setProfileRefreshVersion((current) => current + 1);
        }
      })
      .catch(() => {
        // Keep the existing incomplete-profile notice when a fresh session
        // cannot confirm the account state.
      })
      .finally(() => {
        profileRefreshInFlight.current = false;
        if (mounted.current) setProfileRefreshing(false);
        profileRefreshPendingRef.current = false;
        if (mounted.current) completeProfileRefresh();
      });
  }, [completeProfileRefresh, readCurrentSession]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible")
        revalidateProfileAfterAuthAccount();
    };
    window.addEventListener("focus", revalidateProfileAfterAuthAccount);
    const onPageShow = (event: PageTransitionEvent) => {
      revalidateProfileAfterAuthAccount();
      if (event.persisted) resetCompletedFlow();
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", revalidateProfileAfterAuthAccount);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [resetCompletedFlow, revalidateProfileAfterAuthAccount]);

  const identity = session.user?.sub ?? null;
  const incompatible =
    session.status === "ready" &&
    purchase !== null &&
    purchase.identity !== identity;
  useEffect(() => {
    if (incompatible) clearPurchase();
  }, [clearPurchase, incompatible]);

  if (session.status !== "ready" || incompatible) {
    return (
      <PurchaseChrome
        loadingMessage={session.status === "checking" ? copy.processing : null}
      >
        {session.status === "error" ? (
          <p className="notice error" role="alert">
            {copy.genericError}
          </p>
        ) : null}
      </PurchaseChrome>
    );
  }

  return (
    <PurchaseLoadingSurface
      loadingMessage={profileRefreshing ? copy.processing : null}
    >
      <CSAPurchaseWizard
        key={`${locale}:${flowVersion}`}
        locale={locale}
        currentUser={session.user}
        profileRefreshVersion={profileRefreshVersion}
        onAuthAccount={markProfileRefreshPending}
        onReset={() => {
          clearPurchase();
          setFlowVersion((current) => current + 1);
        }}
      />
    </PurchaseLoadingSurface>
  );
}

export function CSAPurchasePage({ locale }: { locale: Locale }) {
  const { hasProvider } = useCSAFlowState();
  if (!hasProvider)
    return (
      <CSAFlowStateProvider>
        <CSAPurchasePageContent locale={locale} />
      </CSAFlowStateProvider>
    );
  return <CSAPurchasePageContent locale={locale} />;
}
