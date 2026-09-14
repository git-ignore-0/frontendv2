import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CSATrackerApiError } from "@/features/membership/csa-contract-tracker-api";
import { CSAFlowStateProvider } from "@/features/membership/csa-flow-state";
import {
  CSAContractTrackerPage,
  trackerErrorMessage,
} from "@/features/membership/csa-contract-tracker-page";

const pendingResult = {
  data: {
    reference_code: "CSA-ABC123",
    reference_type: "request",
    status: "pending",
    package_snapshot: { name: "Gói Rau" },
    price_option_snapshot: { name: "3 tháng" },
    duration_months: 3,
    amount: "1200000",
    currency: "VND",
    created_at: "2026-09-11T01:30:00Z",
    expires_at: "2026-09-18T01:30:00Z",
    payment_confirmed_at: null,
    contract: null,
    pdf_available: false,
  },
};

const approvedResult = {
  data: {
    ...pendingResult.data,
    reference_type: "contract",
    status: "approved",
    contract: {
      id: "11111111-1111-4111-8111-111111111111",
      reference_code: "CSACT-ABC123",
      status: "active",
    },
    pdf_available: true,
    available_pdf_locales: ["vi", "en"],
  },
};

const contractResult = {
  data: {
    id: "11111111-1111-4111-8111-111111111111",
    reference_code: "CSACT-ABC123",
    source: "online_purchase",
    status: "active",
    package_name_snapshot: "Gói Rau",
    price_option_name_snapshot: "3 tháng",
    amount_snapshot: "1200000",
    currency_snapshot: "VND",
    duration_months_snapshot: 3,
    start_date: "2026-10-01",
    end_date: "2027-01-01",
    issued_at: "2026-09-11T18:00:00Z",
    revoked_at: null,
    revocation_reason: null,
    available_pdf_locales: ["vi", "en"],
    pdf_available: true,
  },
};

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  "createObjectURL",
);
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  "revokeObjectURL",
);

function response(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

function fillLookup() {
  fireEvent.change(screen.getByLabelText("Mã yêu cầu hoặc mã hợp đồng"), {
    target: { value: "  csa-abc123  " },
  });
  fireEvent.change(screen.getByLabelText("Số điện thoại"), {
    target: { value: "090 123 4567" },
  });
}

function submitLookup() {
  fillLookup();
  fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalCreateObjectURL)
    Object.defineProperty(URL, "createObjectURL", originalCreateObjectURL);
  else Reflect.deleteProperty(URL, "createObjectURL");
  if (originalRevokeObjectURL)
    Object.defineProperty(URL, "revokeObjectURL", originalRevokeObjectURL);
  else Reflect.deleteProperty(URL, "revokeObjectURL");
});

describe("CSA contract guest tracker", () => {
  it("keeps the lookup result across locale route remount without another request", async () => {
    const fetchMock = vi.fn(async () => response(pendingResult));
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(
      <CSAFlowStateProvider>
        <CSAContractTrackerPage key="vi" locale="vi" />
      </CSAFlowStateProvider>,
    );
    submitLookup();
    expect(
      await screen.findByRole("heading", {
        name: "Đang chờ thanh toán/xác nhận",
      }),
    ).toBeVisible();
    rerender(
      <CSAFlowStateProvider>
        <CSAContractTrackerPage key="en" locale="en" />
      </CSAFlowStateProvider>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Waiting for payment or confirmation",
      }),
    ).toBeVisible();
    expect(screen.getByText("CSA-ABC123")).toBeVisible();
    expect(screen.queryByRole("form")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Look up another request" }),
    );
    expect(screen.getByLabelText("Request or contract code")).toHaveValue("");
    expect(screen.getByLabelText("Phone number")).toHaveValue("");
  });

  it.each([
    ["csa_tracker_lookup_unavailable", "Không thể tìm thấy yêu cầu"],
    ["csa_tracker_session_expired", "Phiên tra cứu an toàn đã hết hạn"],
    ["csa_tracker_contract_unavailable", "Hợp đồng chưa khả dụng"],
    ["csa_contract_pdf_unavailable", "Hợp đồng đang tạm thời"],
    ["invalid_contract_locale", "Ngôn ngữ hợp đồng này không khả dụng"],
  ] as const)("maps stable error %s", (code, message) => {
    expect(
      trackerErrorMessage(new CSATrackerApiError(code, 400), "vi"),
    ).toContain(message);
  });

  it("renders the compact initial state without a result card", () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container } = render(<CSAContractTrackerPage locale="vi" />);

    expect(
      container.querySelector(".csa-ui.csa-tracker-ui .shell .app-card"),
    ).not.toBeNull();
    expect(container.querySelector(".topbar, .brand, .tabs")).toBeNull();
    expect(container.querySelector(".content .lookup-wrap")).not.toBeNull();
    expect(container.querySelector(".lookup-card .lookup-head")).toBeNull();
    expect(
      container.querySelectorAll(".lookup-wrap > .lookup-card"),
    ).toHaveLength(1);
    expect(
      container.querySelector(".lookup-card > .section-head"),
    ).not.toBeNull();
    expect(container.querySelector(".content > .section-head")).toBeNull();
    expect(container.querySelector(".result-card")).toBeNull();
    expect(screen.queryByText("CSA")).toBeNull();
    expect(screen.queryByText("Đăng ký và tra cứu yêu cầu")).toBeNull();
    expect(screen.queryByRole("link", { name: "Mua gói CSA" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tra cứu yêu cầu" })).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Tra cứu yêu cầu CSA", level: 1 }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(
      screen.getByText(
        "Nhập mã yêu cầu và số điện thoại đã đăng ký để xem trạng thái.",
      ),
    ).toBeVisible();
    expect(screen.getByLabelText("Số điện thoại")).toHaveAttribute(
      "type",
      "tel",
    );
    expect(screen.getByLabelText("Số điện thoại")).toHaveAttribute(
      "inputmode",
      "tel",
    );
    expect(screen.getByRole("button", { name: "Tra cứu" })).toBeDisabled();
    expect(container.querySelector(".csa-tracker-result")).toBeNull();
  });

  it("keeps the layout stable and inputs disabled while looking up", async () => {
    let resolveLookup!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveLookup = resolve;
          }),
      ),
    );
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();

    expect(screen.getByLabelText("Mã yêu cầu hoặc mã hợp đồng")).toBeDisabled();
    expect(screen.getByLabelText("Số điện thoại")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Đang tra cứu…" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Đang tra cứu…");

    resolveLookup(response(pendingResult));
    await screen.findByRole("heading", {
      name: "Đang chờ thanh toán/xác nhận",
    });
  });

  it.each([
    [
      "pending",
      "Đang chờ thanh toán/xác nhận",
      "Yêu cầu đang chờ xác nhận thanh toán trước khi được kiểm tra.",
    ],
    [
      "payment_confirmed",
      "Đã ghi nhận chuyển khoản",
      "Chuyển khoản đã được ghi nhận. Admin đang kiểm tra giao dịch.",
    ],
  ])(
    "renders %s with request data and no contract actions",
    async (status, label, notice) => {
      const fetchMock = vi.fn(async () =>
        response({ data: { ...pendingResult.data, status } }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const { container } = render(<CSAContractTrackerPage locale="vi" />);
      submitLookup();

      expect(await screen.findByRole("heading", { name: label })).toBeVisible();
      expect(container.querySelector(".lookup-card")).toBeNull();
      expect(container.querySelector("form")).toBeNull();
      expect(
        container.querySelector(".lookup-wrap > .result-card > .result-shell"),
      ).not.toBeNull();
      expect(container.querySelector(".result-card > .btn-row")).toBeNull();
      expect(
        container.querySelector(".result-shell > .btn-row"),
      ).not.toBeNull();
      expect(container.querySelector(".section-head")).toBeNull();
      expect(screen.getAllByText(label)).toHaveLength(1);
      expect(screen.getByText("Trạng thái")).toHaveAttribute(
        "aria-label",
        `Trạng thái: ${label}`,
      );
      expect(screen.getByText("CSA-ABC123")).toBeVisible();
      expect(screen.getByText("Gói Rau")).toBeVisible();
      expect(screen.getByText("3 tháng")).toBeVisible();
      expect(screen.getByText(/1\.200\.000/)).toBeVisible();
      expect(screen.getByText("18/09/2026 08:30")).toBeVisible();
      expect(screen.getByText(notice)).toBeVisible();
      expect(screen.queryByRole("button", { name: /PDF/ })).toBeNull();
      expect(screen.queryByText("Lịch sử phiên bản hợp đồng")).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/account/csa-contract-tracker/lookup",
        expect.objectContaining({
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({
            reference_code: "CSA-ABC123",
            phone: "+84901234567",
          }),
        }),
      );
    },
  );

  it("loads only an approved contract and renders dates and available PDF actions", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(approvedResult))
      .mockResolvedValueOnce(response(contractResult));
    vi.stubGlobal("fetch", fetchMock);
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();

    expect(
      await screen.findByRole("heading", { name: "Đã duyệt" }),
    ).toBeVisible();
    expect(screen.getByText("CSACT-ABC123")).toBeVisible();
    expect(screen.getByText("12/09/2026")).toBeVisible();
    expect(screen.getByText("01/10/2026")).toBeVisible();
    expect(screen.getByText("31/12/2026")).toBeVisible();
    expect(screen.queryByText("01/01/2027")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Tải hợp đồng tiếng Việt" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Tải hợp đồng tiếng Anh" }),
    ).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows the approved installment schedule without exposing it before approval", async () => {
    const payment = {
      installment_sequence: 1,
      amount_due: "600000",
      amount_paid: "600000",
      cycle_count: 1,
      status: "confirmed",
      due_at: null,
      confirmed_at: "2026-09-11T18:00:00Z",
      rejected_at: null,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(approvedResult))
      .mockResolvedValueOnce(
        response({
          data: {
            ...contractResult.data,
            payment_plan: { payment_type: "installment" },
            payment_summary: {
              total_amount: "1200000",
              paid_amount: "600000",
              remaining_amount: "600000",
              confirmed_installments: 1,
              installment_count: 2,
              paid_cycles: 1,
              total_cycles: 3,
            },
            payments: [payment],
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();
    expect(await screen.findByText("Lịch thanh toán CSA")).toBeVisible();
    expect(screen.getByText("Trả góp 2 lần")).toBeVisible();
    expect(screen.getByText("Lần thanh toán 1")).toBeVisible();
    expect(screen.getByText("1 / 3")).toBeVisible();
  });

  it("shows approved versions in order and downloads each available locale through the BFF", async () => {
    const oldId = "22222222-2222-4222-8222-222222222222";
    const currentId = "33333333-3333-4333-8333-333333333333";
    const old = {
      id: oldId,
      version_number: 1,
      version_reason: "issued",
      contract_status: "active",
      created_at: "2026-09-11T18:00:00Z",
      available_locales: ["vi"],
    };
    const current = {
      id: currentId,
      version_number: 2,
      version_reason: "payment_confirmed",
      contract_status: "active",
      created_at: "2026-09-12T18:00:00Z",
      available_locales: ["vi", "en"],
      paid_amount: "600000",
      remaining_amount: "600000",
    };
    const pdf = new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="contract-version.pdf"',
      },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(approvedResult))
      .mockResolvedValueOnce(
        response({
          data: {
            ...contractResult.data,
            current_version: current,
            versions: [current, old],
          },
        }),
      )
      .mockResolvedValueOnce(pdf)
      .mockResolvedValueOnce(pdf.clone());
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:contract-version"),
    });
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const filenames: string[] = [];
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        filenames.push(this.download);
      });
    const timeoutSpy = vi.spyOn(window, "setTimeout");
    const setStorageItem = vi.spyOn(Storage.prototype, "setItem");

    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();
    const history = await screen.findByRole("heading", {
      name: "Lịch sử phiên bản hợp đồng",
    });
    const list = history.closest("section")?.querySelector("ol");
    expect(list).not.toBeNull();
    const rows = Array.from(list?.querySelectorAll("li") ?? []);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Phiên bản 1");
    expect(rows[1]).toHaveTextContent("Phiên bản 2");
    expect(rows[0]).not.toHaveTextContent("Bản hiện tại");
    expect(rows[1]).toHaveTextContent("Bản hiện tại");
    expect(rows[0]).toHaveTextContent("12/09/2026 01:00");
    expect(rows[1]).toHaveTextContent("Đã thanh toán");
    expect(rows[0].querySelectorAll("button")).toHaveLength(1);
    expect(rows[1].querySelectorAll("button")).toHaveLength(2);

    fireEvent.click(rows[0].querySelector("button") as HTMLButtonElement);
    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(1));
    expect(filenames).toEqual(["contract-version.pdf"]);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    fireEvent.click(rows[1].querySelectorAll("button")[1] as HTMLButtonElement);
    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `/api/account/csa-contract-tracker/contract/pdf?locale=vi&version_id=${oldId}`,
      expect.objectContaining({
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      `/api/account/csa-contract-tracker/contract/pdf?locale=en&version_id=${currentId}`,
      expect.objectContaining({
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
    expect(setStorageItem).not.toHaveBeenCalled();
    expect(window.location.search).not.toContain("version_id");
    expect(window.location.search).not.toContain("0901234567");
    const timers = timeoutSpy.mock.calls
      .map(([, delay], index) => (delay === 1000 ? index : -1))
      .filter((index) => index >= 0);
    expect(timers.length).toBeGreaterThanOrEqual(2);
    for (const timer of timers)
      window.clearTimeout(timeoutSpy.mock.results[timer].value);
  });

  it("keeps approved lookup and contract data when a version PDF fails", async () => {
    const versionId = "22222222-2222-4222-8222-222222222222";
    const version = {
      id: versionId,
      version_number: 1,
      version_reason: "issued",
      contract_status: "active",
      created_at: "2026-09-11T18:00:00Z",
      available_locales: ["vi"],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(approvedResult))
      .mockResolvedValueOnce(
        response({
          data: {
            ...contractResult.data,
            current_version: version,
            versions: [version],
          },
        }),
      )
      .mockResolvedValueOnce(
        response({ errors: [{ code: "csa_contract_pdf_unavailable" }] }, 404),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();
    const history = await screen.findByRole("heading", {
      name: "Lịch sử phiên bản hợp đồng",
    });
    const versionButton = history
      .closest("section")
      ?.querySelector("button") as HTMLButtonElement;
    fireEvent.click(versionButton);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Hợp đồng đang tạm thời",
    );
    expect(screen.getByRole("heading", { name: "Đã duyệt" })).toBeVisible();
    expect(screen.getByText("CSACT-ABC123")).toBeVisible();
    expect(history).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("clears tracker data when a version download reports an expired session", async () => {
    const version = {
      id: "22222222-2222-4222-8222-222222222222",
      version_number: 1,
      version_reason: "issued",
      contract_status: "active",
      created_at: "2026-09-11T18:00:00Z",
      available_locales: ["vi"],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(approvedResult))
      .mockResolvedValueOnce(
        response({
          data: {
            ...contractResult.data,
            current_version: version,
            versions: [version],
          },
        }),
      )
      .mockResolvedValueOnce(
        response({ errors: [{ code: "csa_tracker_session_expired" }] }, 401),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();
    const history = await screen.findByRole("heading", {
      name: "Lịch sử phiên bản hợp đồng",
    });
    fireEvent.click(
      history.closest("section")?.querySelector("button") as HTMLButtonElement,
    );
    expect(
      await screen.findByText(/Phiên tra cứu an toàn đã hết hạn/),
    ).toBeVisible();
    expect(screen.queryByText("CSACT-ABC123")).toBeNull();
    expect(screen.queryByText("Lịch sử phiên bản hợp đồng")).toBeNull();
    expect(screen.getByLabelText("Mã yêu cầu hoặc mã hợp đồng")).toHaveValue(
      "",
    );
    expect(screen.getByLabelText("Số điện thoại")).toHaveValue("");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps approved lookup data when contract loading fails and retries only the contract", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(approvedResult))
      .mockResolvedValueOnce(
        response(
          { errors: [{ code: "csa_tracker_contract_unavailable" }] },
          503,
        ),
      )
      .mockResolvedValueOnce(response(contractResult));
    vi.stubGlobal("fetch", fetchMock);
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();

    expect(
      await screen.findByRole("heading", { name: "Đã duyệt" }),
    ).toBeVisible();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Hợp đồng chưa khả dụng",
    );
    expect(screen.getByText("CSA-ABC123")).toBeVisible();
    expect(screen.getByText("Gói Rau")).toBeVisible();
    expect(screen.getByText("3 tháng")).toBeVisible();
    expect(screen.getByText(/1\.200\.000/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Tải (PDF|hợp đồng)/ }),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Thử tải lại hợp đồng" }),
    );
    expect(await screen.findByText("CSACT-ABC123")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Tải hợp đồng tiếng Việt" }),
    ).toBeVisible();
    expect(
      screen.queryByText("Hợp đồng chưa khả dụng cho yêu cầu này."),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
      "/api/account/csa-contract-tracker/contract",
    );
  });

  it("clears approved lookup data if the contract session has expired", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response(approvedResult))
        .mockResolvedValueOnce(
          response({ errors: [{ code: "csa_tracker_session_expired" }] }, 401),
        ),
    );
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();

    expect(
      await screen.findByText(/Phiên tra cứu an toàn đã hết hạn/),
    ).toBeVisible();
    expect(screen.getByLabelText("Mã yêu cầu hoặc mã hợp đồng")).toHaveValue(
      "",
    );
    expect(screen.getByLabelText("Số điện thoại")).toHaveValue("");
    expect(screen.queryByRole("heading", { name: "Đã duyệt" })).toBeNull();
    expect(screen.queryByText("CSA-ABC123")).toBeNull();
  });

  it.each([
    ["pending", "Chờ hoàn tiền"],
    ["completed", "Đã hoàn tiền"],
  ])(
    "renders rejected with %s refund status and no contract",
    async (refundStatus, refundLabel) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          response({
            data: {
              ...pendingResult.data,
              status: "rejected",
              rejection_reason:
                "Không xác minh được giao dịch. Vui lòng liên hệ đội ngũ hỗ trợ để được kiểm tra thêm.",
              rejected_at: "2026-09-11T03:00:00Z",
              refund_status: refundStatus,
            },
          }),
        ),
      );
      render(<CSAContractTrackerPage locale="vi" />);
      submitLookup();

      expect(
        await screen.findByRole("heading", { name: "Đã từ chối" }),
      ).toBeVisible();
      expect(screen.getByText(/Không xác minh được giao dịch/)).toBeVisible();
      expect(screen.getByText(refundLabel)).toBeVisible();
      expect(screen.queryByRole("button", { name: /PDF/ })).toBeNull();
      expect(screen.queryByText("Trạng thái hợp đồng")).toBeNull();
    },
  );

  it("renders expired data without contract, refund or payment actions", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        data: {
          ...pendingResult.data,
          status: "expired",
          expires_at: "2026-09-11T03:00:00Z",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();

    expect(
      await screen.findByRole("heading", { name: "Yêu cầu đã hết hạn" }),
    ).toBeVisible();
    expect(screen.getByText("11/09/2026 10:00")).toBeVisible();
    expect(
      screen.getByText(/không thể tiếp tục xác nhận thanh toán/i),
    ).toBeVisible();
    expect(screen.queryByText("Trạng thái hoàn tiền")).toBeNull();
    expect(screen.queryByRole("button", { name: /PDF/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /chuyển khoản/i })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("validates fields inline and prevents duplicate submissions", async () => {
    let resolveLookup!: (value: Response) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveLookup = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<CSAContractTrackerPage locale="vi" />);

    fireEvent.submit(
      screen.getByRole("button", { name: "Tra cứu" }).closest("form")!,
    );
    expect(screen.getAllByText("Vui lòng nhập thông tin này.")).toHaveLength(1);
    expect(
      screen.getByText("Vui lòng nhập số điện thoại Việt Nam hợp lệ."),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();

    fillLookup();
    const submit = screen.getByRole("button", { name: "Tra cứu" });
    fireEvent.click(submit);
    fireEvent.submit(submit.closest("form")!);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveLookup(response(pendingResult));
    await screen.findByRole("heading", {
      name: "Đang chờ thanh toán/xác nhận",
    });
  });

  it.each([
    [
      404,
      "csa_tracker_lookup_unavailable",
      "Không thể tìm thấy yêu cầu với thông tin này.",
    ],
    [429, "rate_limited", "Bạn thao tác quá nhiều lần."],
  ])(
    "renders safe lookup error state for HTTP %s",
    async (status, code, message) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => response({ errors: [{ code }] }, status)),
      );
      render(<CSAContractTrackerPage locale="vi" />);
      submitLookup();

      expect(await screen.findByText(new RegExp(message))).toBeVisible();
      expect(screen.getByRole("button", { name: "Thử lại" })).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Quay lại form tra cứu" }),
      ).toBeVisible();
      expect(screen.queryByText(code)).toBeNull();
      expect(screen.queryByText("CSA-ABC123")).toBeNull();
    },
  );

  it("renders a safe network error without technical details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("ECONNRESET secret"))),
    );
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();

    expect(
      await screen.findByText(
        "Không thể hoàn tất tra cứu. Vui lòng thử lại sau.",
      ),
    ).toBeVisible();
    expect(screen.queryByText(/ECONNRESET|secret/)).toBeNull();
  });

  it("clears form and result when the tracker session expires", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response({ errors: [{ code: "csa_tracker_session_expired" }] }, 401),
      ),
    );
    const { container } = render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();

    expect(
      await screen.findByText(
        "Phiên tra cứu an toàn đã hết hạn. Vui lòng nhập lại mã và số điện thoại.",
      ),
    ).toBeVisible();
    expect(screen.getByLabelText("Mã yêu cầu hoặc mã hợp đồng")).toHaveValue(
      "",
    );
    expect(screen.getByLabelText("Số điện thoại")).toHaveValue("");
    expect(container.querySelector(".result-card")).toBeNull();
    expect(container.querySelector(".lookup-card")).not.toBeNull();
    expect(screen.queryByText("CSA-ABC123")).toBeNull();
  });

  it("resets a completed lookup and returns focus to the reference field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response(pendingResult)),
    );
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();
    fireEvent.click(
      await screen.findByRole("button", { name: "Tra cứu yêu cầu khác" }),
    );

    expect(screen.queryByText("CSA-ABC123")).toBeNull();
    expect(screen.getByLabelText("Mã yêu cầu hoặc mã hợp đồng")).toHaveValue(
      "",
    );
    expect(screen.getByLabelText("Số điện thoại")).toHaveValue("");
    await waitFor(() =>
      expect(
        screen.getByLabelText("Mã yêu cầu hoặc mã hợp đồng"),
      ).toHaveFocus(),
    );
  });

  it("downloads only through the BFF and revokes the Blob URL after click", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(approvedResult))
      .mockResolvedValueOnce(response(contractResult))
      .mockResolvedValueOnce(
        new Response(new Uint8Array([37, 80, 68, 70]), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="CSACT-ABC123.vi.pdf"',
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const createObjectURL = vi.fn(() => "blob:contract");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const timeoutSpy = vi.spyOn(window, "setTimeout");

    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();
    fireEvent.click(
      await screen.findByRole("button", { name: "Tải hợp đồng tiếng Việt" }),
    );
    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(1));

    expect(revokeObjectURL).not.toHaveBeenCalled();
    const timerIndex = timeoutSpy.mock.calls.reduce(
      (found, [, delay], index) => (delay === 1000 ? index : found),
      -1,
    );
    expect(timerIndex).toBeGreaterThanOrEqual(0);
    window.clearTimeout(timeoutSpy.mock.results[timerIndex].value);
    const scheduled = timeoutSpy.mock.calls[timerIndex][0];
    expect(typeof scheduled).toBe("function");
    act(() => {
      if (typeof scheduled === "function") scheduled();
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:contract");
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/account/csa-contract-tracker/contract/pdf?locale=vi",
      expect.objectContaining({
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
  });

  it("never renders sensitive response fields and does not fetch a contract before approval", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        data: {
          ...pendingResult.data,
          guest_confirmation_token: "guest-secret-token",
          storage_key: "private/contracts/secret.pdf",
          customer_name: "Sensitive Customer",
          email: "private@example.com",
          address: "Private address",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<CSAContractTrackerPage locale="vi" />);
    submitLookup();
    await screen.findByRole("heading", {
      name: "Đang chờ thanh toán/xác nhận",
    });

    expect(screen.queryByText(/guest-secret-token/)).toBeNull();
    expect(
      screen.queryByText(
        /private\/contracts|Sensitive Customer|private@example|Private address/,
      ),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders localized English copy with the shared responsive shell", () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container } = render(<CSAContractTrackerPage locale="en" />);
    expect(
      screen.getByRole("heading", { name: "Track CSA request" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Phone number")).toBeVisible();
    expect(container.querySelector(".csa-ui .lookup-wrap")).not.toBeNull();
    expect(container.querySelector(".lookup-card .form-grid")).not.toBeNull();
    expect(screen.queryByText("Purchase and request tracking")).toBeNull();
    expect(screen.queryByRole("link", { name: "Purchase CSA" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Track a request" })).toBeNull();
  });
});
