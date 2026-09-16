"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import { accountApi, AccountApiError } from "@/features/account/api";
import type {
  AdministrativeUnit,
  CSAPaymentQuote,
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
const SINGLE_MONTH_FULL_PAYMENT_ID = "__single_month_full__";

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

function durationLabel(option: MembershipPackagePriceOption, template: string) {
  return template.replace("{count}", String(option.duration_months));
}

function positiveInteger(value: string) {
  return /^[1-9]\d*(?:\.0+)?$/.test(value) ? BigInt(value.split(".")[0]) : null;
}

function isPaymentQuote(value: unknown): value is CSAPaymentQuote {
  if (!value || typeof value !== "object") return false;
  const quote = value as Record<string, unknown>;
  const payment = quote.payment as Record<string, unknown> | undefined;
  const summary = quote.payment_summary as Record<string, unknown> | undefined;
  const terms = quote.terms as Record<string, unknown> | undefined;
  const qr = quote.qr_payload as Record<string, unknown> | undefined;
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
    !positiveInteger(String(payment.amount)) ||
    !positiveInteger(String(summary.total_amount)) ||
    !positiveInteger(String(summary.initial_payment_amount)) ||
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
  const sequences = installments.map(
    (item) => (item as Record<string, unknown>).sequence,
  );
  if (
    installments.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        !Number.isSafeInteger((item as Record<string, unknown>).sequence) ||
        Number((item as Record<string, unknown>).sequence) < 1 ||
        !positiveInteger(String((item as Record<string, unknown>).amount)) ||
        !Number.isSafeInteger((item as Record<string, unknown>).cycle_count) ||
        Number((item as Record<string, unknown>).cycle_count) < 1,
    ) ||
    new Set(sequences).size !== sequences.length ||
    !sequences.includes(1) ||
    (summary.payment_type === "full" && installments.length !== 1) ||
    (summary.payment_type === "installment" && installments.length < 2)
  )
    return false;
  const installmentAmounts = installments.map((item) =>
    positiveInteger(String((item as Record<string, unknown>).amount)),
  );
  const totalAmount = positiveInteger(String(summary.total_amount));
  const initialAmount = positiveInteger(String(summary.initial_payment_amount));
  const qrAmount = positiveInteger(String(qr.amount));
  if (
    installmentAmounts.some((amount) => amount === null) ||
    totalAmount === null ||
    initialAmount === null ||
    qrAmount === null ||
    qrAmount !== initialAmount
  )
    return false;
  const validInstallmentAmounts = installmentAmounts as bigint[];
  const firstInstallmentIndex = sequences.findIndex(
    (sequence) => Number(sequence) === 1,
  );
  return (
    validInstallmentAmounts.reduce(
      (total, amount) => total + amount,
      BigInt(0),
    ) === totalAmount &&
    validInstallmentAmounts[firstInstallmentIndex] === initialAmount
  );
}

function priceOptionSaving(option: MembershipPackagePriceOption) {
  const monthlyPrice = positiveInteger(option.monthly_price_vnd);
  const selectedTotal = positiveInteger(option.total_price_vnd);
  if (
    monthlyPrice === null ||
    selectedTotal === null ||
    !Number.isSafeInteger(option.duration_months) ||
    option.duration_months <= 0
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

function PurchaseChrome({
  children,
  restored = false,
}: {
  children: React.ReactNode;
  restored?: boolean;
}) {
  return (
    <main
      className={["csa-ui", "csa-purchase-ui", restored && "csa-flow-restored"]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="shell">
        <div className="app-card">
          <div className="content">{children}</div>
        </div>
      </div>
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

function packageOptionClass(selected: boolean) {
  return ["package-option", selected && "selected"].filter(Boolean).join(" ");
}

function durationChoiceClass(selected: boolean) {
  return ["duration-choice", selected && "selected"].filter(Boolean).join(" ");
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
  const [termsAccepted, setTermsAccepted] = useState(
    initialMemory?.termsAccepted ?? false,
  );
  const [informationSubmitted, setInformationSubmitted] = useState(
    initialMemory?.informationSubmitted ?? false,
  );
  const [termsSubmitted, setTermsSubmitted] = useState(
    initialMemory?.termsSubmitted ?? false,
  );
  const creating = quoteCreation.status === "pending";
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
  const previousWizardStepRef = useRef<number>(activeWizardStep);

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
      guest,
      termsAccepted,
      informationSubmitted,
      termsSubmitted,
      profileIncomplete,
      errorKey,
      confirmed: confirmed || current?.confirmed || false,
      qrFailed,
      expired: expired || current?.expired || false,
      quote: quote ?? current?.quote ?? null,
      // A creation response can arrive at the provider while a locale route is remounting.
      purchase: purchase ?? current?.purchase ?? null,
    }));
  }, [
    confirmed,
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
    if (!quote && purchaseMemory?.quote) {
      setQuote(purchaseMemory.quote);
      setStep(4);
    }
  }, [purchaseMemory?.quote, quote]);

  useEffect(() => {
    if (purchaseMemory?.confirmed && !confirmed) setConfirmed(true);
    if (purchaseMemory?.expired && !expired) setExpired(true);
  }, [confirmed, expired, purchaseMemory?.confirmed, purchaseMemory?.expired]);

  useEffect(() => {
    if (quoteCreation.status !== "error") return;
    const creationError = new AccountApiError(
      quoteCreation.error.code,
      quoteCreation.error.status,
    );
    if (creationError.code === "csa_purchase_auth_account_incomplete") {
      setProfileIncomplete(true);
      setStep(2);
    } else {
      setErrorKey(purchaseErrorKey(creationError));
    }
  }, [quoteCreation]);

  useEffect(() => {
    if (confirmation.status !== "error") return;
    const confirmationError = new AccountApiError(
      confirmation.error.code,
      confirmation.error.status,
    );
    const key = purchaseErrorKey(confirmationError);
    if (key === "expired" || key === "quoteExpired") {
      setQuote(null);
      setExpired(true);
      savePurchase((current) =>
        current
          ? { ...current, quote: null, qrFailed: false, expired: true }
          : current,
      );
      return;
    }
    setErrorKey(key);
  }, [confirmation, savePurchase]);

  useEffect(() => {
    if (!quote || confirmed || expired || !quote.expires_at) return;
    const expiresAt = Date.parse(quote.expires_at);
    if (!Number.isFinite(expiresAt)) return;
    let timer: number;
    const schedule = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setQuote(null);
        savePurchase((current) =>
          current
            ? { ...current, quote: null, qrFailed: false, expired: true }
            : current,
        );
        setExpired(true);
        return;
      }
      timer = window.setTimeout(schedule, Math.min(remaining, 2_147_483_647));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [confirmed, expired, quote, savePurchase]);

  useEffect(() => {
    if (previousWizardStepRef.current !== activeWizardStep) {
      previousWizardStepRef.current = activeWizardStep;
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
  }, [activeWizardStep]);

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
  }, [locale]);

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
      void accountApi<AdministrativeUnit[]>("administrative-provinces", {
        headers,
      })
        .then((payload) => {
          setProvinces(payload.data);
          setProvincesLocale(locale);
        })
        .catch(() => setProvinces([]));
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
  const packageComplete = Boolean(
    selectedPackage && selectedOption && selectedPlan,
  );
  const informationComplete = Boolean(sessionReady && (user || guestComplete));
  const canCreate = Boolean(
    packageComplete && informationComplete && termsAccepted && !creating,
  );

  function clearQuoteForSelection() {
    if (!quote) return;
    setQuote(null);
    setQrFailed(false);
    setExpired(false);
    savePurchase((current) =>
      current
        ? { ...current, quote: null, qrFailed: false, expired: false }
        : current,
    );
  }

  function updateGuest(update: (current: CSAGuestDetails) => CSAGuestDetails) {
    clearQuoteForSelection();
    setGuest(update);
  }

  async function selectProvince(provinceCode: string) {
    clearQuoteForSelection();
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

  function createQuote() {
    setTermsSubmitted(true);
    setErrorKey(null);
    setProfileIncomplete(false);
    if (!canCreate || !selectedPackage || !selectedOption || !selectedPlan)
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
    startQuoteCreation(user?.sub ?? null, () =>
      accountApi<CSAPaymentQuote>("csa-payment-quotes", {
        method: "POST",
        body: JSON.stringify({
          package_id: selectedPackage.id,
          price_option_id: selectedOption.id,
          ...(selectedPlan.id !== SINGLE_MONTH_FULL_PAYMENT_ID
            ? { payment_plan_id: selectedPlan.id }
            : {}),
          terms_accepted: true,
          terms_locale: locale,
          ...(guestIdentity ? { guest_identity: guestIdentity } : {}),
        }),
      }).then((payload) => {
        if (!isPaymentQuote(payload.data))
          throw new AccountApiError("csa_payment_quote_unavailable", 502);
        return payload.data;
      }),
    );
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
            ? ".duration-choice:not(:disabled)"
            : ".package-option:not(:disabled)",
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
      focusFirstInvalidField();
      return;
    }
    if (quote || purchase) {
      setStep(4);
      return;
    }
    createQuote();
  }

  function confirmPayment() {
    if (!quote || confirming || confirmed || paymentExpired) return;
    if (quote.expires_at && Date.parse(quote.expires_at) <= Date.now()) {
      setQuote(null);
      savePurchase((current) =>
        current
          ? { ...current, quote: null, qrFailed: false, expired: true }
          : current,
      );
      setExpired(true);
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
      <PurchaseChrome restored={restoredFromMemory}>
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

  if (step === 4 && paymentExpired)
    return (
      <PurchaseChrome restored={restoredFromMemory}>
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
            <div className="step">
              <h2
                className="step-title step-heading"
                id="payment-expired-title"
                ref={stepHeadingRef}
                tabIndex={-1}
              >
                {copy.steps[3]}
              </h2>
              <p className="notice error" role="alert">
                {copy.quoteExpired}
              </p>
              <div className="btn-row">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={onReset}
                >
                  {copy.newRequest}
                </button>
              </div>
            </div>
          </section>
        </div>
      </PurchaseChrome>
    );

  if (step === 4 && !isPaymentQuote(quote)) {
    return (
      <PurchaseChrome restored={restoredFromMemory}>
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
            <div className="step">
              <h2
                className="step-title step-heading"
                id="payment-title"
                ref={stepHeadingRef}
                tabIndex={-1}
              >
                {copy.steps[3]}
              </h2>
              {creating ? (
                <p className="notice" role="status" aria-live="polite">
                  {copy.creatingQuote}
                </p>
              ) : (
                <>
                  <p className="notice error" role="alert">
                    {error || copy.quoteUnavailable}
                  </p>
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
                      disabled={!canCreate}
                      onClick={createQuote}
                    >
                      {copy.recreateQuote}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </PurchaseChrome>
    );
  }

  if (isPaymentQuote(quote) && step === 4) {
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
      validPaymentPlan(paymentPlan, selectedOption?.duration_months ?? 0) &&
      positiveInteger(paymentPlan.total_amount) ===
        positiveInteger(quote.payment_summary.total_amount) &&
      firstPayment &&
      initialAmount !== null &&
      initialAmount === positiveInteger(firstPayment.amount) &&
      (paymentPlan.payment_type !== "full" ||
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
      <PurchaseChrome restored={restoredFromMemory}>
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
            <div className="step">
              <h2
                className="step-title step-heading"
                id="payment-title"
                ref={stepHeadingRef}
                tabIndex={-1}
              >
                {copy.steps[3]}
              </h2>
              {paymentSnapshotComplete ? (
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
                                quote.payment_summary.initial_payment_amount,
                                locale,
                              )}
                            </strong>
                            {paymentPlan?.payment_type === "full" ? (
                              <small>
                                {copy.entirePackage.replace(
                                  "{count}",
                                  String(selectedOption?.duration_months ?? 0),
                                )}
                              </small>
                            ) : null}
                          </dd>
                        </div>
                        {paymentPlan?.payment_type === "installment" ? (
                          <>
                            <div className="bank-row">
                              <dt className="k">{copy.packageValue}</dt>
                              <dd className="v">
                                {formatMembershipMoney(
                                  quote.payment_summary.total_amount,
                                  locale,
                                )}
                              </dd>
                            </div>
                          </>
                        ) : null}
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
                  onClick={() => setStep(3)}
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
                    {confirming ? copy.confirming : copy.confirm}
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
    <PurchaseChrome restored={restoredFromMemory}>
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
              {packagesState === "loading" ? (
                <p className="notice" role="status" aria-live="polite">
                  {copy.packagesLoading}
                </p>
              ) : null}
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
              <div className="package-choice-grid">
                <div className="package-list">
                  {availablePackages.map((item) => {
                    const firstOption = activePriceOptions(item)[0];
                    const packageDisabled = !firstOption;
                    return (
                      <button
                        className={packageOptionClass(
                          selectedPackageId === item.id,
                        )}
                        type="button"
                        data-package={item.id}
                        aria-pressed={selectedPackageId === item.id}
                        disabled={packageDisabled || Boolean(purchase)}
                        key={item.id}
                        onClick={() => {
                          clearQuoteForSelection();
                          setSelectedPackageId(item.id);
                          setSelectedOptionId(firstOption?.id ?? "");
                          setSelectedPlanId(
                            firstOption
                              ? (validPaymentPlans(firstOption)[0]?.id ??
                                  (firstOption.duration_months === 1
                                    ? SINGLE_MONTH_FULL_PAYMENT_ID
                                    : ""))
                              : "",
                          );
                        }}
                      >
                        <span className="package-state" aria-hidden="true">
                          ✓
                        </span>
                        <span className="package-main">
                          <span className="package-title-row">
                            <strong>{item.name}</strong>
                          </span>
                          {item.description ? (
                            <span className="package-desc">
                              {item.description}
                            </span>
                          ) : null}
                          <span className="package-meta">
                            {item.items.length ? (
                              item.items.map((product) => (
                                <span key={product.product_id}>
                                  {product.product_name}
                                  <b>
                                    {formatMembershipUnits(
                                      product.unit_size,
                                      product.quota_units,
                                      locale,
                                    )}{" "}
                                    {membershipUnitLabel(locale, product)}
                                  </b>
                                </span>
                              ))
                            ) : (
                              <span>{copy.noPackageProducts}</span>
                            )}
                          </span>
                          <span className="package-policy">
                            {getCsaQuotaPolicyText(locale, item.quota_policy)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="duration-panel">
                  <div className="duration-head">
                    <h3>{copy.registrationDuration}</h3>
                    <p>{selectedPackage?.name ?? "—"}</p>
                  </div>
                  <div className="duration-list">
                    <div className="duration-list-head" aria-hidden="true">
                      <span>{copy.durationColumn}</span>
                      <span>{copy.monthlyPrice}</span>
                      <span>{copy.totalPrice}</span>
                    </div>
                    {availableOptions.map((option) => {
                      const saving = priceOptionSaving(option);
                      return (
                        <button
                          className={durationChoiceClass(
                            selectedOptionId === option.id,
                          )}
                          type="button"
                          data-months={option.duration_months}
                          aria-pressed={selectedOptionId === option.id}
                          disabled={Boolean(purchase)}
                          key={option.id}
                          onClick={() => {
                            clearQuoteForSelection();
                            setSelectedOptionId(option.id);
                            setSelectedPlanId(
                              validPaymentPlans(option)[0]?.id ??
                                (option.duration_months === 1
                                  ? SINGLE_MONTH_FULL_PAYMENT_ID
                                  : ""),
                            );
                          }}
                        >
                          <span className="duration-term">
                            <span
                              className="duration-check"
                              aria-hidden="true"
                            />
                            <strong>
                              {durationLabel(option, copy.duration)}
                            </strong>
                          </span>
                          <span
                            className="duration-price-cell"
                            data-label={copy.monthlyPrice}
                          >
                            <span className="duration-price-main">
                              <span className="duration-monthly">
                                {formatMembershipMoney(
                                  option.monthly_price_vnd,
                                  locale,
                                )}
                              </span>
                              {saving ? (
                                <span className="saving-badge">
                                  {copy.savingPercent.replace(
                                    "{percent}",
                                    localizedSavingPercent(
                                      saving.percent,
                                      locale,
                                    ),
                                  )}
                                </span>
                              ) : null}
                            </span>
                            {saving ? (
                              <span className="duration-saving">
                                <span>
                                  {copy.monthlyPurchase.replace(
                                    "{amount}",
                                    formatMembershipMoney(
                                      saving.baseline,
                                      locale,
                                    ),
                                  )}
                                </span>
                                <span>
                                  {copy.durationSaving
                                    .replace(
                                      "{amount}",
                                      formatMembershipMoney(
                                        saving.amount,
                                        locale,
                                      ),
                                    )
                                    .replace(
                                      "{percent}",
                                      localizedSavingPercent(
                                        saving.percent,
                                        locale,
                                      ),
                                    )}
                                </span>
                              </span>
                            ) : null}
                          </span>
                          <span
                            className="duration-total"
                            data-label={copy.totalPrice}
                          >
                            {formatMembershipMoney(
                              option.total_price_vnd,
                              locale,
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="payment-plan-section">
                    <h3>{copy.paymentPlanTitle}</h3>
                    {selectedOption &&
                    selectedOption.duration_months > 1 &&
                    availablePlans.length === 0 ? (
                      <p className="notice error" role="alert">
                        {copy.paymentPlanMissing}
                      </p>
                    ) : null}
                    <div
                      className="payment-plan-list"
                      role="group"
                      aria-label={copy.paymentPlanTitle}
                    >
                      {displayPlans.map((plan) => {
                        const installments = sortedInstallments(plan);
                        const saving = selectedOption
                          ? paymentPlanSaving(
                              plan,
                              selectedPlanId,
                              displayPlans,
                            )
                          : null;
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
                            disabled={Boolean(purchase)}
                            onClick={() => {
                              clearQuoteForSelection();
                              setSelectedPlanId(plan.id);
                            }}
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
                                {formatMembershipMoney(
                                  plan.total_amount,
                                  locale,
                                )}
                              </strong>
                              {saving ? (
                                <span className="saving-badge">
                                  {copy.paymentPlanSaving
                                    .replace(
                                      "{amount}",
                                      formatMembershipMoney(
                                        saving.amount,
                                        locale,
                                      ),
                                    )
                                    .replace(
                                      "{percent}",
                                      localizedSavingPercent(
                                        saving.percent,
                                        locale,
                                      ),
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
                                      {formatMembershipMoney(
                                        row.amount,
                                        locale,
                                      )}
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

                  <div className="chosen-total">
                    <div className="chosen-total-selection">
                      <span>{copy.selectionSummary}</span>
                      <small>
                        {selectedPackage && selectedOption
                          ? `${selectedPackage.name} · ${durationLabel(selectedOption, copy.duration)}`
                          : "—"}
                      </small>
                    </div>
                    {selectedPlan ? (
                      <>
                        <div className="chosen-total-method">
                          <span>{copy.summaryMethod}</span>
                          <small>{paymentPlanLabel(selectedPlan, copy)}</small>
                        </div>
                        <div className="chosen-total-payment">
                          <span>
                            {selectedPlan.payment_type === "full"
                              ? copy.summaryAmountDue
                              : copy.summaryFirstPayment}
                          </span>
                          <strong>
                            {formatMembershipMoney(
                              selectedPlan.payment_type === "full"
                                ? selectedPlan.total_amount
                                : (selectedPlan.initial_payment_amount ??
                                    sortedInstallments(selectedPlan)[0]
                                      ?.amount ??
                                    "0"),
                              locale,
                            )}
                          </strong>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
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
              {!sessionReady ? (
                <p className="notice" role="status" aria-live="polite">
                  {copy.loadingAccount}
                </p>
              ) : user ? (
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
                      <option value="">
                        {wardsLoading ? copy.wardsLoading : copy.selectWard}
                      </option>
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
                <div className="terms-document">
                  <h3>{copy.terms.title}</h3>
                  {copy.terms.sections.map((section, index) => {
                    return (
                      <section className="term-section" key={section.heading}>
                        <span className="term-number">{index + 1}</span>
                        <div>
                          <h3>{section.heading}</h3>
                          {"paragraphs" in section ? (
                            section.paragraphs.map((paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ))
                          ) : (
                            <p>{section.text}</p>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
              <div className="agree">
                <input
                  id="csa-purchase-terms-accepted"
                  type="checkbox"
                  name="terms_accepted"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  disabled={creating}
                  aria-invalid={termsSubmitted && !termsAccepted}
                  aria-describedby={
                    termsSubmitted && !termsAccepted ? termsErrorId : undefined
                  }
                  required
                />
                <div>
                  <label htmlFor="csa-purchase-terms-accepted">
                    <strong>{copy.termsAccept}</strong>
                  </label>
                  {termsSubmitted && !termsAccepted ? (
                    <small id={termsErrorId} role="alert">
                      {copy.termsRequired}
                    </small>
                  ) : null}
                </div>
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
                  {creating ? copy.creating : copy.continue}
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
  const profileRefreshPendingRef = useRef(profileRefreshPending);
  const profileRefreshInFlight = useRef(false);
  const currentSessionUser = useRef<CoreUser | null>(null);
  const mounted = useRef(true);
  profileRefreshPendingRef.current = profileRefreshPending;
  currentSessionUser.current = session.user;

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
    window.addEventListener("pageshow", revalidateProfileAfterAuthAccount);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", revalidateProfileAfterAuthAccount);
      window.removeEventListener("pageshow", revalidateProfileAfterAuthAccount);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [revalidateProfileAfterAuthAccount]);

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
      <PurchaseChrome>
        <p className="notice" role="status">
          {session.status === "error" ? copy.genericError : copy.loadingAccount}
        </p>
      </PurchaseChrome>
    );
  }

  return (
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
