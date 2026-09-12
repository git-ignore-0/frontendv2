"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import { accountApi, AccountApiError } from "@/features/account/api";
import type {
  AdministrativeUnit,
  CSAPurchaseRequestCreated,
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
import { localizedPath, type Locale } from "@/lib/i18n";

const AUTH_ACCOUNT_URL = "https://auth.naturalfarmingvietnam.com/account";
const termsErrorId = "csa-purchase-terms-error";

const emptyGuestDetails: CSAGuestDetails = {
  name: "",
  phone: "",
  province_code: "",
  ward_code: "",
  address: "",
};

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
  if (error.code === "csa_purchase_request_open_exists") return "duplicate";
  if (error.code === "csa_purchase_request_expired") return "expired";
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

export function buildVietQRUrl(request: CSAPurchaseRequestCreated) {
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
  return /^[1-9]\d*$/.test(value) ? BigInt(value) : null;
}

function priceOptionSaving(
  option: MembershipPackagePriceOption,
  options: MembershipPackagePriceOption[],
) {
  const oneMonthOption = options.find((item) => item.duration_months === 1);
  const baselineTotal = oneMonthOption
    ? positiveInteger(oneMonthOption.total_price_vnd)
    : null;
  const selectedTotal = positiveInteger(option.total_price_vnd);
  if (
    baselineTotal === null ||
    selectedTotal === null ||
    !Number.isSafeInteger(option.duration_months) ||
    option.duration_months <= 0
  ) {
    return null;
  }
  const regularTotal = baselineTotal * BigInt(option.duration_months);
  const saving = regularTotal - selectedTotal;
  if (regularTotal <= 0 || saving <= 0) return null;
  const percent =
    (saving * BigInt(200) + regularTotal) / (regularTotal * BigInt(2));
  return { amount: saving.toString(), percent: percent.toString() };
}

function activePriceOptions(item: MembershipPackage) {
  return item.price_options.filter((option) => option.is_active !== false);
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
  if (invalid) return errorId;
  return undefined;
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
}: {
  locale: Locale;
  currentUser: CoreUser | null;
  onReset: () => void;
}) {
  const copy = getCSAPurchaseCopy(locale);
  const {
    purchase: purchaseMemory,
    setPurchase: savePurchase,
    purchaseCreation,
    createPurchase: startPurchaseCreation,
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
  const selectionRef = useRef({
    packageId: selectedPackageId,
    optionId: selectedOptionId,
  });
  selectionRef.current = {
    packageId: selectedPackageId,
    optionId: selectedOptionId,
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
  const creating = purchaseCreation.status === "pending";
  const [confirming, setConfirming] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(
    initialMemory?.profileIncomplete ?? false,
  );
  const [errorKey, setErrorKey] = useState<CSAPurchaseErrorKey | null>(
    initialMemory?.errorKey ?? null,
  );
  const error = errorKey ? copy[errorKey] : "";
  const [purchase, setPurchase] = useState<CSAPurchaseRequestCreated | null>(
    initialMemory?.purchase ?? null,
  );
  const [confirmed, setConfirmed] = useState(initialMemory?.confirmed ?? false);
  const [qrFailed, setQrFailed] = useState(initialMemory?.qrFailed ?? false);
  const [expired, setExpired] = useState(initialMemory?.expired ?? false);
  const paymentExpired = Boolean(
    expired ||
    (purchase?.expires_at &&
      Number.isFinite(Date.parse(purchase.expires_at)) &&
      Date.parse(purchase.expires_at) <= Date.now()),
  );
  const [copiedField, setCopiedField] = useState<"account" | "content" | null>(
    null,
  );
  const confirmingRef = useRef(false);
  const progressRef = useRef<HTMLOListElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const stepScrollFrameRef = useRef<number | null>(null);
  const activeWizardStep = confirmed ? 5 : step;
  const previousWizardStepRef = useRef<number>(activeWizardStep);

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
      guest,
      termsAccepted,
      informationSubmitted,
      termsSubmitted,
      profileIncomplete,
      errorKey,
      confirmed: confirmed || current?.confirmed || false,
      qrFailed,
      expired: expired || current?.expired || false,
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
    qrFailed,
    savePurchase,
    selectedOptionId,
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
    if (purchaseMemory?.confirmed && !confirmed) setConfirmed(true);
    if (purchaseMemory?.expired && !expired) setExpired(true);
  }, [confirmed, expired, purchaseMemory?.confirmed, purchaseMemory?.expired]);

  useEffect(() => {
    if (purchaseCreation.status !== "error") return;
    const creationError = new AccountApiError(
      purchaseCreation.error.code,
      purchaseCreation.error.status,
    );
    if (creationError.code === "csa_purchase_auth_account_incomplete") {
      setProfileIncomplete(true);
      setStep(2);
    } else {
      setErrorKey(purchaseErrorKey(creationError));
    }
  }, [purchaseCreation]);

  useEffect(() => {
    if (!purchase || confirmed || expired || !purchase.expires_at) return;
    const expiresAt = Date.parse(purchase.expires_at);
    if (!Number.isFinite(expiresAt)) return;
    let timer: number;
    const schedule = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setExpired(true);
        return;
      }
      timer = window.setTimeout(schedule, Math.min(remaining, 2_147_483_647));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [confirmed, expired, purchase]);

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
      setPackages(allPackages);
      setPackagesLocale(locale);
      setSelectedPackageId(packageId);
      setSelectedOptionId(optionId);
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
  const normalizedPhone = normalizeVietnamPhone(guest.phone);
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

  async function selectProvince(provinceCode: string) {
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

  function createPurchase() {
    setTermsSubmitted(true);
    setErrorKey(null);
    setProfileIncomplete(false);
    if (!canCreate || !selectedPackage || !selectedOption) return;
    const identity = user
      ? {}
      : {
          name: guest.name.trim(),
          phone: normalizedPhone,
          province_code: guest.province_code,
          ward_code: guest.ward_code,
          address: guest.address.trim(),
        };
    startPurchaseCreation(user?.sub ?? null, () =>
      accountApi<CSAPurchaseRequestCreated>("csa-purchase-requests", {
        method: "POST",
        body: JSON.stringify({
          package_id: selectedPackage.id,
          price_option_id: selectedOption.id,
          terms_accepted: true,
          terms_locale: locale,
          ...identity,
        }),
      }).then((payload) => payload.data),
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
    if (purchase) {
      setStep(4);
      return;
    }
    void createPurchase();
  }

  async function confirmPayment() {
    if (!purchase || confirmingRef.current || confirmed || paymentExpired)
      return;
    if (purchase.expires_at && Date.parse(purchase.expires_at) <= Date.now()) {
      setExpired(true);
      return;
    }
    confirmingRef.current = true;
    setConfirming(true);
    setErrorKey(null);
    try {
      await accountApi(`csa-purchase-requests/${purchase.id}/confirm-payment`, {
        method: "POST",
        body: JSON.stringify(
          purchase.guest_confirmation_token
            ? { guest_confirmation_token: purchase.guest_confirmation_token }
            : {},
        ),
      });
      savePurchase((current) =>
        current ? { ...current, step: 4, purchase, confirmed: true } : current,
      );
      setConfirmed(true);
    } catch (caught) {
      if (purchaseErrorKey(caught) === "expired") {
        savePurchase((current) =>
          current ? { ...current, expired: true } : current,
        );
        setExpired(true);
      } else setErrorKey(purchaseErrorKey(caught));
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
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

  if (purchase && step === 4 && paymentExpired)
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
                {copy.expired}
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

  if (purchase && step === 4) {
    const qrUrl = buildVietQRUrl(purchase);
    const bankDataComplete = Boolean(
      purchase.bank_name &&
      purchase.account_number &&
      purchase.account_name &&
      purchase.amount &&
      purchase.transfer_content,
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
              <p className="step-desc">{copy.paymentIntro}</p>
              <div className="payment-grid">
                <div className="payment-qr">
                  <h3 className="payment-qr-title">
                    {locale === "vi" ? "Mã QR" : "QR code"}
                  </h3>
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
                  ) : null}
                </div>
                <div className="payment-information">
                  {bankDataComplete ? (
                    <>
                      <h3 className="payment-details-title">
                        {copy.paymentTitle}
                      </h3>
                      <dl className="bank-list">
                        <div className="bank-row">
                          <dt className="k">{copy.bank}</dt>
                          <dd className="v">
                            <strong>{purchase.bank_name}</strong>
                          </dd>
                        </div>
                        <div className="bank-row">
                          <dt className="k">{copy.accountNumber}</dt>
                          <dd className="v">
                            <strong>{purchase.account_number}</strong>
                            <button
                              className="copy"
                              type="button"
                              title={copy.copy}
                              onClick={() =>
                                void copyPaymentValue(
                                  "account",
                                  purchase.account_number,
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
                            <strong>{purchase.account_name}</strong>
                          </dd>
                        </div>
                        <div className="bank-row">
                          <dt className="k">{copy.amount}</dt>
                          <dd className="v">
                            <strong>
                              {formatMembershipMoney(purchase.amount, locale)}
                            </strong>
                          </dd>
                        </div>
                        <div className="bank-row">
                          <dt className="k">{copy.transferContent}</dt>
                          <dd className="v">
                            <strong>{purchase.transfer_content}</strong>
                            <button
                              className="copy"
                              type="button"
                              title={copy.copy}
                              onClick={() =>
                                void copyPaymentValue(
                                  "content",
                                  purchase.transfer_content,
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
                    </>
                  ) : null}
                  {!paymentComplete ? (
                    <p className="notice error" role="alert">
                      {copy.paymentDataError}
                    </p>
                  ) : null}
                  {error ? (
                    <p className="notice error" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <div className="btn-row">
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
                        disabled={packageDisabled}
                        key={item.id}
                        onClick={() => {
                          setSelectedPackageId(item.id);
                          setSelectedOptionId(firstOption?.id ?? "");
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
                            {item.quota_policy === "expire"
                              ? copy.policyExpire
                              : copy.policyRollover}
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
                      const saving = priceOptionSaving(
                        option,
                        availableOptions,
                      );
                      return (
                        <button
                          className={durationChoiceClass(
                            selectedOptionId === option.id,
                          )}
                          type="button"
                          data-months={option.duration_months}
                          aria-pressed={selectedOptionId === option.id}
                          key={option.id}
                          onClick={() => setSelectedOptionId(option.id)}
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
                                    saving.percent,
                                  )}
                                </span>
                              ) : null}
                            </span>
                            {saving ? (
                              <span className="duration-saving">
                                {copy.savingAmount.replace(
                                  "{amount}",
                                  formatMembershipMoney(saving.amount, locale),
                                )}
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

                  <div className="chosen-total">
                    <div>
                      <span>{copy.selectionSummary}</span>
                      <small>
                        {selectedPackage && selectedOption
                          ? `${selectedPackage.name} · ${durationLabel(selectedOption, copy.duration)}`
                          : "—"}
                      </small>
                    </div>
                    <strong>
                      {selectedOption
                        ? formatMembershipMoney(
                            selectedOption.total_price_vnd,
                            locale,
                          )
                        : "—"}
                    </strong>
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
                        setGuest((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      autoComplete="name"
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
                        setGuest((current) => ({
                          ...current,
                          phone: event.target.value.replace(/(?!^\+)\D/g, ""),
                        }))
                      }
                      inputMode="tel"
                      autoComplete="tel"
                      aria-invalid={informationSubmitted && !normalizedPhone}
                      aria-describedby={describedBy(
                        informationSubmitted && !normalizedPhone,
                        "csa-purchase-phone-error",
                      )}
                      required
                    />
                    {informationSubmitted && !normalizedPhone ? (
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
                      {provinces.map((item) => (
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
                        setGuest((current) => ({
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
                        ? wards
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
                        setGuest((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      autoComplete="street-address"
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
                <div className="notice error" role="alert">
                  <p>{copy.profileIncomplete}</p>
                  <a className="btn btn-terra" href={AUTH_ACCOUNT_URL}>
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
                          <p>{section.text}</p>
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
  const { purchase, clearPurchase } = useCSAFlowState();
  const [session, setSession] = useState<
    | { status: "checking" | "error"; user: null }
    | { status: "ready"; user: CoreUser | null }
  >({ status: "checking", user: null });
  const [flowVersion, setFlowVersion] = useState(0);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error("session_unavailable");
        const payload = (await response.json()) as {
          data?: { user?: CoreUser | null };
        };
        return payload.data?.user ?? null;
      })
      .then((user) => {
        if (active) setSession({ status: "ready", user });
      })
      .catch(() => {
        if (active) setSession({ status: "error", user: null });
      });
    return () => {
      active = false;
    };
  }, []);

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
