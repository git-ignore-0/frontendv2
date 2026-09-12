import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isContractReference } from "@/features/membership/csa-contract-verification-api";
import { CSAContractVerificationPage } from "@/features/membership/csa-contract-verification-page";

const reference = "CSA-202609-8F3K2M";
const activeContract = {
  reference_code: reference,
  status: "active",
  issued_at: "2026-09-11T18:00:00Z",
  start_date: "2026-10-01",
  end_date: "2027-01-01",
  revoked_at: null,
  revocation_reason: null,
};

function response(data: unknown, status = 200) {
  return Response.json(data, { status });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("public CSA contract verification", () => {
  it.each([
    ["CSA-AAAAAAAAAAAA", true],
    ["CSA-0123456789AF", true],
    ["CSA-202609-8F3K2M", true],
    ["CSA-GAAAAAAAAAAA", false],
    ["CSA-202609-I00000", false],
    ["CSA-20269-8F3K2M", false],
    ["CSA-AAAAAAAAAAAAA", false],
  ])("validates only supported contract format %s", (value, expected) => {
    expect(isContractReference(value)).toBe(expected);
  });

  it("trims and uppercases a valid query reference before calling the BFF", async () => {
    const fetchMock = vi.fn(async () => response({ data: activeContract }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CSAContractVerificationPage
        initialReference="  csa-202609-8f3k2m  "
        locale="vi"
      />,
    );

    expect(await screen.findByText(reference)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/account/csa-contracts/verify?reference_code=${reference}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      },
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("opens an online hexadecimal contract reference through the BFF", async () => {
    const onlineReference = "CSA-AAAAAAAAAAAA";
    const fetchMock = vi.fn(async () =>
      response({
        data: { ...activeContract, reference_code: onlineReference },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CSAContractVerificationPage
        initialReference={onlineReference}
        locale="vi"
      />,
    );

    expect(await screen.findByText(onlineReference)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/account/csa-contracts/verify?reference_code=${onlineReference}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      },
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("shows the missing-reference state without making a request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<CSAContractVerificationPage locale="vi" />);

    expect(
      screen.getByText("Vui lòng nhập mã hợp đồng để bắt đầu xác minh."),
    ).toBeVisible();
    expect(screen.getByLabelText("Mã hợp đồng")).toHaveValue("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the same safe message for an invalid reference without lookup", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <CSAContractVerificationPage
        initialReference="not-a-contract"
        locale="vi"
      />,
    );

    expect(
      await screen.findByText("Không thể xác minh hợp đồng này."),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders active dates and converts the exclusive end boundary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response({ data: activeContract })),
    );
    render(
      <CSAContractVerificationPage initialReference={reference} locale="vi" />,
    );

    expect(
      await screen.findByRole("heading", { name: "Đang hiệu lực" }),
    ).toBeVisible();
    expect(screen.getAllByText("Đang hiệu lực")).toHaveLength(3);
    expect(screen.getByText("12/09/2026")).toBeVisible();
    expect(screen.getByText("01/10/2026")).toBeVisible();
    expect(screen.getByText("31/12/2026")).toBeVisible();
    expect(screen.queryByText("01/01/2027")).toBeNull();
  });

  it("renders revoked metadata in Vietnam time", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response({
          data: {
            ...activeContract,
            status: "revoked",
            revoked_at: "2026-09-11T03:30:00Z",
            revocation_reason: "Giao dịch đã được hoàn tiền",
          },
        }),
      ),
    );
    render(
      <CSAContractVerificationPage initialReference={reference} locale="vi" />,
    );

    expect(
      await screen.findByRole("heading", { name: "Đã thu hồi" }),
    ).toBeVisible();
    expect(screen.getByText("11/09/2026 10:30")).toBeVisible();
    expect(screen.getByText("Giao dịch đã được hoàn tiền")).toBeVisible();
  });

  it.each([
    {
      status: 404,
      code: "csa_contract_verification_unavailable",
      message: "Không thể xác minh hợp đồng này.",
    },
    {
      status: 500,
      code: "internal_error",
      message: "Tạm thời không thể xác minh. Vui lòng thử lại.",
    },
  ])(
    "hides raw API errors for HTTP $status",
    async ({ status, code, message }) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          response(
            {
              errors: [
                {
                  code,
                  detail: "database storage secret traceback",
                },
              ],
            },
            status,
          ),
        ),
      );
      render(
        <CSAContractVerificationPage
          initialReference={reference}
          locale="vi"
        />,
      );

      expect(await screen.findByText(message)).toBeVisible();
      expect(
        screen.queryByText(/database storage secret traceback/),
      ).toBeNull();
    },
  );

  it("localizes rate limiting and allows a retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ errors: [{ code: "throttled" }] }, 429))
      .mockResolvedValueOnce(response({ data: activeContract }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <CSAContractVerificationPage initialReference={reference} locale="vi" />,
    );

    expect(await screen.findByText(/Bạn thao tác quá nhiều lần/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText(reference)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("handles a network failure without an infinite retry", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <CSAContractVerificationPage initialReference={reference} locale="en" />,
    );

    expect(
      await screen.findByText(
        "Verification is temporarily unavailable. Please try again.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  });

  it("renders only the public contract fields and never offers a PDF", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response({
          data: {
            ...activeContract,
            name: "Sensitive Customer",
            phone: "+84901234567",
            email: "secret@example.com",
            address: "Secret address",
            package_name: "Secret package",
            amount: "999999",
            bank_name: "Secret bank",
            membership_id: "membership-secret",
            customer_id: "customer-secret",
            purchase_request_id: "request-secret",
            storage_key: "/private/contract.pdf",
            pdf_url: "https://private.example/contract.pdf",
            guest_token: "token-secret",
          },
        }),
      ),
    );
    render(
      <CSAContractVerificationPage initialReference={reference} locale="vi" />,
    );
    await screen.findByText(reference);

    for (const secret of [
      "Sensitive Customer",
      "+84901234567",
      "secret@example.com",
      "Secret address",
      "Secret package",
      "999999",
      "Secret bank",
      "membership-secret",
      "customer-secret",
      "request-secret",
      "/private/contract.pdf",
      "https://private.example/contract.pdf",
      "token-secret",
    ]) {
      expect(screen.queryByText(secret)).toBeNull();
    }
    expect(
      screen.queryByRole("button", { name: /PDF|download|tải/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: /PDF|download|tải/i }),
    ).toBeNull();
  });

  it("resets a verified contract so another reference can be entered", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response({ data: activeContract })),
    );
    render(
      <CSAContractVerificationPage initialReference={reference} locale="vi" />,
    );
    await screen.findByText(reference);

    fireEvent.click(screen.getByRole("button", { name: "Xác minh mã khác" }));

    expect(screen.queryByText(reference)).toBeNull();
    expect(screen.getByLabelText("Mã hợp đồng")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Xác minh hợp đồng" }),
    ).toBeVisible();
  });
});
