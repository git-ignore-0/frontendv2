"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type {
  AdministrativeUnit,
  CSAPaymentQuote,
  CSAPurchaseRequestCreated,
  CSATrackerContract,
  CSATrackerResult,
  MembershipPackage,
} from "@/features/account/types";
import type { CoreUser } from "@/lib/auth/schemas";
import type { Locale } from "@/lib/i18n";

export type CSAPurchaseStep = 1 | 2 | 3 | 4;
export type CSAPurchaseErrorKey =
  | "genericError"
  | "rateLimited"
  | "packageUnavailable"
  | "paymentUnavailable"
  | "paymentPlanRequired"
  | "paymentPlanUnavailable"
  | "termsRequired"
  | "duplicate"
  | "invalidDetails"
  | "notPending"
  | "expired"
  | "quoteExpired"
  | "quoteUnavailable"
  | "quoteIdentityMismatch";
export type PurchaseCreationState =
  | { status: "idle" | "pending" | "success"; error: null }
  | { status: "error"; error: { code: string; status: number } };
export type CSATrackerErrorKey =
  | "genericError"
  | "lookupUnavailable"
  | "sessionExpired"
  | "contractUnavailable"
  | "pdfUnavailable"
  | "invalidLocale"
  | "rateLimited";

export type CSAGuestDetails = {
  name: string;
  phone: string;
  province_code: string;
  ward_code: string;
  address: string;
};

export type CSAPurchaseFlowMemory = {
  identity: string | null;
  step: CSAPurchaseStep;
  packages: MembershipPackage[];
  packagesLocale: Locale | null;
  packagesState: "loading" | "ready" | "error";
  user: CoreUser | null;
  sessionReady: boolean;
  provinces: AdministrativeUnit[];
  provincesLocale: Locale | null;
  wards: AdministrativeUnit[];
  wardsResourceKey: string;
  selectedPackageId: string;
  selectedOptionId: string;
  selectedPlanId: string;
  guest: CSAGuestDetails;
  termsAccepted: boolean;
  acceptedTermIds?: string[];
  informationSubmitted: boolean;
  termsSubmitted: boolean;
  profileIncomplete: boolean;
  errorKey: CSAPurchaseErrorKey | null;
  purchase: CSAPurchaseRequestCreated | null;
  quote?: CSAPaymentQuote | null;
  confirmed: boolean;
  qrFailed: boolean;
  expired: boolean;
};

export type CSATrackerFlowMemory = {
  referenceCode: string;
  phone: string;
  submitted: boolean;
  result: CSATrackerResult | null;
  contract: CSATrackerContract | null;
  sessionExpired: boolean;
  errorKey: CSATrackerErrorKey | null;
};

type CSAFlowStateValue = {
  hasProvider: boolean;
  purchase: CSAPurchaseFlowMemory | null;
  tracker: CSATrackerFlowMemory | null;
  setPurchase: Dispatch<SetStateAction<CSAPurchaseFlowMemory | null>>;
  setTracker: (state: CSATrackerFlowMemory | null) => void;
  clearPurchase: () => void;
  quoteCreation: PurchaseCreationState;
  createQuote: (
    identity: string | null,
    submit: () => Promise<CSAPaymentQuote>,
  ) => void;
  confirmation: PurchaseCreationState;
  confirmTransfer: (
    identity: string | null,
    submit: () => Promise<CSAPurchaseRequestCreated>,
  ) => void;
  clearTracker: () => void;
  profileRefreshPending: boolean;
  markProfileRefreshPending: () => void;
  completeProfileRefresh: () => void;
};

const detachedState: CSAFlowStateValue = {
  hasProvider: false,
  purchase: null,
  tracker: null,
  setPurchase: () => undefined,
  setTracker: () => undefined,
  clearPurchase: () => undefined,
  quoteCreation: { status: "idle", error: null },
  createQuote: () => undefined,
  confirmation: { status: "idle", error: null },
  confirmTransfer: () => undefined,
  clearTracker: () => undefined,
  profileRefreshPending: false,
  markProfileRefreshPending: () => undefined,
  completeProfileRefresh: () => undefined,
};

const CSAFlowStateContext = createContext<CSAFlowStateValue>(detachedState);

export function CSAFlowStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [purchase, setPurchase] = useState<CSAPurchaseFlowMemory | null>(null);
  const [quoteCreation, setQuoteCreation] = useState<PurchaseCreationState>({
    status: "idle",
    error: null,
  });
  const quoteInFlight = useRef(false);
  const confirmationInFlight = useRef(false);
  const [confirmation, setConfirmation] = useState<PurchaseCreationState>({
    status: "idle",
    error: null,
  });
  const purchaseGeneration = useRef(0);
  const [tracker, setTracker] = useState<CSATrackerFlowMemory | null>(null);
  const [profileRefreshPending, setProfileRefreshPending] = useState(false);
  const clearPurchase = useCallback(() => {
    purchaseGeneration.current += 1;
    quoteInFlight.current = false;
    confirmationInFlight.current = false;
    setQuoteCreation({ status: "idle", error: null });
    setConfirmation({ status: "idle", error: null });
    setPurchase(null);
  }, []);
  const createQuote = useCallback(
    (identity: string | null, submit: () => Promise<CSAPaymentQuote>) => {
      if (quoteInFlight.current) return;
      quoteInFlight.current = true;
      const generation = purchaseGeneration.current;
      setQuoteCreation({ status: "pending", error: null });
      void submit()
        .then((quote) => {
          if (generation !== purchaseGeneration.current) return;
          setPurchase((current) =>
            current?.identity === identity
              ? {
                  ...current,
                  quote,
                  purchase: null,
                  confirmed: false,
                  expired: false,
                  step: 4,
                }
              : current,
          );
          setQuoteCreation({ status: "success", error: null });
        })
        .catch((error: unknown) => {
          if (generation !== purchaseGeneration.current) return;
          const safeError =
            error instanceof Error && "code" in error && "status" in error
              ? { code: String(error.code), status: Number(error.status) }
              : { code: "request_failed", status: 0 };
          setQuoteCreation({ status: "error", error: safeError });
        })
        .finally(() => {
          if (generation === purchaseGeneration.current)
            quoteInFlight.current = false;
        });
    },
    [],
  );
  const confirmTransfer = useCallback(
    (
      identity: string | null,
      submit: () => Promise<CSAPurchaseRequestCreated>,
    ) => {
      if (confirmationInFlight.current) return;
      confirmationInFlight.current = true;
      const generation = purchaseGeneration.current;
      setConfirmation({ status: "pending", error: null });
      void submit()
        .then((created) => {
          if (generation !== purchaseGeneration.current) return;
          setPurchase((current) =>
            current?.identity === identity
              ? {
                  ...current,
                  purchase: created,
                  quote: null,
                  confirmed: true,
                  step: 4,
                }
              : current,
          );
          setConfirmation({ status: "success", error: null });
        })
        .catch((error: unknown) => {
          if (generation !== purchaseGeneration.current) return;
          const safeError =
            error instanceof Error && "code" in error && "status" in error
              ? { code: String(error.code), status: Number(error.status) }
              : { code: "request_failed", status: 0 };
          setConfirmation({ status: "error", error: safeError });
        })
        .finally(() => {
          if (generation === purchaseGeneration.current)
            confirmationInFlight.current = false;
        });
    },
    [],
  );
  const clearTracker = useCallback(() => setTracker(null), []);
  const markProfileRefreshPending = useCallback(
    () => setProfileRefreshPending(true),
    [],
  );
  const completeProfileRefresh = useCallback(
    () => setProfileRefreshPending(false),
    [],
  );
  const value = useMemo(
    () => ({
      hasProvider: true,
      purchase,
      tracker,
      setPurchase,
      setTracker,
      clearPurchase,
      quoteCreation,
      createQuote,
      confirmation,
      confirmTransfer,
      clearTracker,
      profileRefreshPending,
      markProfileRefreshPending,
      completeProfileRefresh,
    }),
    [
      clearPurchase,
      clearTracker,
      createQuote,
      confirmation,
      confirmTransfer,
      purchase,
      quoteCreation,
      profileRefreshPending,
      markProfileRefreshPending,
      completeProfileRefresh,
      tracker,
    ],
  );

  return (
    <CSAFlowStateContext.Provider value={value}>
      {children}
    </CSAFlowStateContext.Provider>
  );
}

export function useCSAFlowState() {
  return useContext(CSAFlowStateContext);
}
