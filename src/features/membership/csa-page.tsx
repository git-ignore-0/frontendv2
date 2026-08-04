"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { SiteContent } from "@/content/site-content";
import {
  AccountApiError,
  accountApi,
  isAccountSessionError,
} from "@/features/account/api";
import type {
  CurrentMembership,
  MembershipPackage,
  MembershipPaymentAvailability,
  MembershipPaymentInstruction,
  MembershipRequest,
  PaginationMeta,
} from "@/features/account/types";
import {
  formatMembershipMoney,
  formatMembershipUnits,
  membershipUnitLabel,
  vietQrUrl,
} from "@/features/membership/format";
import { MembershipDialog } from "@/features/membership/membership-dialog";
import type { Locale } from "@/lib/i18n";

type Copy = SiteContent["csa"];
type MembershipContextState =
  "loading" | "signed-out" | "ready" | "request-error";
type Flow = "consultation" | "direct_transfer";

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function CsaPage({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [packagesMeta, setPackagesMeta] = useState<PaginationMeta | null>(null);
  const [packagesPage, setPackagesPage] = useState(1);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState("");
  const [directTransferEnabled, setDirectTransferEnabled] = useState(false);
  const [paymentAvailabilityLoading, setPaymentAvailabilityLoading] =
    useState(true);
  const [contextState, setContextState] =
    useState<MembershipContextState>("loading");
  const [request, setRequest] = useState<MembershipRequest | null>(null);
  const [currentMembership, setCurrentMembership] =
    useState<CurrentMembership | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<MembershipPackage | null>(null);
  const [creatingFlow, setCreatingFlow] = useState<Flow | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const creatingRef = useRef(false);
  const payingRef = useRef(false);
  const packagesRequestSequence = useRef(0);
  const activePackagesRequest = useRef<{
    controller: AbortController;
    sequence: number;
  } | null>(null);
  const membershipContextRequestSequence = useRef(0);
  const activeMembershipContextRequest = useRef<{
    controller: AbortController;
    sequence: number;
  } | null>(null);

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

  const loadMembershipContext = useCallback(async () => {
    activeMembershipContextRequest.current?.controller.abort();
    const controller = new AbortController();
    const sequence = ++membershipContextRequestSequence.current;
    activeMembershipContextRequest.current = { controller, sequence };
    const isCurrentRequest = () =>
      activeMembershipContextRequest.current?.sequence === sequence &&
      !controller.signal.aborted;

    setContextState("loading");
    setRequest(null);
    setCurrentMembership(null);
    try {
      const [requestPayload, membershipPayload] = await Promise.all([
        accountApi<MembershipRequest | null>(
          `memberships/requests?locale=${locale}`,
          {
            signal: controller.signal,
          },
        ),
        accountApi<CurrentMembership | null>(
          `memberships/current?locale=${locale}`,
          {
            signal: controller.signal,
          },
        ),
      ]);
      if (!isCurrentRequest()) return;
      setRequest(requestPayload.data);
      setCurrentMembership(membershipPayload.data);
      setContextState("ready");
    } catch (caught) {
      if (!isCurrentRequest() || isAbortError(caught)) return;
      if (isAccountSessionError(caught)) {
        setContextState("signed-out");
      } else {
        setContextState("request-error");
      }
    } finally {
      if (
        activeMembershipContextRequest.current?.controller === controller &&
        activeMembershipContextRequest.current.sequence === sequence
      ) {
        activeMembershipContextRequest.current = null;
      }
    }
  }, [locale]);

  const loadPaymentAvailability = useCallback(async () => {
    setPaymentAvailabilityLoading(true);
    setDirectTransferEnabled(false);
    try {
      const payload = await accountApi<MembershipPaymentAvailability>(
        "membership-payment-availability",
      );
      setDirectTransferEnabled(payload.data.direct_transfer_enabled === true);
    } catch {
      setDirectTransferEnabled(false);
    } finally {
      setPaymentAvailabilityLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPackages();
    void loadMembershipContext();
    void loadPaymentAvailability();
  }, [loadMembershipContext, loadPackages, loadPaymentAvailability]);

  useEffect(() => {
    return () => {
      packagesRequestSequence.current += 1;
      activePackagesRequest.current?.controller.abort();
      activePackagesRequest.current = null;
      membershipContextRequestSequence.current += 1;
      activeMembershipContextRequest.current?.controller.abort();
      activeMembershipContextRequest.current = null;
    };
  }, []);

  const closeFlow = useCallback(() => {
    if (creatingRef.current) return;
    setSelectedPackage(null);
    setCreateError("");
    setPhoneError("");
    setPhone("");
    setCreatingFlow(null);
  }, []);

  async function createRequest(flow: Flow) {
    if (!selectedPackage || creatingRef.current) return;
    const normalizedPhone = phone.trim();
    const digits = normalizedPhone.replace(/\D/g, "");
    if (
      !/^[0-9+().\-\s]+$/.test(normalizedPhone) ||
      digits.length < 8 ||
      digits.length > 15
    ) {
      setPhoneError(copy.phoneInvalid);
      return;
    }
    creatingRef.current = true;
    setCreatingFlow(flow);
    setCreating(true);
    setCreateError("");
    setPhoneError("");
    try {
      const payload = await accountApi<MembershipRequest>(
        `memberships/requests?locale=${locale}`,
        {
          method: "POST",
          body: JSON.stringify({
            package_id: selectedPackage.id,
            flow,
            phone: normalizedPhone,
          }),
        },
      );
      setRequest(payload.data);
      setSelectedPackage(null);
    } catch (caught) {
      if (isAccountSessionError(caught)) {
        setContextState("signed-out");
        setSelectedPackage(null);
      } else if (
        caught instanceof AccountApiError &&
        caught.code === "phone_required"
      ) {
        setPhoneError(copy.phoneRequired);
      } else if (
        caught instanceof AccountApiError &&
        caught.code === "direct_transfer_disabled"
      ) {
        setDirectTransferEnabled(false);
        setCreateError(copy.directTransferDisabled);
      } else {
        setCreateError(copy.createError);
      }
    } finally {
      creatingRef.current = false;
      setCreatingFlow(null);
      setCreating(false);
    }
  }

  const closePaymentConfirm = useCallback(() => {
    if (payingRef.current) return;
    setPaymentConfirmOpen(false);
    setPaymentError("");
  }, []);

  async function submitPayment() {
    if (!request || payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    setPaymentError("");
    try {
      const payload = await accountApi<MembershipRequest>(
        `memberships/requests/${request.id}/payment-submitted?locale=${locale}`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setRequest(payload.data);
      setPaymentConfirmOpen(false);
    } catch (caught) {
      if (isAccountSessionError(caught)) {
        setContextState("signed-out");
        setPaymentConfirmOpen(false);
      } else {
        setPaymentError(copy.paymentError);
      }
    } finally {
      payingRef.current = false;
      setPaying(false);
    }
  }

  const returnPath = `/${locale}/csa`;
  const loginHref = `/api/auth/login?locale=${locale}&returnTo=${encodeURIComponent(returnPath)}`;
  const busy = creating || paying;
  const hasCurrentMembership =
    currentMembership?.status === "scheduled" ||
    currentMembership?.status === "active";

  return (
    <div className="csa-page">
      <div className="csa-page-background" aria-hidden="true">
        <span className="csa-background-grain" />
        <span className="csa-background-moss" />
        <span className="csa-background-straw" />
      </div>
      <div className="shell csa-page-shell">
        <header className="csa-hero">
          <div className="csa-hero-copy">
            <p className="csa-hero-kicker">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="csa-hero-lead">{copy.intro}</p>
            <p className="csa-hero-body">{copy.aboutBody}</p>
          </div>
          <span className="csa-hero-leaf" aria-hidden="true">
            <svg viewBox="0 0 120 160" fill="none">
              <path d="M57 153C55 107 65 63 103 17" />
              <path d="M66 111C39 103 23 85 15 58C43 61 62 76 66 111Z" />
              <path d="M77 82C82 52 98 35 115 28C115 54 101 75 77 82Z" />
              <path d="M58 132C38 128 23 117 12 99C34 98 51 108 58 132Z" />
            </svg>
          </span>
        </header>

        <main>
          <section className="csa-how" aria-labelledby="csa-about-title">
            <header className="csa-section-heading">
              <h2 id="csa-about-title">{copy.aboutTitle}</h2>
            </header>
            <ol className="csa-how-list">
              {copy.howSteps.map((step, index) => (
                <li key={step.title}>
                  <span className="csa-how-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {request ? (
            <section
              className="csa-current-request"
              aria-labelledby="csa-request-title"
            >
              <header>
                <div>
                  <p className="eyebrow">{copy.yourRequest}</p>
                  <h2 id="csa-request-title">{request.package.name}</h2>
                </div>
                <span className={`membership-status is-${request.status}`}>
                  {requestStatus(copy, request.status)}
                </span>
              </header>
              <p className="csa-request-code">
                {copy.requestCode}: <strong>{request.short_code}</strong>
              </p>
              {request.status === "consultation_requested" ||
              request.status === "contacted" ? (
                <p className="csa-request-message">
                  {request.status === "contacted"
                    ? copy.contactedBody
                    : copy.consultationBody}
                </p>
              ) : null}
              {request.status === "payment_submitted" ? (
                <div className="csa-request-message is-success" role="status">
                  <strong>{copy.paymentSubmittedTitle}</strong>
                  <p>{copy.paymentSubmittedBody}</p>
                </div>
              ) : null}
              {request.status === "payment_pending" && request.return_reason ? (
                <div className="csa-return-reason" role="alert">
                  <strong>{copy.returnedTitle}</strong>
                  <p>
                    <b>{copy.returnReason}:</b> {request.return_reason}
                  </p>
                  <p>{copy.returnHelp}</p>
                </div>
              ) : null}
              {request.status === "payment_pending" &&
              request.payment_instruction ? (
                <PaymentInstructionPanel
                  busy={busy}
                  copy={copy}
                  instruction={request.payment_instruction}
                  locale={locale}
                  onPayment={() => {
                    setPaymentError("");
                    setPaymentConfirmOpen(true);
                  }}
                />
              ) : null}
            </section>
          ) : null}

          <section
            className="csa-packages"
            aria-labelledby="csa-packages-title"
          >
            <header>
              <h2 id="csa-packages-title">{copy.packagesTitle}</h2>
              <p>{copy.packagesIntro}</p>
            </header>
            {contextState === "request-error" ? (
              <div
                className="csa-inline-state csa-membership-context-error"
                role="alert"
              >
                <p>{copy.membershipContextError}</p>
                <button onClick={() => void loadMembershipContext()}>
                  {copy.retry}
                </button>
              </div>
            ) : null}
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
                <div className="csa-package-list">
                  {packages.map((item) => {
                    const isCurrentPackage =
                      hasCurrentMembership &&
                      currentMembership?.package_id === item.id;
                    return (
                      <article className="csa-package-card" key={item.id}>
                        <div className="csa-package-summary">
                          <div>
                            <h3>{item.name}</h3>
                            {item.description ? (
                              <p>{item.description}</p>
                            ) : null}
                          </div>
                          <div className="csa-package-purchase">
                            <strong className="csa-package-price">
                              {formatMembershipMoney(
                                item.upfront_price,
                                locale,
                              )}
                            </strong>
                            <p className="csa-package-duration">
                              <span>{copy.duration}</span>
                              {copy.months.replace(
                                "{count}",
                                String(item.duration_months),
                              )}
                            </p>
                            {request ? (
                              <button
                                className="csa-package-action"
                                disabled
                                type="button"
                              >
                                {copy.openRequestExists}
                              </button>
                            ) : isCurrentPackage ? (
                              <Link
                                className="csa-package-action"
                                href={`/account/${locale}/membership?returnTo=${encodeURIComponent(returnPath)}`}
                              >
                                {copy.viewYourMembership}
                              </Link>
                            ) : hasCurrentMembership ? (
                              <p className="csa-package-registration-state">
                                {copy.membershipAlreadyExists}
                              </p>
                            ) : contextState === "signed-out" ? (
                              <Link
                                className="csa-package-action"
                                href={loginHref}
                                prefetch={false}
                              >
                                {copy.signInToJoin}
                              </Link>
                            ) : contextState === "ready" &&
                              paymentAvailabilityLoading ? (
                              <button
                                className="csa-package-action"
                                disabled
                                type="button"
                              >
                                {copy.checkingAccount}
                              </button>
                            ) : contextState === "ready" ? (
                              <button
                                className="csa-package-action"
                                disabled={busy}
                                onClick={() => {
                                  setCreateError("");
                                  setPhoneError("");
                                  setPhone("");
                                  setSelectedPackage(item);
                                }}
                                type="button"
                              >
                                {copy.choosePackage}
                              </button>
                            ) : contextState === "loading" ? (
                              <button
                                className="csa-package-action"
                                disabled
                                type="button"
                              >
                                {copy.checkingAccount}
                              </button>
                            ) : (
                              <p className="csa-package-registration-state">
                                {copy.registrationUnavailable}
                              </p>
                            )}
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
                              <strong>{copy.quotaPolicy}</strong>
                              {item.quota_policy === "expire"
                                ? copy.expire
                                : copy.rollover}
                            </p>
                          </div>
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
        </main>
      </div>

      {selectedPackage ? (
        <MembershipDialog
          busy={creating}
          description={copy.flowDescription.replace(
            "{name}",
            selectedPackage.name,
          )}
          onCancel={closeFlow}
          title={copy.flowTitle}
        >
          <div className="membership-selected-package">
            <div>
              <strong>{selectedPackage.name}</strong>
              <span>
                {copy.months.replace(
                  "{count}",
                  String(selectedPackage.duration_months),
                )}
              </span>
            </div>
            <b>
              {formatMembershipMoney(selectedPackage.upfront_price, locale)}
            </b>
          </div>
          <div className="membership-phone-field">
            <label htmlFor="csa-contact-phone">{copy.phoneLabel}</label>
            <input
              aria-invalid={Boolean(phoneError)}
              autoComplete="tel"
              disabled={creating}
              inputMode="tel"
              maxLength={32}
              id="csa-contact-phone"
              onChange={(event) => {
                setPhone(event.target.value);
                setPhoneError("");
              }}
              placeholder={copy.phonePlaceholder}
              type="tel"
              value={phone}
            />
            <small>{copy.phoneHelp}</small>
            {phoneError ? <em role="alert">{phoneError}</em> : null}
          </div>
          <p className="membership-flow-label">{copy.flowLabel}</p>
          <div className="membership-flow-options">
            {directTransferEnabled ? (
              <button
                disabled={creating}
                onClick={() => void createRequest("direct_transfer")}
              >
                <strong>
                  {creatingFlow === "direct_transfer"
                    ? copy.submitting
                    : copy.directTransferOption}
                </strong>
                <span>{copy.directTransferOptionBody}</span>
              </button>
            ) : null}
            <button
              disabled={creating}
              onClick={() => void createRequest("consultation")}
            >
              <strong>
                {creatingFlow === "consultation"
                  ? copy.submitting
                  : copy.consultationOption}
              </strong>
              <span>{copy.consultationOptionBody}</span>
            </button>
          </div>
          {createError ? (
            <div className="membership-dialog-error" role="alert">
              <p>{createError}</p>
            </div>
          ) : null}
          <div className="membership-dialog-actions">
            <button disabled={creating} onClick={closeFlow} type="button">
              {copy.cancel}
            </button>
          </div>
        </MembershipDialog>
      ) : null}

      {paymentConfirmOpen ? (
        <MembershipDialog
          busy={paying}
          description={copy.paymentConfirmBody}
          onCancel={closePaymentConfirm}
          title={copy.paymentConfirmTitle}
        >
          {paymentError ? (
            <p className="membership-dialog-error" role="alert">
              {paymentError}
            </p>
          ) : null}
          <div className="membership-dialog-actions is-confirmation">
            <button
              disabled={paying}
              onClick={closePaymentConfirm}
              type="button"
            >
              {copy.cancel}
            </button>
            <button
              className="primary"
              disabled={paying}
              onClick={() => void submitPayment()}
              type="button"
            >
              {paying ? copy.confirmingPayment : copy.confirmPayment}
            </button>
          </div>
        </MembershipDialog>
      ) : null}
    </div>
  );
}

function requestStatus(copy: Copy, status: MembershipRequest["status"]) {
  return copy.statuses[status];
}

function CopyPaymentValue({
  value,
  label,
  copy,
  disabled,
}: {
  value: string;
  label: string;
  copy: Copy;
  disabled: boolean;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copyValue() {
    try {
      if (!navigator.clipboard) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  }
  return (
    <div className="membership-copy-row">
      <span>{value}</span>
      <button
        disabled={disabled}
        onClick={() => void copyValue()}
        type="button"
      >
        {state === "copied" ? copy.copied : copy.copy}
        <span className="sr-only">: {label}</span>
      </button>
      {state === "failed" ? (
        <small role="alert">{copy.copyFailed}</small>
      ) : null}
    </div>
  );
}

function PaymentInstructionPanel({
  locale,
  copy,
  instruction,
  busy,
  onPayment,
}: {
  locale: Locale;
  copy: Copy;
  instruction: MembershipPaymentInstruction;
  busy: boolean;
  onPayment: () => void;
}) {
  return (
    <div className="csa-payment-panel">
      <div className="csa-payment-qr">
        {/* VietQR image is derived only from the immutable backend snapshot. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={copy.qrAlt}
          height="360"
          referrerPolicy="no-referrer"
          src={vietQrUrl(instruction)}
          width="360"
        />
      </div>
      <div className="csa-payment-details">
        <h3>{copy.paymentTitle}</h3>
        <p>{copy.paymentIntro}</p>
        <dl>
          <div>
            <dt>{copy.bank}</dt>
            <dd>
              {instruction.bank_name ||
                instruction.bank_code ||
                instruction.bank_bin}
            </dd>
          </div>
          <div>
            <dt>{copy.accountName}</dt>
            <dd>{instruction.account_name}</dd>
          </div>
          <div>
            <dt>{copy.accountNumber}</dt>
            <dd>
              <CopyPaymentValue
                copy={copy}
                disabled={busy}
                label={copy.accountNumber}
                value={instruction.account_number}
              />
            </dd>
          </div>
          <div>
            <dt>{copy.amount}</dt>
            <dd>{formatMembershipMoney(instruction.amount, locale)}</dd>
          </div>
          <div>
            <dt>{copy.transferContent}</dt>
            <dd>
              <CopyPaymentValue
                copy={copy}
                disabled={busy}
                label={copy.transferContent}
                value={instruction.transfer_content}
              />
            </dd>
          </div>
        </dl>
        <button
          className="csa-payment-submit"
          disabled={busy}
          onClick={onPayment}
          type="button"
        >
          {copy.paymentDone}
        </button>
      </div>
    </div>
  );
}
