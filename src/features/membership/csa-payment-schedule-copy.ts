import type { Locale } from "@/lib/i18n";

const copy = {
  vi: {
    title: "Lịch thanh toán CSA",
    method: "Phương thức thanh toán",
    full: "Trả thẳng",
    installment: "Trả góp {count} lần",
    total: "Tổng tiền",
    paid: "Đã thanh toán",
    remaining: "Còn phải thanh toán",
    cycles: "Số kỳ đã mở / tổng số kỳ",
    payment: "Lần thanh toán {number}",
    amountDue: "Số tiền phải trả",
    amountPaid: "Số tiền đã trả",
    cycleCount: "Số kỳ",
    dueAt: "Hạn thanh toán",
    confirmedAt: "Xác nhận lúc",
    rejectedAt: "Từ chối lúc",
    pending: "Chờ thanh toán",
    reported: "Đã báo thanh toán",
    confirmed: "Đã xác nhận",
    rejected: "Từ chối",
    overdue: "Quá hạn",
  },
  en: {
    title: "CSA payment schedule",
    method: "Payment method",
    full: "Pay in full",
    installment: "Pay in {count} installments",
    total: "Total amount",
    paid: "Paid",
    remaining: "Remaining",
    cycles: "Cycles unlocked / total cycles",
    payment: "Payment {number}",
    amountDue: "Amount due",
    amountPaid: "Amount paid",
    cycleCount: "Cycles",
    dueAt: "Due date",
    confirmedAt: "Confirmed at",
    rejectedAt: "Rejected at",
    pending: "Pending",
    reported: "Payment reported",
    confirmed: "Confirmed",
    rejected: "Rejected",
    overdue: "Overdue",
  },
} as const;

export function getCSAPaymentScheduleCopy(locale: Locale) {
  return copy[locale];
}
