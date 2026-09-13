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
  | "expired";
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
  informationSubmitted: boolean;
  termsSubmitted: boolean;
  profileIncomplete: boolean;
  errorKey: CSAPurchaseErrorKey | null;
  purchase: CSAPurchaseRequestCreated | null;
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
  purchaseCreation: PurchaseCreationState;
  createPurchase: (
    identity: string | null,
    submit: () => Promise<CSAPurchaseRequestCreated>,
  ) => void;
  clearTracker: () => void;
};

const detachedState: CSAFlowStateValue = {
  hasProvider: false,
  purchase: null,
  tracker: null,
  setPurchase: () => undefined,
  setTracker: () => undefined,
  clearPurchase: () => undefined,
  purchaseCreation: { status: "idle", error: null },
  createPurchase: () => undefined,
  clearTracker: () => undefined,
};

const CSAFlowStateContext = createContext<CSAFlowStateValue>(detachedState);

export function CSAFlowStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [purchase, setPurchase] = useState<CSAPurchaseFlowMemory | null>(null);
  const [purchaseCreation, setPurchaseCreation] =
    useState<PurchaseCreationState>({
      status: "idle",
      error: null,
    });
  const creationInFlight = useRef(false);
  const purchaseGeneration = useRef(0);
  const [tracker, setTracker] = useState<CSATrackerFlowMemory | null>(null);
  const clearPurchase = useCallback(() => {
    purchaseGeneration.current += 1;
    creationInFlight.current = false;
    setPurchaseCreation({ status: "idle", error: null });
    setPurchase(null);
  }, []);
  const createPurchase = useCallback(
    (
      identity: string | null,
      submit: () => Promise<CSAPurchaseRequestCreated>,
    ) => {
      if (creationInFlight.current) return;
      creationInFlight.current = true;
      const generation = purchaseGeneration.current;
      setPurchaseCreation({ status: "pending", error: null });
      void submit()
        .then((created) => {
          if (generation !== purchaseGeneration.current) return;
          setPurchase((current) =>
            current?.identity === identity
              ? { ...current, purchase: created, step: 4 }
              : current,
          );
          setPurchaseCreation({ status: "success", error: null });
        })
        .catch((error: unknown) => {
          if (generation !== purchaseGeneration.current) return;
          const safeError =
            error instanceof Error && "code" in error && "status" in error
              ? { code: String(error.code), status: Number(error.status) }
              : { code: "request_failed", status: 0 };
          setPurchaseCreation({ status: "error", error: safeError });
        })
        .finally(() => {
          if (generation === purchaseGeneration.current)
            creationInFlight.current = false;
        });
    },
    [],
  );
  const clearTracker = useCallback(() => setTracker(null), []);
  const value = useMemo(
    () => ({
      hasProvider: true,
      purchase,
      tracker,
      setPurchase,
      setTracker,
      clearPurchase,
      purchaseCreation,
      createPurchase,
      clearTracker,
    }),
    [
      clearPurchase,
      clearTracker,
      createPurchase,
      purchase,
      purchaseCreation,
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
