import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  CSAFlowStateProvider,
  type CSAPurchaseFlowMemory,
  type CSATrackerFlowMemory,
  useCSAFlowState,
} from "@/features/membership/csa-flow-state";

const purchase: CSAPurchaseFlowMemory = {
  identity: null,
  step: 3,
  packages: [],
  packagesLocale: "vi",
  packagesState: "ready",
  user: null,
  sessionReady: true,
  provinces: [],
  provincesLocale: "vi",
  wards: [],
  wardsResourceKey: "",
  selectedPackageId: "package-1",
  selectedOptionId: "option-1",
  guest: {
    name: "Guest",
    phone: "0901234567",
    province_code: "66",
    ward_code: "22015",
    address: "Address",
  },
  termsAccepted: true,
  informationSubmitted: true,
  termsSubmitted: true,
  profileIncomplete: false,
  errorKey: null,
  purchase: null,
  confirmed: false,
  qrFailed: false,
  expired: false,
};
const tracker: CSATrackerFlowMemory = {
  referenceCode: "CSA-ABC123",
  phone: "0901234567",
  submitted: true,
  result: null,
  contract: null,
  sessionExpired: false,
  errorKey: null,
};

function Probe() {
  const state = useCSAFlowState();
  return (
    <>
      <output data-testid="purchase">
        {state.purchase?.selectedPackageId}
      </output>
      <output data-testid="tracker">{state.tracker?.referenceCode}</output>
      <button onClick={() => state.setPurchase(purchase)}>Set purchase</button>
      <button onClick={() => state.setTracker(tracker)}>Set tracker</button>
      <button onClick={state.clearPurchase}>Clear purchase</button>
      <button onClick={state.clearTracker}>Clear tracker</button>
    </>
  );
}

afterEach(cleanup);

describe("CSA flow memory", () => {
  it("mounts outside the locale layout", () => {
    const rootLayout = readFileSync(resolve("src/app/layout.tsx"), "utf8");
    const purchaseLayout = readFileSync(
      resolve("src/app/csa/purchase/[locale]/layout.tsx"),
      "utf8",
    );
    const trackerLayout = readFileSync(
      resolve("src/app/csa/track/[locale]/layout.tsx"),
      "utf8",
    );
    expect(rootLayout).toContain(
      "<CSAFlowStateProvider>{children}</CSAFlowStateProvider>",
    );
    expect(purchaseLayout).not.toContain("CSAFlowStateProvider");
    expect(trackerLayout).not.toContain("CSAFlowStateProvider");
  });

  it("keeps purchase and tracker data separate when one flow is reset", () => {
    render(
      <CSAFlowStateProvider>
        <Probe />
      </CSAFlowStateProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Set purchase" }));
    fireEvent.click(screen.getByRole("button", { name: "Set tracker" }));
    expect(screen.getByTestId("purchase")).toHaveTextContent("package-1");
    expect(screen.getByTestId("tracker")).toHaveTextContent("CSA-ABC123");
    fireEvent.click(screen.getByRole("button", { name: "Clear tracker" }));
    expect(screen.getByTestId("purchase")).toHaveTextContent("package-1");
    expect(screen.getByTestId("tracker")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Set tracker" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear purchase" }));
    expect(screen.getByTestId("purchase")).toBeEmptyDOMElement();
    expect(screen.getByTestId("tracker")).toHaveTextContent("CSA-ABC123");
  });
});
