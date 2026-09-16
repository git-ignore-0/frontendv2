import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountApiError } from "@/features/account/api";
import {
  CSAFlowStateProvider,
  type CSAPurchaseFlowMemory,
  useCSAFlowState,
} from "@/features/membership/csa-flow-state";
import {
  CSAPurchasePage,
  buildVietQRUrl,
  purchaseErrorMessage,
} from "@/features/membership/csa-purchase-page";
import { getCSAPurchaseCopy } from "@/features/membership/csa-purchase-copy";
import type { CSAPurchaseRequestCreated } from "@/features/account/types";

const packageId = "11111111-1111-4111-8111-111111111111";
const optionId = "22222222-2222-4222-8222-222222222222";
const planId = "66666666-6666-4666-8666-666666666666";
const requestId = "33333333-3333-4333-8333-333333333333";
const member = {
  sub: "44444444-4444-4444-8444-444444444444",
  name: "Member",
  email: "member@example.com",
  email_verified: true,
  locale: "vi",
  status: "active",
  roles: ["member"],
};
const packagePayload = {
  data: [
    {
      id: packageId,
      name: "Gói Rau",
      description: "Rau theo mùa",
      quota_policy: "expire",
      items: [
        {
          product_id: "55555555-5555-4555-8555-555555555555",
          product_name: "Rau lá",
          short_description: "",
          unit_size: "0.500",
          unit_label_vi: "kg",
          unit_label_en: "kg",
          quota_units: 2,
        },
      ],
      price_options: [
        {
          id: optionId,
          duration_months: 3,
          monthly_price_vnd: "400000",
          total_price_vnd: "1200000",
          payment_plans: [
            {
              id: planId,
              name: "Trả thẳng",
              payment_type: "full",
              total_amount: "1200000",
              installment_count: 1,
              installments: [
                { sequence: 1, amount: "1200000", cycle_count: 3 },
              ],
            },
          ],
        },
      ],
    },
  ],
};
const purchasePayload = {
  data: {
    id: requestId,
    request_code: "CSA-ABC123",
    status: "pending",
    expires_at: "2099-01-01T00:00:00Z",
    package_snapshot: { id: packageId, name: "Gói Rau" },
    price_option_snapshot: {
      id: optionId,
      name: "3 tháng",
      duration_months: 3,
    },
    payment_plan: {
      id: planId,
      name: "Trả thẳng",
      payment_type: "full",
      total_amount: "1200000",
      installment_count: 1,
      installments: [{ sequence: 1, amount: "1200000", cycle_count: 3 }],
    },
    amount: "1200000",
    initial_payment_amount: "1200000",
    currency: "VND",
    transfer_content: "CSA-ABC123",
    bank_bin: "970422",
    bank_name: "MB Bank",
    account_number: "123456789",
    account_name: "NFV FARM",
    qr_payload: {
      acqId: "970422",
      accountNo: "123456789",
      accountName: "NFV FARM",
      amount: "1200000",
      addInfo: "CSA-ABC123",
      format: "text",
      template: "compact2",
    },
    guest_confirmation_token: "guest-secret",
  },
};
const quotePayload = {
  data: {
    quote_token: "quote-token",
    expires_at: "2099-01-01T00:00:00Z",
    request_code: "CSA-ABC123",
    payment: {
      amount: "1200000",
      bank_code: "970422",
      bank_name: "MB Bank",
      account_number: "123456789",
      account_name: "NFV FARM",
      transfer_content: "CSA-ABC123",
    },
    payment_summary: {
      payment_type: "full",
      total_amount: "1200000",
      initial_payment_amount: "1200000",
      installment_count: 1,
      installments: [{ sequence: 1, amount: "1200000", cycle_count: 3 }],
    },
    terms: { version: "CSA_TERMS_V2", locale: "vi", hash: "test" },
    qr_payload: purchasePayload.data.qr_payload,
  },
};

let nextAnimationFrameId = 0;
let animationFrames = new Map<number, FrameRequestCallback>();
const scrollIntoViewMock = vi.fn();
const originalScrollIntoView = Element.prototype.scrollIntoView;

function flushAnimationFrames() {
  const callbacks = [...animationFrames.values()];
  animationFrames.clear();
  act(() => callbacks.forEach((callback) => callback(0)));
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function asQuote(payload: unknown) {
  const source = payload as { data?: typeof purchasePayload.data };
  if (!source.data?.payment_plan) return payload;
  const request = source.data;
  return {
    data: {
      quote_token: "quote-token",
      expires_at: request.expires_at ?? "2099-01-01T00:00:00Z",
      request_code: request.request_code,
      payment: {
        amount: request.initial_payment_amount,
        bank_code: "970422",
        bank_name: request.bank_name,
        account_number: request.account_number,
        account_name: request.account_name,
        transfer_content: request.transfer_content,
      },
      payment_summary: {
        payment_type: request.payment_plan.payment_type,
        total_amount: request.amount,
        initial_payment_amount: request.initial_payment_amount,
        installment_count: request.payment_plan.installment_count,
        installments: request.payment_plan.installments,
      },
      terms: { version: "CSA_TERMS_V2", locale: "vi", hash: "test" },
      qr_payload: request.qr_payload,
    },
  };
}

function installApi({
  user = null,
  create = quotePayload,
  createStatus = 201,
  pendingCreate,
  confirm = purchasePayload,
  confirmStatus = 200,
  packages = packagePayload,
  packageStatus = 200,
  packageResponse,
  wardResponse,
  sessionResponse,
}: {
  user?: Record<string, unknown> | null;
  create?: unknown;
  createStatus?: number;
  pendingCreate?: Promise<Response>;
  confirm?: unknown;
  confirmStatus?: number;
  packages?: unknown;
  packageStatus?: number;
  packageResponse?: (
    page: number,
    locale: string,
    init?: RequestInit,
  ) => Promise<Response>;
  wardResponse?: (
    provinceCode: string,
    init?: RequestInit,
  ) => Promise<Response>;
  sessionResponse?: (call: number) => Response;
} = {}) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let sessionCall = 0;
  const fetchMock = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.includes("membership-packages")) {
        const query = new URL(url, "http://localhost").searchParams;
        if (packageResponse)
          return packageResponse(
            Number(query.get("page")),
            query.get("locale") ?? "",
            init,
          );
        const data = packages as { data?: unknown[]; meta?: unknown };
        return json(
          data?.data && !data.meta
            ? {
                ...data,
                meta: { page: 1, page_size: 30, total: data.data.length },
              }
            : packages,
          packageStatus,
        );
      }
      if (url.includes("administrative-provinces"))
        return json({
          data: [
            { code: "66", name: "Đồng Tháp" },
            { code: "01", name: "Hà Nội" },
          ],
        });
      if (url.includes("administrative-wards") && wardResponse)
        return wardResponse(
          new URL(url, "http://localhost").searchParams.get("province") ?? "",
          init,
        );
      if (url.includes("administrative-wards"))
        return json({ data: [{ code: "22015", name: "Phường Mỹ Ngãi" }] });
      if (url === "/api/auth/session")
        return sessionResponse
          ? sessionResponse(sessionCall++)
          : json({ data: { user } });
      if (url.endsWith("/confirm-transfer"))
        return json(confirm, confirmStatus);
      if (url.includes("csa-payment-quotes"))
        return pendingCreate
          ? pendingCreate
          : json(asQuote(create), createStatus);
      if (url.includes("csa-purchase-requests"))
        return pendingCreate ? pendingCreate : json(create, createStatus);
      throw new Error(`Unexpected request: ${url}`);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

async function choosePackage() {
  fireEvent.click(await screen.findByRole("button", { name: /Gói Rau/ }));
  fireEvent.click(screen.getByRole("button", { name: /3 tháng/ }));
}

function continueWizard() {
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
}

async function goToGuestInformation() {
  await choosePackage();
  continueWizard();
  await screen.findByRole("heading", { name: "Thông tin của bạn" });
}

async function completeGuest() {
  fireEvent.change(screen.getByLabelText("Họ tên"), {
    target: { value: "Nguyễn Văn An" },
  });
  fireEvent.change(screen.getByLabelText("Số điện thoại"), {
    target: { value: "090 123 4567" },
  });
  fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
    target: { value: "66" },
  });
  await screen.findByRole("option", { name: "Phường Mỹ Ngãi" });
  fireEvent.change(screen.getByLabelText("Phường/xã"), {
    target: { value: "22015" },
  });
  fireEvent.change(screen.getByLabelText("Địa chỉ chi tiết"), {
    target: { value: "Số 12, ngõ 5" },
  });
}

async function goToGuestTerms() {
  await goToGuestInformation();
  await completeGuest();
  continueWizard();
  await screen.findByRole("heading", {
    name: "Chương trình hoạt động thế nào",
  });
}

async function goToAuthenticatedTerms() {
  await choosePackage();
  continueWizard();
  await screen.findByText("Member");
  continueWizard();
  await screen.findByRole("heading", {
    name: "Chương trình hoạt động thế nào",
  });
}

function acceptTerms() {
  fireEvent.click(
    screen.queryByRole("checkbox", { name: "Chọn tất cả" }) ??
      screen.getByRole("checkbox", { name: "Check all" }),
  );
}

function agreementCheckboxes() {
  return screen
    .getAllByRole("checkbox")
    .filter((checkbox) => checkbox.getAttribute("name") === "csa_program_term");
}

beforeEach(() => {
  nextAnimationFrameId = 0;
  animationFrames = new Map();
  scrollIntoViewMock.mockReset();
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoViewMock,
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = ++nextAnimationFrameId;
    animationFrames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    animationFrames.delete(id);
  });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => {
  cleanup();
  if (originalScrollIntoView) {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: originalScrollIntoView,
    });
  } else {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CSA purchase wizard", () => {
  it("keeps both localized incomplete-profile notices complete", () => {
    expect(getCSAPurchaseCopy("vi").profileIncomplete).toBe(
      "Thông tin Auth Account chưa đầy đủ. Vui lòng cập nhật họ tên, số điện thoại và địa chỉ trước khi mua CSA.",
    );
    expect(getCSAPurchaseCopy("en").profileIncomplete).toBe(
      "Your Auth Account profile is incomplete. Update your name, phone number and address before purchasing CSA.",
    );
    expect(getCSAPurchaseCopy("vi").updateAccount).toBe(
      "Cập nhật thông tin tài khoản",
    );
    expect(getCSAPurchaseCopy("en").updateAccount).toBe(
      "Update account information",
    );
  });

  it("uses only the qr_only VietQR image template and preserves encoded payment fields", () => {
    const request = {
      ...purchasePayload.data,
      qr_payload: {
        ...purchasePayload.data.qr_payload,
        addInfo: "CSA ABC+123",
      },
    } as CSAPurchaseRequestCreated;
    const qrUrl = buildVietQRUrl(request);
    const url = new URL(qrUrl);

    expect(url.origin).toBe("https://img.vietqr.io");
    expect(url.pathname).toBe("/image/970422-123456789-qr_only.png");
    expect(url.searchParams.get("amount")).toBe("1200000");
    expect(url.searchParams.get("addInfo")).toBe("CSA ABC+123");
    expect(url.searchParams.get("accountName")).toBe("NFV FARM");
    expect(qrUrl).toContain("addInfo=CSA+ABC%2B123");
    expect(qrUrl).not.toMatch(/-(?:compact2|compact|print)\.png/);
  });

  it("keeps guest selection, identity, and consent across a locale route remount", async () => {
    const { calls } = installApi();
    const { rerender } = render(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="vi" locale="vi" />
      </CSAFlowStateProvider>,
    );
    await goToGuestTerms();
    acceptTerms();
    rerender(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="en" locale="en" />
      </CSAFlowStateProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "How the program works",
      }),
    ).toBeVisible();
    expect(agreementCheckboxes()).toHaveLength(11);
    agreementCheckboxes().forEach((checkbox) => expect(checkbox).toBeChecked());
    expect(screen.getByRole("checkbox", { name: "Check all" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      await screen.findByRole("heading", { name: "Your information" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Full name")).toHaveValue("Nguyễn Văn An");
    expect(screen.getByLabelText("Phone number")).toHaveValue("0901234567");
    expect(screen.getByLabelText("Detailed address")).toHaveValue(
      "Số 12, ngõ 5",
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      await screen.findByRole("heading", {
        name: "Packages open for registration",
      }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /Gói Rau/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /3 month/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(0);
    expect(
      calls.filter((call) => call.url === "/api/auth/session"),
    ).toHaveLength(2);
  });

  it("keeps authenticated identity and consent after revalidating the session on locale remount", async () => {
    const { calls } = installApi({ user: member });
    const { rerender } = render(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="vi" locale="vi" />
      </CSAFlowStateProvider>,
    );
    await goToAuthenticatedTerms();
    acceptTerms();
    rerender(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="en" locale="en" />
      </CSAFlowStateProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "How the program works",
      }),
    ).toBeVisible();
    expect(agreementCheckboxes()).toHaveLength(11);
    agreementCheckboxes().forEach((checkbox) => expect(checkbox).toBeChecked());
    expect(screen.getByRole("checkbox", { name: "Check all" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByText("Member")).toBeVisible();
    expect(
      calls.filter((call) => call.url === "/api/auth/session"),
    ).toHaveLength(2);
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(0);
  });

  it("keeps an already-created request and QR across locale remount without creating again", async () => {
    const { calls } = installApi();
    const { rerender } = render(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="vi" locale="vi" />
      </CSAFlowStateProvider>,
    );
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    const qr = await screen.findByAltText("Mã VietQR để chuyển khoản mua CSA");
    const qrUrl = qr.getAttribute("src");
    rerender(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="en" locale="en" />
      </CSAFlowStateProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Payment" }),
    ).toBeVisible();
    expect(
      screen.getByAltText("VietQR code for CSA bank transfer"),
    ).toHaveAttribute("src", qrUrl);
    expect(screen.getByText("MB Bank")).toBeVisible();
    expect(screen.getByText("CSA-ABC123")).toBeVisible();
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(1);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.search).not.toContain("guest-secret");
  });

  it("keeps an in-flight guest creation and its one-time token across a locale remount", async () => {
    let resolveCreate!: (response: Response) => void;
    const pendingCreate = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });
    const { calls } = installApi({ pendingCreate });
    const memory: { current: CSAPurchaseFlowMemory | null } = { current: null };
    function MemoryProbe() {
      memory.current = useCSAFlowState().purchase;
      return null;
    }
    const { rerender } = render(
      <CSAFlowStateProvider>
        <MemoryProbe />
        <CSAPurchasePage key="vi" locale="vi" />
      </CSAFlowStateProvider>,
    );
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(1);

    rerender(
      <CSAFlowStateProvider>
        <MemoryProbe />
        <CSAPurchasePage key="en" locale="en" />
      </CSAFlowStateProvider>,
    );
    expect(
      await screen.findByText("Preparing secure payment details…"),
    ).toBeVisible();
    resolveCreate(json(quotePayload, 201));

    expect(
      await screen.findByAltText("VietQR code for CSA bank transfer"),
    ).toBeVisible();
    expect(screen.getByText("CSA-ABC123")).toBeVisible();
    expect(memory.current?.quote?.quote_token).toBe("quote-token");
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(1);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.href).not.toMatch(/guest-secret|0901234567/);
  });

  it("rejects a malformed quote response without retaining it or exposing payment actions", async () => {
    const malformedQuote = {
      ...quotePayload,
      data: {
        ...quotePayload.data,
        payment: {
          ...quotePayload.data.payment,
          bank_name: "",
        },
      },
    };
    const { calls } = installApi({ create: malformedQuote });
    const memory: { current: CSAPurchaseFlowMemory | null } = { current: null };
    function MemoryProbe() {
      memory.current = useCSAFlowState().purchase;
      return null;
    }
    render(
      <CSAFlowStateProvider>
        <MemoryProbe />
        <CSAPurchasePage locale="vi" />
      </CSAFlowStateProvider>,
    );

    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );

    expect(
      await screen.findByText(
        "Thông tin thanh toán không khả dụng. Vui lòng tạo lại trước khi chuyển khoản.",
      ),
    ).toBeVisible();
    expect(memory.current?.quote).toBeNull();
    expect(
      screen.queryByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Tôi đã chuyển khoản" }),
    ).toBeNull();
    expect(
      calls.filter((call) => call.url.endsWith("/confirm-transfer")),
    ).toHaveLength(0);
  });

  it.each([
    [
      "name",
      async () => {
        fireEvent.change(screen.getByLabelText("Họ tên"), {
          target: { value: "Nguyễn Văn Bình" },
        });
      },
    ],
    [
      "phone",
      async () => {
        fireEvent.change(screen.getByLabelText("Số điện thoại"), {
          target: { value: "090 123 4568" },
        });
      },
    ],
    [
      "province",
      async () => {
        fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
          target: { value: "01" },
        });
        await screen.findByRole("option", { name: "Phường Mỹ Ngãi" });
        fireEvent.change(screen.getByLabelText("Phường/xã"), {
          target: { value: "22015" },
        });
      },
    ],
    [
      "ward",
      async () => {
        fireEvent.change(screen.getByLabelText("Phường/xã"), {
          target: { value: "22015" },
        });
      },
    ],
    [
      "address",
      async () => {
        fireEvent.change(screen.getByLabelText("Địa chỉ chi tiết"), {
          target: { value: "Số 99, đường mới" },
        });
      },
    ],
  ])(
    "invalidates an existing quote when the guest changes %s",
    async (_field, updateIdentity: () => Promise<void>) => {
      const { calls } = installApi();
      const memory: { current: CSAPurchaseFlowMemory | null } = {
        current: null,
      };
      function MemoryProbe() {
        memory.current = useCSAFlowState().purchase;
        return null;
      }
      render(
        <CSAFlowStateProvider>
          <MemoryProbe />
          <CSAPurchasePage locale="vi" />
        </CSAFlowStateProvider>,
      );

      await goToGuestTerms();
      acceptTerms();
      fireEvent.click(
        screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
      );
      await screen.findByAltText("Mã VietQR để chuyển khoản mua CSA");
      await waitFor(() => expect(memory.current?.quote).toBeDefined());

      fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
      await screen.findByRole("heading", {
        name: "Chương trình hoạt động thế nào",
      });
      fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
      await screen.findByRole("heading", { name: "Thông tin của bạn" });
      await updateIdentity();

      await waitFor(() => expect(memory.current?.quote).toBeNull());
      expect(
        calls.filter((call) => call.url.endsWith("/confirm-transfer")),
      ).toHaveLength(0);

      continueWizard();
      fireEvent.click(
        screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
      );
      await screen.findByAltText("Mã VietQR để chuyển khoản mua CSA");
      expect(
        calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
      ).toHaveLength(2);
    },
  );

  it("hides payment and lets the guest reset an already-expired request", async () => {
    const { calls } = installApi({
      create: {
        data: { ...purchasePayload.data, expires_at: "2020-01-01T00:00:00Z" },
      },
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );

    expect(
      await screen.findByText(/Thông tin thanh toán này đã hết hạn/),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Tôi đã chuyển khoản" }),
    ).toBeNull();
    expect(
      screen.queryByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tạo yêu cầu mới" }));
    expect(
      await screen.findByRole("heading", { name: "Gói đang mở đăng ký" }),
    ).toBeVisible();
    continueWizard();
    expect(await screen.findByLabelText("Họ tên")).toHaveValue("");
    expect(screen.getByLabelText("Số điện thoại")).toHaveValue("");
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(1);
  });

  it("turns a backend expired confirmation into a terminal payment state", async () => {
    const { calls } = installApi({
      confirm: { errors: [{ code: "csa_purchase_request_expired" }] },
      confirmStatus: 409,
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Tôi đã chuyển khoản" }),
    );

    expect(
      await screen.findByText(/Thông tin thanh toán này đã hết hạn/),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Tôi đã chuyển khoản" }),
    ).toBeNull();
    expect(
      screen.queryByText("Không thể hoàn tất yêu cầu. Vui lòng thử lại sau."),
    ).toBeNull();
    expect(
      calls.filter((call) => call.url.endsWith("/confirm-transfer")),
    ).toHaveLength(1);
  });

  it("never restores User A's purchase or identity under User B's session", async () => {
    const { fetchMock, calls } = installApi({ user: member });
    let currentUser: Record<string, unknown> | null = member;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
        String(input) === "/api/auth/session"
          ? Promise.resolve(json({ data: { user: currentUser } }))
          : fetchMock(input, init),
      ),
    );
    const { rerender } = render(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="user-a" locale="vi" />
      </CSAFlowStateProvider>,
    );
    await goToAuthenticatedTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    await screen.findByText("CSA-ABC123");

    currentUser = {
      ...member,
      sub: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "User B",
    };
    rerender(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="user-b" locale="en" />
      </CSAFlowStateProvider>,
    );
    expect(screen.queryByText("CSA-ABC123")).toBeNull();
    expect(screen.queryByText("Member")).toBeNull();
    await screen.findByRole("heading", {
      name: "Packages open for registration",
    });
    expect(screen.queryByText("CSA-ABC123")).toBeNull();
    const continueButton = screen.getByRole("button", { name: "Continue" });
    await waitFor(() => expect(continueButton).toBeEnabled());
    fireEvent.click(continueButton);
    expect(await screen.findByText("User B")).toBeVisible();
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(1);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.href).not.toMatch(
      /guest-secret|0901234567|CSA-ABC123/,
    );
  });

  it("drops guest purchase memory when the same tab becomes authenticated", async () => {
    const { fetchMock } = installApi();
    let currentUser: Record<string, unknown> | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
        String(input) === "/api/auth/session"
          ? Promise.resolve(json({ data: { user: currentUser } }))
          : fetchMock(input, init),
      ),
    );
    const { rerender } = render(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="guest" locale="vi" />
      </CSAFlowStateProvider>,
    );
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    await screen.findByText("CSA-ABC123");

    currentUser = member;
    rerender(
      <CSAFlowStateProvider>
        <CSAPurchasePage key="member" locale="en" />
      </CSAFlowStateProvider>,
    );
    expect(screen.queryByText("CSA-ABC123")).toBeNull();
    await screen.findByRole("heading", {
      name: "Packages open for registration",
    });
    const continueButton = screen.getByRole("button", { name: "Continue" });
    await waitFor(() => expect(continueButton).toBeEnabled());
    fireEvent.click(continueButton);
    expect(await screen.findByText("Member")).toBeVisible();
    expect(screen.queryByLabelText("Full name")).toBeNull();
  });

  it("keeps success and the request code across locale changes until an explicit reset", async () => {
    const { calls } = installApi();
    const memory: { current: CSAPurchaseFlowMemory | null } = {
      current: null,
    };
    function MemoryProbe() {
      const { purchase, clearPurchase } = useCSAFlowState();
      memory.current = purchase;
      return <button onClick={clearPurchase}>Reset purchase memory</button>;
    }
    const { rerender } = render(
      <CSAFlowStateProvider>
        <MemoryProbe />
        <CSAPurchasePage key="vi" locale="vi" />
      </CSAFlowStateProvider>,
    );
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    await screen.findByAltText("Mã VietQR để chuyển khoản mua CSA");
    await waitFor(() =>
      expect(memory.current?.quote?.quote_token).toBe("quote-token"),
    );
    expect(memory.current?.selectedPackageId).toBe(packageId);
    expect(memory.current?.selectedOptionId).toBe(optionId);
    expect(memory.current?.selectedPlanId).toBe(planId);
    expect(memory.current?.guest.name).toBe("Nguyễn Văn An");
    expect(memory.current?.termsAccepted).toBe(true);
    expect(memory.current?.step).toBe(4);

    fireEvent.click(
      screen.getByRole("button", { name: "Tôi đã chuyển khoản" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Yêu cầu đã được gửi" }),
    ).toBeVisible();
    await waitFor(() => expect(memory.current?.confirmed).toBe(true));
    const callsAfterConfirmation = calls.length;
    rerender(
      <CSAFlowStateProvider>
        <MemoryProbe />
        <CSAPurchasePage key="en" locale="en" />
      </CSAFlowStateProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Request submitted" }),
    ).toBeVisible();
    expect(screen.getByText("CSA-ABC123")).toHaveClass("code");
    expect(
      screen.getByRole("link", { name: "Track request later" }),
    ).toHaveAttribute("href", "/csa/track/en");
    expect(
      screen.queryByRole("button", { name: "I have transferred" }),
    ).toBeNull();
    expect(calls).toHaveLength(callsAfterConfirmation + 1);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.href).not.toContain("guest-secret");
    expect(window.location.href).not.toContain("0901234567");

    fireEvent.click(
      screen.getByRole("button", { name: "Reset purchase memory" }),
    );
    expect(memory.current).toBeNull();
    rerender(
      <CSAFlowStateProvider>
        <MemoryProbe />
        <CSAPurchasePage key="after-reset" locale="en" />
      </CSAFlowStateProvider>,
    );
    expect(
      screen.queryByRole("heading", { name: "Request submitted" }),
    ).toBeNull();
    expect(
      await screen.findByRole("heading", {
        name: "Packages open for registration",
      }),
    ).toBeVisible();
  });

  it.each([
    [
      "csa_purchase_package_unavailable",
      409,
      "Gói hoặc thời hạn này không còn khả dụng. Vui lòng chọn lại.",
    ],
    [
      "csa_purchase_payment_unavailable",
      503,
      "Chuyển khoản đang tạm thời không khả dụng. Vui lòng liên hệ đội ngũ hỗ trợ.",
    ],
    [
      "invalid_csa_purchase_address",
      400,
      "Vui lòng kiểm tra lại số điện thoại và thông tin địa chỉ.",
    ],
    [
      "csa_purchase_request_not_pending",
      409,
      "Yêu cầu này không còn ở trạng thái chờ xác nhận.",
    ],
    [
      "throttled",
      429,
      "Bạn thao tác quá nhiều lần. Vui lòng chờ và thử lại sau.",
    ],
  ])("maps %s to localized, safe copy", (code, status, message) => {
    expect(purchaseErrorMessage(new AccountApiError(code, status), "vi")).toBe(
      message,
    );
  });

  it("renders four-step progress, one step at a time, and updates the API-backed summary", async () => {
    installApi();
    const { container } = render(<CSAPurchasePage locale="vi" />);

    await screen.findByRole("heading", { name: "Gói đang mở đăng ký" });

    expect(container.querySelector(".csa-ui .shell .app-card")).not.toBeNull();
    expect(container.querySelector(".topbar")).toBeNull();
    expect(container.querySelector(".brand")).toBeNull();
    expect(container.querySelector(".tabs")).toBeNull();
    expect(container.querySelector(".content .wizard-layout")).not.toBeNull();
    expect(
      container.querySelector(".wizard-layout > .main-panel > .step"),
    ).not.toBeNull();
    expect(container.querySelector(".wizard-layout > .main-panel")).toHaveClass(
      "package-step-panel",
    );
    expect(container.querySelector(".wizard-layout > .progress")).toBeNull();
    expect(container.querySelector(".section-head")).toBeNull();
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "Chọn gói phù hợp cho gia đình",
      }),
    ).toBeNull();
    expect(screen.queryByText("CSA Demo")).toBeNull();
    expect(
      screen.queryByText("Prototype giao diện đăng ký & tra cứu"),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Mua gói CSA" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tra cứu yêu cầu" })).toBeNull();

    const progress = screen.getByRole("list", { name: "Tiến trình mua CSA" });
    expect(container.querySelector(".content")?.firstElementChild).toBe(
      progress,
    );
    expect(within(progress).getAllByRole("listitem")).toHaveLength(4);
    expect(
      within(progress).getByText("1. Chọn gói").closest("li"),
    ).toHaveAttribute("aria-current", "step");
    expect(
      screen.getByRole("heading", { name: "Gói đang mở đăng ký" }),
    ).toBeVisible();
    expect(screen.queryByText("Gói CSA đang mở đăng ký")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Thời hạn đăng ký" }),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Chọn thời hạn" })).toBeNull();
    expect(screen.queryByLabelText("Họ tên")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    const packageCard = await screen.findByRole("button", { name: /Gói Rau/ });
    const defaultOption = screen.getByRole("button", { name: /3 tháng/ });
    const next = screen.getByRole("button", { name: "Tiếp tục" });
    expect(packageCard).toHaveAttribute("aria-pressed", "true");
    expect(defaultOption).toHaveAttribute("aria-pressed", "true");
    expect(next).toBeEnabled();
    expect(
      container.querySelector(
        ".package-choice-grid > .package-list > .package-option",
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(".package-choice-grid > .duration-panel"),
    ).not.toBeNull();
    expect(
      container.querySelector(
        ".duration-panel .duration-list > .duration-choice",
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(".duration-panel .chosen-total"),
    ).not.toBeNull();
    expect(container.querySelector(".packages, .package, .options")).toBeNull();
    expect(screen.getByText(/^3 tháng/)).toBeVisible();
    expect(screen.getAllByText(/1\.200\.000/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Tiết kiệm/)).toBeNull();
    expect(screen.getByText("Rau lá")).toBeVisible();
    expect(screen.getByText("1 kg")).toBeVisible();
    expect(next).toBeEnabled();
    continueWizard();
    expect(
      await screen.findByRole("heading", { name: "Thông tin của bạn" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Gói đang mở đăng ký" }),
    ).toBeNull();
  });

  it("scrolls and focuses only after moving to a new wizard step", async () => {
    const windowScrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    installApi();
    render(<CSAPurchasePage locale="vi" />);

    await screen.findByRole("heading", { name: "Gói đang mở đăng ký" });
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    await choosePackage();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    continueWizard();
    const informationHeading = await screen.findByRole("heading", {
      name: "Thông tin của bạn",
    });
    const headingFocus = vi.spyOn(informationHeading, "focus");
    flushAnimationFrames();

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(scrollIntoViewMock.mock.instances[0]).toBe(
      screen.getByLabelText("Tiến trình mua CSA"),
    );
    expect(scrollIntoViewMock.mock.instances[0]).not.toBe(
      informationHeading.closest(".main-panel"),
    );
    expect(windowScrollTo).not.toHaveBeenCalled();
    expect(headingFocus).toHaveBeenCalledWith({ preventScroll: true });
    expect(informationHeading).toHaveAttribute("tabindex", "-1");
  });

  it("never uses smooth scrolling for step transitions", async () => {
    installApi();
    render(<CSAPurchasePage locale="vi" />);
    await choosePackage();

    continueWizard();
    await screen.findByRole("heading", { name: "Thông tin của bạn" });
    flushAnimationFrames();

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(scrollIntoViewMock.mock.instances[0]).toBe(
      screen.getByLabelText("Tiến trình mua CSA"),
    );
    expect(scrollIntoViewMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
  });

  it("does not scroll when data changes within the current step", async () => {
    installApi();
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestInformation();
    flushAnimationFrames();
    scrollIntoViewMock.mockClear();

    fireEvent.change(screen.getByLabelText("Họ tên"), {
      target: { value: "Nguyễn Văn An" },
    });
    flushAnimationFrames();

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it("focuses and scrolls to the first invalid field without changing step", async () => {
    installApi();
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestInformation();
    flushAnimationFrames();
    scrollIntoViewMock.mockClear();
    const name = screen.getByLabelText("Họ tên");
    const nameFocus = vi.spyOn(name, "focus");

    fireEvent.submit(name.closest("form")!);
    await screen.findAllByText("Vui lòng nhập thông tin này.");
    flushAnimationFrames();

    expect(
      screen.getByRole("heading", { name: "Thông tin của bạn" }),
    ).toBeVisible();
    expect(nameFocus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
    });
    expect(scrollIntoViewMock.mock.instances[0]).toBe(name);
    expect(scrollIntoViewMock.mock.instances[0]).not.toBe(
      screen.getByLabelText("Tiến trình mua CSA"),
    );
  });

  it("keeps entered information when moving back and does not refetch step data", async () => {
    const { calls } = installApi();
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    flushAnimationFrames();
    const requestCount = calls.length;
    scrollIntoViewMock.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
    await screen.findByRole("heading", { name: "Thông tin của bạn" });
    flushAnimationFrames();
    expect(scrollIntoViewMock.mock.instances[0]).toBe(
      screen.getByLabelText("Tiến trình mua CSA"),
    );
    expect(screen.getByLabelText("Họ tên")).toHaveValue("Nguyễn Văn An");
    expect(screen.getByLabelText("Số điện thoại")).toHaveValue("0901234567");
    expect(screen.getByLabelText("Địa chỉ chi tiết")).toHaveValue(
      "Số 12, ngõ 5",
    );

    scrollIntoViewMock.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
    await screen.findByRole("heading", { name: "Gói đang mở đăng ký" });
    flushAnimationFrames();
    expect(scrollIntoViewMock.mock.instances[0]).toBe(
      screen.getByLabelText("Tiến trình mua CSA"),
    );

    continueWizard();
    await screen.findByRole("heading", { name: "Thông tin của bạn" });
    flushAnimationFrames();
    expect(screen.getByLabelText("Họ tên")).toHaveValue("Nguyễn Văn An");

    continueWizard();
    await screen.findByRole("heading", {
      name: "Chương trình hoạt động thế nào",
    });
    flushAnimationFrames();
    expect(calls).toHaveLength(requestCount);
  });

  it("uses the current duration monthly price as its buying-monthly baseline", async () => {
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                duration_months: 1,
                monthly_price_vnd: "300000",
                total_price_vnd: "300000",
                payment_plans: [
                  {
                    ...packagePayload.data[0].price_options[0].payment_plans[0],
                    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                    total_amount: "300000",
                    installments: [
                      { sequence: 1, amount: "300000", cycle_count: 1 },
                    ],
                  },
                ],
              },
              {
                ...packagePayload.data[0].price_options[0],
                duration_months: 6,
                monthly_price_vnd: "900000",
                total_price_vnd: "5000000",
                payment_plans: [
                  {
                    ...packagePayload.data[0].price_options[0].payment_plans[0],
                    total_amount: "5000000",
                    installments: [
                      { sequence: 1, amount: "5000000", cycle_count: 6 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);

    expect(await screen.findByText("6 tháng")).toBeVisible();
    expect(screen.getByText("Tiết kiệm 7,41%")).toBeVisible();
    expect(screen.getByText("Mua từng tháng: 5.400.000 ₫")).toBeVisible();
    expect(screen.getByText("Tiết kiệm: 400.000 ₫ · 7,41%")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /1 tháng/ }),
    ).not.toHaveTextContent(/Tiết kiệm|Giảm/);
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeEnabled();
  });

  it("does not show duration savings when the current monthly price is invalid", async () => {
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                duration_months: 6,
                monthly_price_vnd: "0",
                total_price_vnd: "2400000",
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);

    await screen.findByRole("button", { name: /6 tháng/ });
    expect(screen.queryByText(/Tiết kiệm|Giảm .*mua từng tháng/)).toBeNull();
  });

  it("does not show savings when the option total is not below the baseline", async () => {
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                duration_months: 1,
                total_price_vnd: "400000",
              },
              packagePayload.data[0].price_options[0],
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);

    await screen.findByRole("button", { name: /1 tháng/ });
    expect(screen.queryByText(/Tiết kiệm|Giảm .*mua từng tháng/)).toBeNull();
    expect(screen.getAllByText(/1\.200\.000/).length).toBeGreaterThan(0);
  });

  it("renders the current-duration saving copy in English", async () => {
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                duration_months: 6,
                monthly_price_vnd: "900000",
                total_price_vnd: "5000000",
                payment_plans: [
                  {
                    ...packagePayload.data[0].price_options[0].payment_plans[0],
                    total_amount: "5000000",
                    installments: [
                      { sequence: 1, amount: "5000000", cycle_count: 6 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="en" />);

    expect(await screen.findByText("Save 7.41%")).toBeVisible();
    expect(screen.getByText(/Buying monthly:.*5,400,000/)).toBeVisible();
    expect(screen.getByText(/Save:.*400,000.*7\.41%/)).toBeVisible();
  });

  it("preserves the backend's oldest-to-newest package response order", async () => {
    const oldestId = "66666666-6666-4666-8666-666666666666";
    const middleId = "77777777-7777-4777-8777-777777777777";
    const newestId = "88888888-8888-4888-8888-888888888888";
    installApi({
      packages: {
        data: [
          { ...packagePayload.data[0], id: oldestId, name: "Gói cũ nhất" },
          { ...packagePayload.data[0], id: middleId, name: "Gói ở giữa" },
          { ...packagePayload.data[0], id: newestId, name: "Gói mới nhất" },
        ],
      },
    });
    const { container } = render(<CSAPurchasePage locale="vi" />);

    expect(
      await screen.findByRole("button", { name: /Gói cũ nhất/ }),
    ).toHaveAttribute("aria-pressed", "true");
    const packageIds = Array.from(
      container.querySelectorAll(".package-list > .package-option"),
    ).map((item) => item.getAttribute("data-package"));
    expect(packageIds).toEqual([oldestId, middleId, newestId]);
  });

  it("loads every package page in backend order and stops at the reported total", async () => {
    const first = {
      ...packagePayload.data[0],
      id: "66666666-6666-4666-8666-666666666666",
      name: "Gói đầu",
      price_options: [],
    };
    const second = {
      ...packagePayload.data[0],
      id: "77777777-7777-4777-8777-777777777777",
      name: "Gói kế",
    };
    const third = {
      ...packagePayload.data[0],
      id: "88888888-8888-4888-8888-888888888888",
      name: "Gói cuối",
    };
    const pages = [first, second, third];
    const { calls } = installApi({
      packageResponse: async (page) =>
        json({
          data: [pages[page - 1]],
          meta: { page, page_size: 1, total: pages.length },
        }),
    });
    const { container } = render(<CSAPurchasePage locale="vi" />);

    expect(
      await screen.findByRole("button", { name: /Gói cuối/ }),
    ).toBeVisible();
    expect(
      Array.from(container.querySelectorAll(".package-option")).map((item) =>
        item.getAttribute("data-package"),
      ),
    ).toEqual(pages.map((item) => item.id));
    expect(screen.getByRole("button", { name: /Gói đầu/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Gói kế/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeEnabled();
    expect(
      calls
        .filter((call) => call.url.includes("membership-packages"))
        .map((call) => call.url),
    ).toEqual([
      "/api/account/membership-packages?page=1&locale=vi",
      "/api/account/membership-packages?page=2&locale=vi",
      "/api/account/membership-packages?page=3&locale=vi",
    ]);
  });

  it("does not present a partial catalog if a later package page fails", async () => {
    const { calls } = installApi({
      packageResponse: async (page) =>
        page === 1
          ? json({
              data: [packagePayload.data[0]],
              meta: { page: 1, page_size: 1, total: 2 },
            })
          : json({ errors: [{ code: "request_failed" }] }, 503),
    });
    render(<CSAPurchasePage locale="vi" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải");
    expect(screen.queryByRole("button", { name: /Gói Rau/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
    expect(
      calls.filter((call) => call.url.includes("membership-packages")),
    ).toHaveLength(2);
  });

  it("ignores an unfinished locale catalog and requests the new locale only once", async () => {
    let resolveOldPage!: (response: Response) => void;
    const oldPage = new Promise<Response>((resolve) => {
      resolveOldPage = resolve;
    });
    const { calls } = installApi({
      packageResponse: async (page, requestLocale) => {
        if (requestLocale === "vi" && page === 2) return oldPage;
        if (requestLocale === "vi")
          return json({
            data: [packagePayload.data[0]],
            meta: { page: 1, page_size: 1, total: 2 },
          });
        return json({
          data: [{ ...packagePayload.data[0], name: "English package" }],
          meta: { page: 1, page_size: 30, total: 1 },
        });
      },
    });
    const { rerender } = render(
      <CSAFlowStateProvider>
        <CSAPurchasePage locale="vi" />
      </CSAFlowStateProvider>,
    );
    await waitFor(() =>
      expect(calls.some((call) => call.url.includes("page=2&locale=vi"))).toBe(
        true,
      ),
    );
    rerender(
      <CSAFlowStateProvider>
        <CSAPurchasePage locale="en" />
      </CSAFlowStateProvider>,
    );
    expect(
      await screen.findByRole("button", { name: /English package/ }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: /English package/ }),
    ).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      resolveOldPage(
        json({
          data: [packagePayload.data[0]],
          meta: { page: 2, page_size: 1, total: 2 },
        }),
      );
      await oldPage;
    });
    expect(screen.queryByRole("button", { name: /Gói Rau/ })).toBeNull();
    expect(
      calls.filter((call) =>
        call.url.includes("membership-packages?page=1&locale=en"),
      ),
    ).toHaveLength(1);
    expect(
      calls.filter((call) =>
        call.url.includes("membership-packages?page=2&locale=en"),
      ),
    ).toHaveLength(0);
  });

  it("skips a disabled first package and selects the next valid package and option", async () => {
    const validPackageId = "88888888-8888-4888-8888-888888888888";
    const validOptionId = "99999999-9999-4999-8999-999999999999";
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            id: "66666666-6666-4666-8666-666666666666",
            name: "Gói chưa mở thời hạn",
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                id: "77777777-7777-4777-8777-777777777777",
                is_active: false,
              },
            ],
          },
          {
            ...packagePayload.data[0],
            id: validPackageId,
            name: "Gói hợp lệ kế tiếp",
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                id: validOptionId,
              },
            ],
          },
          {
            ...packagePayload.data[0],
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            name: "Gói đã đóng",
            is_active: false,
          },
        ],
      },
    });
    const { container } = render(<CSAPurchasePage locale="vi" />);

    const disabledPackage = await screen.findByRole("button", {
      name: /Gói chưa mở thời hạn/,
    });
    expect(disabledPackage).toBeDisabled();
    expect(disabledPackage).toHaveAttribute("aria-pressed", "false");
    expect(disabledPackage).toHaveClass("package-option");
    expect(
      screen.getByRole("button", { name: /Gói hợp lệ kế tiếp/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /3 tháng/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("Gói đã đóng")).toBeNull();
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeEnabled();
    expect(container.querySelectorAll(".package-option")).toHaveLength(2);
  });

  it("validates guest fields inline, normalizes phone, loads wards lazily and posts unchanged data", async () => {
    const { calls } = installApi();
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestInformation();
    expect(
      calls.some((call) => call.url.includes("administrative-wards")),
    ).toBe(false);

    fireEvent.submit(
      screen
        .getByRole("heading", { name: "Thông tin của bạn" })
        .closest("form")!,
    );
    expect(
      screen.getAllByText("Vui lòng nhập thông tin này.").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("Vui lòng nhập số điện thoại Việt Nam hợp lệ."),
    ).toBeVisible();
    await completeGuest();
    expect(screen.getByLabelText("Số điện thoại")).toHaveValue("0901234567");
    fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
      target: { value: "01" },
    });
    expect(screen.getByLabelText("Phường/xã")).toHaveValue("");
    expect(
      calls.filter((call) => call.url.includes("administrative-wards")),
    ).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
      target: { value: "66" },
    });
    await screen.findByRole("option", { name: "Phường Mỹ Ngãi" });
    fireEvent.change(screen.getByLabelText("Phường/xã"), {
      target: { value: "22015" },
    });
    continueWizard();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );

    await screen.findByRole("heading", { name: "Thanh toán" });
    const createCall = calls.find(
      (call) => call.url === "/api/account/csa-payment-quotes",
    );
    expect(JSON.parse(String(createCall?.init?.body))).toEqual({
      package_id: packageId,
      price_option_id: optionId,
      payment_plan_id: planId,
      terms_accepted: true,
      terms_locale: "vi",
      guest_identity: {
        name: "Nguyễn Văn An",
        phone: "+84901234567",
        province_code: "66",
        ward_code: "22015",
        address: "Số 12, ngõ 5",
      },
    });
  });

  it("sorts province and ward choices alphabetically by their localized names", async () => {
    const { calls } = installApi({
      wardResponse: async () =>
        json({
          data: [
            { code: "2", name: "Xã Zeta" },
            { code: "1", name: "Xã Alpha" },
          ],
        }),
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestInformation();

    const provinceOptions = screen
      .getByLabelText("Tỉnh/thành phố")
      .querySelectorAll("option");
    expect([...provinceOptions].map((option) => option.textContent)).toEqual([
      "Chọn tỉnh/thành phố",
      "Đồng Tháp",
      "Hà Nội",
    ]);

    fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
      target: { value: "66" },
    });
    await screen.findByRole("option", { name: "Xã Alpha" });
    const wardOptions = screen
      .getByLabelText("Phường/xã")
      .querySelectorAll("option");
    expect([...wardOptions].map((option) => option.textContent)).toEqual([
      "Chọn phường/xã",
      "Xã Alpha",
      "Xã Zeta",
    ]);
    expect(
      calls.some((call) => call.url.includes("administrative-wards")),
    ).toBe(true);
  });

  it("shows guest input hints and validates an invalid phone number immediately", async () => {
    installApi();
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestInformation();

    expect(screen.getByLabelText("Họ tên")).toHaveAttribute(
      "placeholder",
      "Nhập đầy đủ họ và tên để ghi trên hợp đồng.",
    );
    expect(screen.getByLabelText("Số điện thoại")).toHaveAttribute(
      "placeholder",
      "0987654321",
    );
    expect(screen.getByLabelText("Địa chỉ chi tiết")).toHaveAttribute(
      "placeholder",
      "Nhập số nhà, tên đường/thôn/ấp và thông tin cần thiết để giao hàng.",
    );

    const phoneInput = screen.getByLabelText("Số điện thoại");
    fireEvent.change(phoneInput, { target: { value: "123" } });
    expect(phoneInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Vui lòng nhập số điện thoại Việt Nam hợp lệ.",
    );
  });

  it("ignores an older province response and keeps the ward selector tied to the latest province", async () => {
    let resolveA!: (response: Response) => void;
    let resolveB!: (response: Response) => void;
    const responseA = new Promise<Response>((resolve) => {
      resolveA = resolve;
    });
    const responseB = new Promise<Response>((resolve) => {
      resolveB = resolve;
    });
    const { calls } = installApi({
      wardResponse: (provinceCode) =>
        provinceCode === "66" ? responseA : responseB,
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestInformation();

    fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
      target: { value: "66" },
    });
    expect(screen.getByLabelText("Phường/xã")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
      target: { value: "01" },
    });
    expect(screen.getByLabelText("Phường/xã")).toHaveValue("");
    expect(screen.getByLabelText("Phường/xã")).toBeDisabled();
    expect(
      calls.filter((call) => call.url.includes("administrative-wards")),
    ).toHaveLength(2);

    await act(async () => {
      resolveB(json({ data: [{ code: "00001", name: "Phường Hà Nội" }] }));
      await responseB;
    });
    expect(
      await screen.findByRole("option", { name: "Phường Hà Nội" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Phường/xã")).toBeEnabled();

    await act(async () => {
      resolveA(json({ data: [{ code: "22015", name: "Phường Mỹ Ngãi" }] }));
      await responseA;
    });
    expect(screen.getByRole("option", { name: "Phường Hà Nội" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "Phường Mỹ Ngãi" })).toBeNull();
    expect(screen.getByLabelText("Phường/xã")).toBeEnabled();
    expect(screen.getByLabelText("Phường/xã")).toHaveValue("");
  });

  it("keeps the ward selector disabled when a stale province request finishes before the latest one", async () => {
    let resolveA!: (response: Response) => void;
    let resolveB!: (response: Response) => void;
    const responseA = new Promise<Response>((resolve) => {
      resolveA = resolve;
    });
    const responseB = new Promise<Response>((resolve) => {
      resolveB = resolve;
    });
    const { calls } = installApi({
      wardResponse: (provinceCode) =>
        provinceCode === "66" ? responseA : responseB,
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestInformation();
    fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
      target: { value: "66" },
    });
    fireEvent.change(screen.getByLabelText("Tỉnh/thành phố"), {
      target: { value: "01" },
    });
    expect(
      calls.filter((call) => call.url.includes("administrative-wards")),
    ).toHaveLength(2);
    expect(
      calls.find((call) => call.url.includes("province=66"))?.init?.signal
        ?.aborted,
    ).toBe(true);

    await act(async () => {
      resolveA(json({ data: [{ code: "22015", name: "Phường Mỹ Ngãi" }] }));
      await responseA;
    });
    expect(screen.getByLabelText("Phường/xã")).toBeDisabled();
    expect(screen.queryByRole("option", { name: "Phường Mỹ Ngãi" })).toBeNull();

    await act(async () => {
      resolveB(json({ data: [{ code: "00001", name: "Phường Hà Nội" }] }));
      await responseB;
    });
    expect(screen.getByLabelText("Phường/xã")).toBeEnabled();
    expect(screen.getByRole("option", { name: "Phường Hà Nội" })).toBeVisible();
  });

  it("renders the 11 individual agreement checkboxes from the Vietnamese document", async () => {
    installApi();
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();

    expect(
      screen.getByRole("heading", {
        name: "Chương trình hoạt động thế nào",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Bằng việc tích vào từng ô, tôi xác nhận đã đọc, hiểu rõ và đồng ý với từng nội dung dưới đây.",
      ),
    ).toBeVisible();
    expect(screen.queryByText(/4\. Chương trình hoạt động thế nào/)).toBeNull();
    expect(agreementCheckboxes()).toHaveLength(11);
    expect(
      screen.getByText(/Canh tác tự nhiên — không dùng thuốc trừ sâu/),
    ).toBeVisible();
    expect(
      screen.getByText(/Tôi đồng ý được thêm vào nhóm trò chuyện chung/),
    ).toBeVisible();
    expect(
      screen.getByText(
        /Trong phạm vi pháp luật cho phép, tôi miễn trừ trách nhiệm/,
      ),
    ).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Chọn tất cả" })).toBeVisible();
    expect(screen.queryByText(/^1\.$/)).toBeNull();
  });

  it("requires all 11 terms and lets the user toggle every agreement at once", async () => {
    installApi();
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();

    const continueButton = screen.getByRole("button", {
      name: "Tiếp tục thanh toán",
    });
    const checkboxes = agreementCheckboxes();
    fireEvent.click(checkboxes[0]);
    expect(continueButton).toBeDisabled();

    const allTerms = screen.getByRole("checkbox", { name: "Chọn tất cả" });
    fireEvent.click(allTerms);
    checkboxes.forEach((checkbox) => expect(checkbox).toBeChecked());
    expect(continueButton).toBeEnabled();
    expect(allTerms).toBeChecked();

    fireEvent.click(allTerms);
    checkboxes.forEach((checkbox) => expect(checkbox).not.toBeChecked());
    expect(continueButton).toBeDisabled();

    checkboxes.forEach((checkbox) => fireEvent.click(checkbox));
    expect(allTerms).toBeChecked();
    fireEvent.click(checkboxes[4]);
    expect(allTerms).not.toBeChecked();
    expect(continueButton).toBeDisabled();
  });

  it("maps the backend terms-required error to localized copy", () => {
    const error = new AccountApiError("csa_purchase_terms_required", 400);
    expect(purchaseErrorMessage(error, "vi")).toBe(
      "Vui lòng đánh dấu tất cả các ô xác nhận trước khi tiếp tục.",
    );
    expect(purchaseErrorMessage(error, "en")).toBe(
      "Please tick every agreement checkbox before continuing.",
    );
  });

  it("keeps terms consent required and reports keyboard submission inline", async () => {
    installApi();
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    flushAnimationFrames();
    scrollIntoViewMock.mockClear();
    const checkbox = agreementCheckboxes()[0];
    const checkboxFocus = vi.spyOn(checkbox, "focus");
    expect(checkbox).toHaveAccessibleName(/Canh tác tự nhiên/);
    const submit = screen.getByRole("button", { name: "Tiếp tục thanh toán" });
    expect(submit).toBeDisabled();
    fireEvent.submit(checkbox.closest("form")!);
    expect(
      screen.getByText(
        "Vui lòng đánh dấu tất cả các ô xác nhận trước khi tiếp tục.",
      ),
    ).toBeVisible();
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute(
      "aria-describedby",
      "csa-purchase-terms-error",
    );
    flushAnimationFrames();
    expect(checkboxFocus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
    });
    expect(scrollIntoViewMock.mock.instances[0]).toBe(checkbox);
    acceptTerms();
    expect(submit).toBeEnabled();
  });

  it("renders the complete localized English terms", async () => {
    installApi({ user: { ...member, locale: "en" } });
    render(<CSAPurchasePage locale="en" />);
    expect(
      await screen.findByRole("heading", {
        name: "Packages open for registration",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "Choose the right package for your family",
      }),
    ).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: /Gói Rau/ }));
    fireEvent.click(screen.getByRole("button", { name: /3 month/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByText("Member");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", {
      name: "How the program works",
    });
    expect(agreementCheckboxes()).toHaveLength(11);
    expect(
      screen.getByText(
        /Naturally farmed — grown with no pesticides, herbicides, or fungicides/,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(/I agree to be added to a group chat of all members/),
    ).toBeVisible();
    expect(
      screen.getByText(
        /To the extent permitted by law, I release Natural Farming Vietnam/,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "By checking each box, I confirm that I have read, fully understood, and agree to each item below.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Check all" })).toBeVisible();
  });

  it("renders authenticated identity read-only and submits no client identity fields", async () => {
    const { calls } = installApi({ user: member });
    render(<CSAPurchasePage locale="vi" />);
    await goToAuthenticatedTerms();
    expect(screen.queryByLabelText("Số điện thoại")).toBeNull();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    await screen.findByRole("heading", { name: "Thanh toán" });
    const createCall = calls.find(
      (call) => call.url === "/api/account/csa-payment-quotes",
    );
    expect(JSON.parse(String(createCall?.init?.body))).toEqual({
      package_id: packageId,
      price_option_id: optionId,
      payment_plan_id: planId,
      terms_accepted: true,
      terms_locale: "vi",
    });
  });

  it("returns an incomplete authenticated profile to the read-only information step", async () => {
    installApi({
      user: member,
      create: { errors: [{ code: "csa_purchase_auth_account_incomplete" }] },
      createStatus: 400,
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToAuthenticatedTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    expect(
      await screen.findByRole("link", { name: "Cập nhật thông tin tài khoản" }),
    ).toHaveAttribute(
      "href",
      "/api/auth/account?returnTo=%2Fcsa%2Fpurchase%2Fvi",
    );
    const profileNotice = screen.getByRole("alert");
    expect(profileNotice).toHaveClass("profile-incomplete-notice");
    expect(profileNotice).toHaveTextContent(
      "Thông tin Auth Account chưa đầy đủ. Vui lòng cập nhật họ tên, số điện thoại và địa chỉ trước khi mua CSA.",
    );
    expect(
      profileNotice.querySelector(".profile-incomplete-notice-message"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Số điện thoại")).toBeNull();
  });

  it("refreshes the Auth Account session once after return and preserves the purchase selection", async () => {
    const { calls } = installApi({
      user: member,
      create: { errors: [{ code: "csa_purchase_auth_account_incomplete" }] },
      createStatus: 400,
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToAuthenticatedTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    const accountLink = await screen.findByRole("link", {
      name: "Cập nhật thông tin tài khoản",
    });
    accountLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(accountLink);

    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("pageshow"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "Cập nhật thông tin tài khoản" }),
      ).toBeNull(),
    );
    expect(
      calls.filter((call) => call.url === "/api/auth/session"),
    ).toHaveLength(2);
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Thông tin của bạn" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
    expect(screen.getByRole("button", { name: /Gói Rau/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps the incomplete-profile notice when Auth Account revalidation fails", async () => {
    const { calls } = installApi({
      user: member,
      create: { errors: [{ code: "csa_purchase_auth_account_incomplete" }] },
      createStatus: 400,
      sessionResponse: (call) =>
        call === 0
          ? json({ data: { user: member } })
          : json({ error: "upstream_unavailable" }, 502),
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToAuthenticatedTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    const accountLink = await screen.findByRole("link", {
      name: "Cập nhật thông tin tài khoản",
    });
    accountLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(accountLink);

    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("pageshow"));
    });

    await waitFor(() =>
      expect(
        calls.filter((call) => call.url === "/api/auth/session"),
      ).toHaveLength(2),
    );
    expect(
      screen.getByRole("link", { name: "Cập nhật thông tin tài khoản" }),
    ).toBeVisible();
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(1);
  });

  it("shows backend payment data, supports copy, confirms with guest token and renders success", async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: clipboard,
    });
    const { calls } = installApi();
    const { container } = render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    flushAnimationFrames();
    scrollIntoViewMock.mockClear();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );

    expect(
      await screen.findByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toHaveAttribute(
      "src",
      expect.stringContaining(
        "https://img.vietqr.io/image/970422-123456789-qr_only.png",
      ),
    );
    const paymentHeading = screen.getByRole("heading", {
      name: "Thanh toán",
    });
    const paymentHeadingFocus = vi.spyOn(paymentHeading, "focus");
    flushAnimationFrames();
    expect(paymentHeading).toHaveClass("step-title", "step-heading");
    expect(paymentHeadingFocus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(scrollIntoViewMock.mock.instances[0]).toBe(
      screen.getByLabelText("Tiến trình mua CSA"),
    );
    const paymentGrid = container.querySelector(
      ".main-panel > .step > .payment-grid",
    );
    const paymentInformation = paymentGrid?.querySelector(
      ":scope > .payment-information",
    );
    const paymentQr = paymentGrid?.querySelector(":scope > .payment-qr");
    const qrWrap = paymentQr?.querySelector(":scope > .qr-wrap");
    const bankList = paymentInformation?.querySelector(":scope > .bank-list");
    expect(paymentGrid).not.toBeNull();
    expect(paymentInformation).not.toBeNull();
    expect(paymentQr).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Mã QR" })).toHaveClass(
      "payment-qr-title",
    );
    const qrImage = qrWrap?.querySelector(":scope > .qr-image");
    expect(qrImage?.querySelector(":scope > .qr")).not.toBeNull();
    const qrLogo = qrImage?.querySelector(":scope > .qr-logo");
    expect(qrLogo).toHaveAttribute("src", "/images/logo-mark.png");
    expect(qrLogo).toHaveAttribute("alt", "");
    expect(qrLogo).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByRole("heading", { name: "Thông tin chuyển khoản" }),
    ).toHaveClass("payment-details-title");
    expect(bankList).not.toBeNull();
    expect(bankList?.querySelectorAll(":scope > .bank-row")).toHaveLength(5);
    const fullAmountRow = screen
      .getByText("Số tiền cần chuyển")
      .closest<HTMLElement>(".bank-row")!;
    expect(within(fullAmountRow).getByText(/1\.200\.000/)).toBeVisible();
    expect(
      within(fullAmountRow).getByText("Thanh toán toàn bộ gói · 3 tháng"),
    ).toBeVisible();
    expect(
      Array.from(paymentGrid?.children ?? []).indexOf(paymentQr!),
    ).toBeLessThan(
      Array.from(paymentGrid?.children ?? []).indexOf(paymentInformation!),
    );
    expect(paymentGrid?.nextElementSibling).toHaveClass(
      "btn-row",
      "payment-actions",
    );
    expect(container.querySelector(".payment-stack")).toBeNull();
    expect(container.querySelector(".payment-total")).toBeNull();
    expect(container.querySelector(".csa-payment-panel")).toBeNull();
    expect(container.querySelector(".csa-payment-layout")).toBeNull();
    expect(container.querySelector(".csa-payment-details")).toBeNull();
    expect(screen.getAllByText(/1\.200\.000/).length).toBeGreaterThan(0);
    const copyButtons = screen.getAllByRole("button", { name: "Sao chép" });
    expect(copyButtons).toHaveLength(2);
    expect(copyButtons[0].querySelector("svg")).not.toBeNull();
    fireEvent.click(copyButtons[0]);
    await waitFor(() =>
      expect(clipboard.writeText).toHaveBeenCalledWith("123456789"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sao chép" }));
    await waitFor(() =>
      expect(clipboard.writeText).toHaveBeenCalledWith("CSA-ABC123"),
    );
    expect(screen.queryByText("guest-secret")).toBeNull();

    const createCallsBeforeBack = calls.filter(
      (call) =>
        call.url.includes("csa-purchase-requests") &&
        !call.url.endsWith("/confirm-payment"),
    ).length;
    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
    await screen.findByRole("heading", {
      name: "Chương trình hoạt động thế nào",
    });
    flushAnimationFrames();
    agreementCheckboxes().forEach((checkbox) => expect(checkbox).toBeChecked());
    expect(
      screen.queryByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    expect(
      await screen.findByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toHaveAttribute(
      "src",
      expect.stringContaining(
        "https://img.vietqr.io/image/970422-123456789-qr_only.png",
      ),
    );
    flushAnimationFrames();
    expect(
      calls.filter(
        (call) =>
          call.url.includes("csa-purchase-requests") &&
          !call.url.endsWith("/confirm-payment"),
      ),
    ).toHaveLength(createCallsBeforeBack);
    expect(screen.getByText("123456789")).toBeVisible();
    expect(screen.getByText("CSA-ABC123")).toBeVisible();

    scrollIntoViewMock.mockClear();
    fireEvent.click(
      screen.getByRole("button", { name: "Tôi đã chuyển khoản" }),
    );
    const successHeading = await screen.findByRole("heading", {
      name: "Yêu cầu đã được gửi",
    });
    const successHeadingFocus = vi.spyOn(successHeading, "focus");
    flushAnimationFrames();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(scrollIntoViewMock.mock.instances[0]).toBe(
      screen.getByLabelText("Tiến trình mua CSA"),
    );
    expect(successHeadingFocus).toHaveBeenCalledWith({ preventScroll: true });
    const successProgress = screen.getByLabelText("Tiến trình mua CSA");
    expect(
      successProgress.querySelectorAll(".progress-item.done"),
    ).toHaveLength(4);
    expect(successProgress.querySelector(".progress-item.active")).toBeNull();
    expect(successHeading.closest("section")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(
      screen.getByText(
        "Chúng tôi đã ghi nhận xác nhận thanh toán của bạn. Bạn có thể dùng mã bên dưới để tra cứu trạng thái.",
      ),
    ).toBeVisible();
    const successView = container.querySelector(
      ".main-panel > #success-view > .success",
    );
    expect(successView).not.toBeNull();
    expect(successView?.querySelector(":scope > .success-icon")).toBeVisible();
    expect(successView?.querySelector(":scope > .code")).toHaveTextContent(
      "CSA-ABC123",
    );
    expect(
      screen.getByRole("link", { name: "Tra cứu yêu cầu sau" }),
    ).toHaveAttribute("href", "/csa/track/vi");
    expect(successView?.lastElementChild?.querySelector("a")).toBe(
      screen.getByRole("link", { name: "Tra cứu yêu cầu sau" }),
    );
    expect(container.querySelector(".payment-stack")).toBeNull();
    expect(container.querySelector("form")).toBeNull();
    expect(
      screen.queryByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Tôi đã chuyển khoản" }),
    ).toBeNull();
    expect(screen.queryByText("CSA Demo")).toBeNull();
    expect(
      screen.queryByText("Prototype giao diện đăng ký & tra cứu"),
    ).toBeNull();
    const confirmCall = calls.find((call) =>
      call.url.endsWith("/confirm-transfer"),
    );
    expect(JSON.parse(String(confirmCall?.init?.body))).toEqual({
      quote_token: "quote-token",
      guest_identity: {
        name: "Nguyễn Văn An",
        phone: "+84901234567",
        province_code: "66",
        ward_code: "22015",
        address: "Số 12, ngõ 5",
      },
    });
  });

  it("links the English success state to the localized tracker", async () => {
    installApi({ user: member });
    render(<CSAPurchasePage locale="en" />);

    const continueButton = await screen.findByRole("button", {
      name: "Continue",
    });
    await waitFor(() => expect(continueButton).toBeEnabled());
    fireEvent.click(continueButton);
    await screen.findByRole("heading", { name: "Your information" });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", {
      name: "How the program works",
    });
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to payment" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "I have transferred" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Request submitted" }),
    ).toBeVisible();
    expect(screen.getByText("CSA-ABC123")).toHaveClass("code");
    expect(
      screen.getByRole("link", { name: "Track request later" }),
    ).toHaveAttribute("href", "/csa/track/en");
  });

  it("keeps bank fallback visible but blocks confirmation after QR failure", async () => {
    installApi();
    const { container } = render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    const qr = await screen.findByAltText("Mã VietQR để chuyển khoản mua CSA");
    fireEvent.error(qr);
    expect(
      screen.queryByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toBeNull();
    expect(container.querySelector(".csa-purchase-ui .qr-logo")).toBeNull();
    expect(
      container.querySelector(".csa-purchase-ui .qr-unavailable"),
    ).not.toBeNull();
    expect(screen.getByText("MB Bank")).toBeVisible();
    expect(screen.getByText("123456789")).toBeVisible();
    expect(
      screen.getByText(/Thông tin thanh toán không khả dụng/),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Tôi đã chuyển khoản" }),
    ).toBeNull();
  });

  it("blocks authenticated create double-submit and confirms without a guest token", async () => {
    let resolveCreate!: (response: Response) => void;
    const pendingCreate = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });
    const { calls } = installApi({ user: member, pendingCreate });
    render(<CSAPurchasePage locale="vi" />);
    await goToAuthenticatedTerms();
    acceptTerms();
    const submit = screen.getByRole("button", { name: "Tiếp tục thanh toán" });
    fireEvent.click(submit);
    fireEvent.submit(submit.closest("form")!);
    expect(
      await screen.findByText("Đang chuẩn bị thông tin thanh toán an toàn…"),
    ).toBeVisible();
    expect(
      calls.filter((call) => call.url === "/api/account/csa-payment-quotes"),
    ).toHaveLength(1);
    resolveCreate(json(quotePayload, 201));
    fireEvent.click(
      await screen.findByRole("button", { name: "Tôi đã chuyển khoản" }),
    );
    await waitFor(() =>
      expect(calls.some((call) => call.url.endsWith("/confirm-transfer"))).toBe(
        true,
      ),
    );
    const confirmCall = calls.find((call) =>
      call.url.endsWith("/confirm-transfer"),
    );
    expect(JSON.parse(String(confirmCall?.init?.body))).toEqual({
      quote_token: "quote-token",
    });
  });

  it("shows localized package loading/error and request failure states", async () => {
    installApi({ packageStatus: 502 });
    render(<CSAPurchasePage locale="vi" />);
    expect(
      await screen.findByText(
        "Không thể tải danh sách gói CSA. Vui lòng thử lại.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeVisible();
    cleanup();

    installApi({
      create: { errors: [{ code: "csa_purchase_request_open_exists" }] },
      createStatus: 409,
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    expect(
      await screen.findByText(
        "Số điện thoại này đang có một yêu cầu mua được xử lý.",
      ),
    ).toBeVisible();
    expect(screen.queryByText(/csa_purchase_request_open_exists/)).toBeNull();
  });

  it("renders backend payment plans in order, selects the first, and shows only real savings", async () => {
    const full = {
      ...packagePayload.data[0].price_options[0].payment_plans[0],
      total_amount: "1100000",
      installments: [{ sequence: 1, amount: "1100000", cycle_count: 3 }],
    };
    const installment = {
      id: "77777777-7777-4777-8777-777777777777",
      name: "Trả góp hai lần",
      payment_type: "installment",
      total_amount: "1200000",
      installment_count: 2,
      installments: [
        { sequence: 2, amount: "600000", cycle_count: 2 },
        { sequence: 1, amount: "600000", cycle_count: 1 },
      ],
    };
    const installmentWithHigherTotal = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Trả góp ba lần",
      payment_type: "installment",
      total_amount: "1300000",
      installment_count: 3,
      installments: [
        { sequence: 1, amount: "433333", cycle_count: 1 },
        { sequence: 2, amount: "433333", cycle_count: 1 },
        { sequence: 3, amount: "433334", cycle_count: 1 },
      ],
    };
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                id: "88888888-8888-4888-8888-888888888888",
                duration_months: 1,
                monthly_price_vnd: "400000",
                total_price_vnd: "400000",
                payment_plans: [
                  {
                    ...full,
                    id: "99999999-9999-4999-8999-999999999999",
                    total_amount: "400000",
                    installments: [
                      { sequence: 1, amount: "400000", cycle_count: 1 },
                    ],
                  },
                ],
              },
              {
                ...packagePayload.data[0].price_options[0],
                payment_plans: [full, installment, installmentWithHigherTotal],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);
    await screen.findByRole("heading", { name: "Phương thức thanh toán" });
    fireEvent.click(await screen.findByRole("button", { name: /3 tháng/ }));
    const plans = screen.getAllByRole("button", {
      name: /Thanh toán một lần|Trả góp 2 lần|Trả góp 3 lần/,
    });
    expect(plans[0]).toHaveAttribute("aria-pressed", "true");
    expect(plans[1]).toHaveAttribute("aria-pressed", "false");
    expect(
      within(plans[0]).getByText("Tiết kiệm 100.000 ₫ · 8,33%"),
    ).toBeVisible();
    expect(within(plans[1]).queryByText(/^Tiết kiệm \d/)).toBeNull();
    expect(within(plans[2]).queryByText(/^Tiết kiệm \d/)).toBeNull();
    expect(within(plans[0]).queryByText("Lần 1")).toBeNull();
    expect(
      within(plans[0]).getByText("Thanh toán toàn bộ gói · 3 tháng"),
    ).toBeVisible();
    expect(within(plans[0]).queryByText(/Mở .*kỳ|Tổng .*kỳ/)).toBeNull();
    expect(within(plans[1]).getByText("Lần 1")).toBeVisible();
    expect(within(plans[1]).getByText("1 tháng đầu")).toBeVisible();
    expect(within(plans[1]).getByText("Lần 2")).toBeVisible();
    expect(within(plans[1]).getByText("2 tháng cuối")).toBeVisible();
    expect((plans[1].textContent ?? "").indexOf("Lần 1")).toBeLessThan(
      (plans[1].textContent ?? "").indexOf("Lần 2"),
    );
    expect(plans[1].textContent).not.toMatch(/\b(?:installments?|cycles?)\b/i);
    fireEvent.click(plans[1]);
    expect(plans[1]).toHaveAttribute("aria-pressed", "true");
    expect(plans[0]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Phương thức")).toBeVisible();
    expect(screen.getByText("Khoản thanh toán đầu tiên")).toBeVisible();
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeEnabled();

    fireEvent.click(plans[2]);
    expect(
      within(plans[0]).getByText("Tiết kiệm 200.000 ₫ · 15,38%"),
    ).toBeVisible();
  });

  it("does not compare payment methods when full and installment totals match", async () => {
    const option = packagePayload.data[0].price_options[0];
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...option,
                payment_plans: [
                  { ...option.payment_plans[0], total_amount: "1200000" },
                  {
                    id: "77777777-7777-4777-8777-777777777777",
                    name: "installment",
                    payment_type: "installment",
                    total_amount: "1200000",
                    installment_count: 2,
                    installments: [
                      { sequence: 1, amount: "600000", cycle_count: 1 },
                      { sequence: 2, amount: "600000", cycle_count: 2 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);

    await screen.findByRole("heading", { name: "Phương thức thanh toán" });
    expect(screen.queryByText(/^Tiết kiệm \d/)).toBeNull();
  });

  it("does not show a full-payment saving when installments cost less", async () => {
    const option = packagePayload.data[0].price_options[0];
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...option,
                payment_plans: [
                  { ...option.payment_plans[0], total_amount: "1200000" },
                  {
                    id: "77777777-7777-4777-8777-777777777777",
                    name: "installment",
                    payment_type: "installment",
                    total_amount: "1100000",
                    installment_count: 2,
                    installments: [
                      { sequence: 1, amount: "550000", cycle_count: 1 },
                      { sequence: 2, amount: "550000", cycle_count: 2 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);

    await screen.findByRole("heading", { name: "Phương thức thanh toán" });
    expect(screen.queryByText(/^Tiết kiệm \d/)).toBeNull();
  });

  it("does not compare payment methods without a valid full-payment plan", async () => {
    const option = packagePayload.data[0].price_options[0];
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...option,
                payment_plans: [
                  {
                    id: "77777777-7777-4777-8777-777777777777",
                    name: "installment",
                    payment_type: "installment",
                    total_amount: "1200000",
                    installment_count: 2,
                    installments: [
                      { sequence: 1, amount: "600000", cycle_count: 1 },
                      { sequence: 2, amount: "600000", cycle_count: 2 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);

    await screen.findByRole("heading", { name: "Phương thức thanh toán" });
    expect(screen.queryByText(/^Tiết kiệm \d/)).toBeNull();
  });

  it("renders payment-plan wording and installment months in English", async () => {
    const option = packagePayload.data[0].price_options[0];
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...option,
                payment_plans: [
                  {
                    ...option.payment_plans[0],
                    total_amount: "1100000",
                    installments: [
                      { sequence: 1, amount: "1100000", cycle_count: 3 },
                    ],
                  },
                  {
                    id: "77777777-7777-4777-8777-777777777777",
                    name: "unused backend name",
                    payment_type: "installment",
                    total_amount: "1200000",
                    installment_count: 2,
                    installments: [
                      { sequence: 2, amount: "600000", cycle_count: 2 },
                      { sequence: 1, amount: "600000", cycle_count: 1 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="en" />);

    const full = await screen.findByRole("button", { name: /Pay in full/ });
    const installment = screen.getByRole("button", {
      name: /Pay in 2 installments/,
    });
    expect(within(full).getByText("Entire package · 3 months")).toBeVisible();
    expect(within(installment).getByText("Payment 1")).toBeVisible();
    expect(
      within(installment).getByText("1 months at the beginning"),
    ).toBeVisible();
    expect(within(installment).getByText("2 final months")).toBeVisible();
    expect(within(full).getByText("Save ₫100,000 · 8.33%")).toBeVisible();
    expect(within(installment).queryByText(/^Save ₫/)).toBeNull();
    expect(screen.queryByText("Thanh toán một lần")).toBeNull();
  });

  it("blocks progression when a duration has no valid backend plan", async () => {
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              { ...packagePayload.data[0].price_options[0], payment_plans: [] },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);
    expect(
      await screen.findByText(
        "Thời hạn này chưa có phương thức thanh toán hợp lệ.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  });

  it("uses one-month price option as full payment when no plan is configured", async () => {
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                duration_months: 1,
                monthly_price_vnd: "400000",
                total_price_vnd: "400000",
                payment_plans: [],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);

    expect(
      await screen.findByRole("button", { name: /Thanh toán một lần/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByText("Thời hạn này chưa có phương thức thanh toán hợp lệ."),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeEnabled();
  });

  it("resets the plan to the first valid option when package or duration changes", async () => {
    const base = packagePayload.data[0];
    const full = base.price_options[0].payment_plans[0];
    const second = {
      id: "77777777-7777-4777-8777-777777777777",
      name: "Hai lần",
      payment_type: "installment",
      total_amount: "1200000",
      installment_count: 2,
      installments: [
        { sequence: 1, amount: "600000", cycle_count: 1 },
        { sequence: 2, amount: "600000", cycle_count: 2 },
      ],
    };
    const otherPlan = { ...full, id: "88888888-8888-4888-8888-888888888888" };
    const longerPlan = {
      ...full,
      id: "99999999-9999-4999-8999-999999999999",
      total_amount: "2400000",
      installments: [{ sequence: 1, amount: "2400000", cycle_count: 6 }],
    };
    installApi({
      packages: {
        data: [
          {
            ...base,
            price_options: [
              { ...base.price_options[0], payment_plans: [full, second] },
            ],
          },
          {
            ...base,
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            name: "Gói khác",
            price_options: [
              {
                ...base.price_options[0],
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                payment_plans: [otherPlan],
              },
              {
                ...base.price_options[0],
                id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                duration_months: 6,
                total_price_vnd: "2400000",
                payment_plans: [longerPlan],
              },
            ],
          },
        ],
      },
    });
    render(<CSAPurchasePage locale="vi" />);
    const secondButton = await screen.findByRole("button", {
      name: /Trả góp 2 lần/,
    });
    fireEvent.click(secondButton);
    expect(secondButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Gói khác/ }));
    expect(screen.getByRole("button", { name: /Gói khác/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: /Thanh toán một lần/ }),
    ).toHaveAttribute("data-payment-plan", otherPlan.id);
    fireEvent.click(screen.getByRole("button", { name: /6 tháng/ }));
    expect(
      screen.getByRole("button", { name: /Thanh toán một lần/ }),
    ).toHaveAttribute("data-payment-plan", longerPlan.id);
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeEnabled();
  });

  it("blocks the QR and confirmation if backend installment QR overcharges the current payment", async () => {
    const installment = {
      id: "77777777-7777-4777-8777-777777777777",
      name: "Trả góp hai lần",
      payment_type: "installment",
      total_amount: "1200000",
      installment_count: 2,
      installments: [
        { sequence: 1, amount: "600000", cycle_count: 1 },
        { sequence: 2, amount: "600000", cycle_count: 2 },
      ],
    };
    const { calls } = installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                payment_plans: [installment],
              },
            ],
          },
        ],
      },
      create: { data: { ...purchasePayload.data, payment_plan: installment } },
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Thanh toán" }),
    ).toBeVisible();
    const post = calls.find(
      (call) => call.url === "/api/account/csa-payment-quotes",
    );
    expect(JSON.parse(String(post?.init?.body))).toMatchObject({
      payment_plan_id: installment.id,
    });
    expect(JSON.parse(String(post?.init?.body))).not.toHaveProperty("amount");
    expect(
      screen.queryByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Tôi đã chuyển khoản" }),
    ).toBeNull();
    expect(
      await screen.findByText(/Thông tin thanh toán không khả dụng/),
    ).toBeVisible();
    expect(
      calls.filter((call) => call.url.endsWith("/confirm-payment")),
    ).toHaveLength(0);
  });

  it("uses the backend QR amount for the current installment when its snapshot is consistent", async () => {
    const installment = {
      id: "77777777-7777-4777-8777-777777777777",
      name: "Trả góp hai lần",
      payment_type: "installment",
      total_amount: "1200000",
      installment_count: 2,
      installments: [
        { sequence: 1, amount: "600000", cycle_count: 1 },
        { sequence: 2, amount: "600000", cycle_count: 2 },
      ],
    };
    installApi({
      packages: {
        data: [
          {
            ...packagePayload.data[0],
            price_options: [
              {
                ...packagePayload.data[0].price_options[0],
                payment_plans: [installment],
              },
            ],
          },
        ],
      },
      create: {
        data: {
          ...purchasePayload.data,
          payment_plan: installment,
          initial_payment_amount: "600000",
          qr_payload: { ...purchasePayload.data.qr_payload, amount: "600000" },
        },
      },
    });
    render(<CSAPurchasePage locale="vi" />);
    await goToGuestTerms();
    acceptTerms();
    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
    );
    expect(await screen.findByText("Lịch thanh toán")).toBeVisible();
    const scheduleRows = document.querySelectorAll(".payment-schedule-row");
    expect(scheduleRows).toHaveLength(2);
    expect(
      within(scheduleRows[0] as HTMLElement).getByText("Lần 1"),
    ).toBeVisible();
    expect(
      within(scheduleRows[0] as HTMLElement).getByText("1 tháng đầu"),
    ).toBeVisible();
    expect(
      within(scheduleRows[1] as HTMLElement).getByText("Lần 2"),
    ).toBeVisible();
    expect(
      within(scheduleRows[1] as HTMLElement).getByText("2 tháng cuối"),
    ).toBeVisible();
    const totalRow = screen
      .getByText("Tổng giá trị gói")
      .closest<HTMLElement>(".bank-row")!;
    const initialRow = screen
      .getByText("Khoản thanh toán đầu tiên cần chuyển")
      .closest<HTMLElement>(".bank-row")!;
    expect(within(totalRow).getByText(/1\.200\.000/)).toBeVisible();
    expect(within(initialRow).getByText(/600\.000/)).toBeVisible();
    expect(screen.getByText("1 tháng đầu")).toBeVisible();
    expect(
      screen.getByAltText("Mã VietQR để chuyển khoản mua CSA"),
    ).toHaveAttribute("src", expect.stringContaining("amount=600000"));
    expect(
      screen.getByRole("button", { name: "Tôi đã chuyển khoản" }),
    ).toBeEnabled();
  });

  it.each([
    ["", "Thông tin thanh toán không khả dụng"],
    ["1100000", "Thông tin thanh toán không khả dụng"],
  ])(
    "blocks QR and confirmation for an invalid first payment amount %s",
    async (amount, message) => {
      const { calls } = installApi({
        create: {
          data: { ...purchasePayload.data, initial_payment_amount: amount },
        },
      });
      render(<CSAPurchasePage locale="vi" />);
      await goToGuestTerms();
      acceptTerms();
      fireEvent.click(
        screen.getByRole("button", { name: "Tiếp tục thanh toán" }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(
        screen.queryByAltText("Mã VietQR để chuyển khoản mua CSA"),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Tôi đã chuyển khoản" }),
      ).toBeNull();
      expect(
        calls.filter((call) => call.url.endsWith("/confirm-transfer")),
      ).toHaveLength(0);
    },
  );
});
