import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CSAPaymentSchedule } from "@/features/membership/csa-payment-schedule";

const plan = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Two payments",
  payment_type: "installment" as const,
  total_amount: "1200000",
  installment_count: 2,
  initial_payment_amount: "600000",
  installments: [
    { sequence: 1, amount: "600000", cycle_count: 1 },
    { sequence: 2, amount: "600000", cycle_count: 2 },
  ],
};
const summary = {
  total_amount: "1200000",
  paid_amount: "600000",
  remaining_amount: "600000",
  confirmed_installments: 1,
  installment_count: 2,
  paid_cycles: 1,
  total_cycles: 3,
};
const payments = [
  {
    installment_sequence: 2,
    amount_due: "600000",
    amount_paid: null,
    cycle_count: 2,
    status: "overdue" as const,
    due_at: "2026-09-11T18:00:00Z",
    confirmed_at: null,
    rejected_at: null,
  },
  {
    installment_sequence: 1,
    amount_due: "600000",
    amount_paid: "600000",
    cycle_count: 1,
    status: "confirmed" as const,
    due_at: "2026-08-11T18:00:00Z",
    confirmed_at: "2026-08-12T18:00:00Z",
    rejected_at: null,
  },
];

afterEach(cleanup);

describe("CSA payment schedule", () => {
  it("renders backend summary and payments in sequence without recomputing amounts", () => {
    render(
      <CSAPaymentSchedule
        plan={plan}
        summary={summary}
        payments={payments}
        locale="vi"
      />,
    );
    expect(screen.getByText("Trả góp 2 lần")).toBeVisible();
    expect(
      screen
        .getByText("Lần thanh toán 1")
        .compareDocumentPosition(screen.getByText("Lần thanh toán 2")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("1 / 3")).toBeVisible();
    expect(screen.getByText("Quá hạn", { selector: "span" })).toBeVisible();
    expect(screen.getByText("12/09/2026 01:00")).toBeVisible();
  });

  it("localizes statuses and supports legacy contracts without a schedule", () => {
    const { rerender } = render(<CSAPaymentSchedule locale="en" />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    rerender(
      <CSAPaymentSchedule
        plan={plan}
        summary={summary}
        payments={payments}
        locale="en"
      />,
    );
    expect(screen.getByText("Pay in 2 installments")).toBeVisible();
    expect(screen.getByText("Overdue", { selector: "span" })).toBeVisible();
  });
});
