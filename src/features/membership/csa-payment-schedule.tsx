import type {
  CSAPaymentPlan,
  CSAPaymentRecord,
  CSAPaymentSummary,
} from "@/features/account/types";
import { getCSAPaymentScheduleCopy } from "@/features/membership/csa-payment-schedule-copy";
import {
  formatMembershipDateTime,
  formatMembershipMoney,
} from "@/features/membership/format";
import type { Locale } from "@/lib/i18n";

export function CSAPaymentSchedule({
  plan,
  summary,
  payments,
  locale,
}: {
  plan?: CSAPaymentPlan | null;
  summary?: CSAPaymentSummary | null;
  payments?: CSAPaymentRecord[];
  locale: Locale;
}) {
  if (!summary || !payments?.length) return null;
  const copy = getCSAPaymentScheduleCopy(locale);
  const ordered = [...payments].sort(
    (a, b) => a.installment_sequence - b.installment_sequence,
  );
  return (
    <section className="csa-installments" aria-label={copy.title}>
      <h4>{copy.title}</h4>
      <dl className="csa-installments-summary">
        <div>
          <dt>{copy.method}</dt>
          <dd>
            {plan?.payment_type === "installment"
              ? copy.installment.replace(
                  "{count}",
                  String(summary.installment_count),
                )
              : copy.full}
          </dd>
        </div>
        <div>
          <dt>{copy.total}</dt>
          <dd>{formatMembershipMoney(summary.total_amount, locale)}</dd>
        </div>
        <div>
          <dt>{copy.paid}</dt>
          <dd>{formatMembershipMoney(summary.paid_amount, locale)}</dd>
        </div>
        <div>
          <dt>{copy.remaining}</dt>
          <dd>{formatMembershipMoney(summary.remaining_amount, locale)}</dd>
        </div>
        <div>
          <dt>{copy.cycles}</dt>
          <dd>
            {summary.paid_cycles} / {summary.total_cycles}
          </dd>
        </div>
      </dl>
      <ol className="csa-installments-list">
        {ordered.map((payment) => (
          <li key={payment.installment_sequence}>
            <strong>
              {copy.payment.replace(
                "{number}",
                String(payment.installment_sequence),
              )}
            </strong>
            <span className={`membership-status is-${payment.status}`}>
              {copy[payment.status]}
            </span>
            <dl>
              <div>
                <dt>{copy.amountDue}</dt>
                <dd>{formatMembershipMoney(payment.amount_due, locale)}</dd>
              </div>
              <div>
                <dt>{copy.amountPaid}</dt>
                <dd>
                  {payment.amount_paid
                    ? formatMembershipMoney(payment.amount_paid, locale)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>{copy.cycleCount}</dt>
                <dd>{payment.cycle_count}</dd>
              </div>
              <div>
                <dt>{copy.dueAt}</dt>
                <dd>{formatMembershipDateTime(payment.due_at)}</dd>
              </div>
              {payment.confirmed_at ? (
                <div>
                  <dt>{copy.confirmedAt}</dt>
                  <dd>{formatMembershipDateTime(payment.confirmed_at)}</dd>
                </div>
              ) : null}
              {payment.rejected_at ? (
                <div>
                  <dt>{copy.rejectedAt}</dt>
                  <dd>{formatMembershipDateTime(payment.rejected_at)}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}
