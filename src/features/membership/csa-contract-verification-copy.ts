import type { Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "CSA contract",
    title: "Verify a CSA contract",
    intro:
      "Enter the reference printed on the contract to verify its current status.",
    back: "Back to CSA",
    reference: "Contract reference",
    referencePlaceholder: "CSA-YYYYMM-XXXXXX",
    verify: "Verify contract",
    verifying: "Verifying…",
    missing: "Enter a contract reference to begin verification.",
    unavailable: "This contract could not be verified.",
    rateLimited: "Too many attempts. Please wait and try again later.",
    networkError: "Verification is temporarily unavailable. Please try again.",
    retry: "Try again",
    verifyAnother: "Verify another reference",
    contractReference: "Contract reference",
    contractStatus: "Contract status",
    active: "Active",
    revoked: "Revoked",
    issuedAt: "Issue date",
    startDate: "Start date",
    endDate: "End date",
    revokedAt: "Revoked at",
    revocationReason: "Revocation reason",
  },
  vi: {
    eyebrow: "Hợp đồng CSA",
    title: "Xác minh hợp đồng CSA",
    intro: "Nhập mã in trên hợp đồng để kiểm tra trạng thái hiện tại.",
    back: "Quay lại CSA",
    reference: "Mã hợp đồng",
    referencePlaceholder: "CSA-YYYYMM-XXXXXX",
    verify: "Xác minh hợp đồng",
    verifying: "Đang xác minh…",
    missing: "Vui lòng nhập mã hợp đồng để bắt đầu xác minh.",
    unavailable: "Không thể xác minh hợp đồng này.",
    rateLimited: "Bạn thao tác quá nhiều lần. Vui lòng chờ và thử lại sau.",
    networkError: "Tạm thời không thể xác minh. Vui lòng thử lại.",
    retry: "Thử lại",
    verifyAnother: "Xác minh mã khác",
    contractReference: "Mã hợp đồng",
    contractStatus: "Trạng thái",
    active: "Đang hiệu lực",
    revoked: "Đã thu hồi",
    issuedAt: "Ngày phát hành",
    startDate: "Ngày bắt đầu",
    endDate: "Ngày kết thúc",
    revokedAt: "Thời gian thu hồi",
    revocationReason: "Lý do thu hồi",
  },
} as const;

export function getCSAContractVerificationCopy(locale: Locale) {
  return copy[locale];
}
