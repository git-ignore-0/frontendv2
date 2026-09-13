import type { Locale } from "@/lib/i18n";

const copy = {
  en: {
    title: "Choose the right package for your family",
    intro:
      "Choose a package, provide the required details, then transfer the exact amount shown.",
    progressLabel: "CSA purchase progress",
    steps: ["Choose package", "Information", "Terms", "Payment"],
    packageStepTitle: "Packages open for registration",
    packageStepDescription: "Choose the package that fits your household.",
    packageProducts: "Products per cycle",
    noPackageProducts: "Product details will be confirmed with this package.",
    policyExpire: "Unused quantities expire at the end of each cycle.",
    policyRollover: "Unused quantities carry over within the package term.",
    registrationDuration: "Registration duration",
    durationColumn: "Duration",
    monthlyPrice: "Monthly price",
    totalPrice: "Total",
    savingPercent: "Save {percent}%",
    savingAmount: "Save {amount} compared with buying monthly",
    selectionSummary: "Your selection",
    paymentPlanTitle: "Payment method",
    paymentPlanMissing:
      "No valid payment method is available for this duration.",
    paymentPlanRequired:
      "Choose an available payment method before continuing.",
    paymentPlanUnavailable:
      "This payment method is no longer available. Please choose another.",
    payFull: "Pay in full",
    payInstallments: "Pay in {count} installments",
    entirePackage: "Entire package · {count} months",
    packageDuration: "Total package value · {count} months",
    installmentNumber: "Payment {number}",
    installmentBeginning: "{count} months at the beginning",
    installmentFollowing: "{count} following months",
    installmentFinal: "{count} final months",
    cycleCount: "{count} months",
    paymentSchedule: "Payment schedule",
    initialPayment: "First payment to transfer",
    paymentAmountDue: "Amount to transfer",
    packageValue: "Total package value",
    firstPaymentCycles: "Months unlocked by the first payment",
    summaryMethod: "Payment method",
    summaryFirstPayment: "First payment",
    summaryAmountDue: "Amount due",
    initialPaymentMissing:
      "The first payment amount is unavailable. Please contact Natural Farming Vietnam before transferring money.",
    paymentSnapshotInvalid:
      "Payment details could not be verified. Please contact Natural Farming Vietnam before transferring money.",
    startDateNote:
      "The start date will be confirmed after payment and the existing package schedule are checked.",
    informationStepTitle: "Your information",
    informationStepDescription:
      "Provide the details needed to process your request.",
    loadingAccount: "Loading account information…",
    termsStepTitle: "Review the CSA terms",
    termsStepDescription:
      "Please read all terms before confirming your acceptance.",
    previous: "Back",
    next: "Continue",
    packagesLoading: "Loading available packages…",
    packagesEmpty: "There are no CSA packages available right now.",
    packagesError: "We could not load CSA packages. Please try again.",
    retry: "Try again",
    duration: "{count} month(s)",
    signedInNote:
      "Your name, phone number and address will be taken securely from Auth Account.",
    name: "Full name",
    email: "Email",
    phone: "Phone number",
    province: "Province / city",
    ward: "Ward / commune",
    address: "Detailed address",
    selectProvince: "Select a province or city",
    selectWard: "Select a ward or commune",
    wardsLoading: "Loading wards…",
    required: "Please complete this field.",
    invalidPhone: "Enter a valid Vietnamese phone number.",
    terms: {
      title: "CSA Program Participation Terms",
      sections: [
        {
          heading: "Party information",
          text: "The program is provided by Natural Farming Vietnam to the member identified in the CSA purchase request and contract.",
        },
        {
          heading: "Payment",
          paragraphs: [
            "Depending on the package configuration, a member may pay in full or in installments. The total, number of payments, amount of each payment, and corresponding cycles are shown before the member accepts the request.",
            "The first payment must be transferred for the request to be received and processed under the current workflow. Membership is created only after the request is approved. Later installments must be paid by their due dates.",
            "An admin reviews and may manually confirm or reject each transaction. A later payment that misses its deadline may become overdue, and the Membership may be revoked under the applicable rules.",
          ],
        },
        {
          heading: "How the program works",
          text: "CSA connects members with seasonal production during the package term. Product collection rights arise by cycle under the program schedule.",
        },
        {
          heading: "Product quotas",
          text: "Each product follows the quota snapshotted with the package. Unused quantities follow the package's expire or rollover policy at purchase time.",
        },
        {
          heading: "Seasonal changes",
          text: "Product varieties, sizes, and availability may change because of seasons, weather, disease, and actual farming conditions.",
        },
        {
          heading: "Product substitution",
          text: "When an expected product is unavailable, the program may propose a substitute of comparable value or use and communicate it through an appropriate channel.",
        },
        {
          heading: "Delivery and collection",
          text: "Schedules, collection locations, service areas, and delivery charges are communicated by area. Members must provide accurate address and contact information.",
        },
        {
          heading: "Pausing or skipping a collection",
          text: "A pause or skip request must be submitted before the announced deadline. Whether quota is preserved depends on the snapshotted package policy.",
        },
        {
          heading: "Communication channels",
          text: "Notices may be sent by email, telephone, Zalo, or WhatsApp using the member's supplied contact details. Members should report contact changes.",
        },
        {
          heading: "Program adjustments",
          text: "The program may reasonably adjust schedules, collection points, or operations with notice, without changing the price and term snapshots of an issued contract.",
        },
        {
          heading: "Limitation of liability",
          text: "To the extent permitted by law, program liability is limited to providing or resolving the package's remaining benefits and excludes indirect loss caused by events beyond reasonable control.",
        },
      ],
    },
    termsAccept:
      "I have read and agree to the full CSA Program Participation Terms.",
    termsRequired: "You must accept the CSA terms before continuing.",
    continue: "Continue to payment",
    creating: "Creating request…",
    profileIncomplete:
      "Your Auth Account profile is incomplete. Update your name, phone number and address before purchasing CSA.",
    updateAccount: "Update Auth Account",
    paymentTitle: "Transfer payment",
    paymentIntro:
      "Transfer the exact amount with the content below. Do not create another request for this purchase.",
    qrAlt: "VietQR code for CSA bank transfer",
    qrTitle: "QR code",
    bank: "Bank",
    accountNumber: "Account number",
    accountName: "Account name",
    amount: "Amount",
    transferContent: "Transfer content",
    copy: "Copy",
    copied: "Copied",
    confirm: "I have transferred",
    confirming: "Confirming…",
    paymentDataError:
      "Payment information is unavailable. Please contact Natural Farming Vietnam for help.",
    successTitle: "Request submitted",
    success:
      "We have recorded your payment confirmation. You can use the code below to track its status.",
    trackLater: "Track request later",
    packageUnavailable:
      "This package or price option is no longer available. Please choose again.",
    paymentUnavailable:
      "Bank transfer is temporarily unavailable. Please contact our team.",
    duplicate:
      "This phone number already has a purchase request being processed.",
    invalidDetails: "Please check your phone number and address information.",
    notPending: "This request can no longer be confirmed.",
    expired:
      "This purchase request has expired. Please create a new request before transferring money.",
    newRequest: "Start a new request",
    rateLimited: "Too many attempts. Please wait and try again later.",
    genericError: "We could not complete the request. Please try again later.",
  },
  vi: {
    title: "Chọn gói phù hợp cho gia đình",
    intro:
      "Chọn gói, cung cấp thông tin cần thiết rồi chuyển khoản đúng số tiền được hiển thị.",
    progressLabel: "Tiến trình mua CSA",
    steps: ["Chọn gói", "Thông tin", "Điều khoản", "Thanh toán"],
    packageStepTitle: "Gói đang mở đăng ký",
    packageStepDescription:
      "Chọn gói phù hợp với nhu cầu sử dụng của gia đình.",
    packageProducts: "Sản phẩm mỗi kỳ",
    noPackageProducts: "Thông tin sản phẩm sẽ được xác nhận theo gói này.",
    policyExpire: "Số lượng chưa nhận sẽ hết hạn vào cuối mỗi kỳ.",
    policyRollover: "Số lượng chưa nhận được cộng dồn trong thời hạn gói.",
    registrationDuration: "Thời hạn đăng ký",
    durationColumn: "Thời hạn",
    monthlyPrice: "Giá theo tháng",
    totalPrice: "Thành tiền",
    savingPercent: "Tiết kiệm {percent}%",
    savingAmount: "Giảm {amount} so với mua từng tháng",
    selectionSummary: "Gói bạn đã chọn",
    paymentPlanTitle: "Phương thức thanh toán",
    paymentPlanMissing: "Thời hạn này chưa có phương thức thanh toán hợp lệ.",
    paymentPlanRequired:
      "Vui lòng chọn phương thức thanh toán trước khi tiếp tục.",
    paymentPlanUnavailable:
      "Phương thức thanh toán này không còn khả dụng. Vui lòng chọn phương thức khác.",
    payFull: "Thanh toán một lần",
    payInstallments: "Trả góp {count} lần",
    entirePackage: "Thanh toán toàn bộ gói · {count} tháng",
    packageDuration: "Tổng giá trị gói · {count} tháng",
    installmentNumber: "Lần {number}",
    installmentBeginning: "{count} tháng đầu",
    installmentFollowing: "{count} tháng tiếp theo",
    installmentFinal: "{count} tháng cuối",
    cycleCount: "{count} tháng",
    paymentSchedule: "Lịch thanh toán",
    initialPayment: "Khoản thanh toán đầu tiên cần chuyển",
    paymentAmountDue: "Số tiền cần chuyển",
    packageValue: "Tổng giá trị gói",
    firstPaymentCycles: "Số tháng được mở sau khoản đầu",
    summaryMethod: "Phương thức",
    summaryFirstPayment: "Khoản thanh toán đầu tiên",
    summaryAmountDue: "Số tiền cần thanh toán",
    initialPaymentMissing:
      "Chưa có số tiền thanh toán đầu tiên. Vui lòng liên hệ Natural Farming Vietnam trước khi chuyển khoản.",
    paymentSnapshotInvalid:
      "Không thể xác minh thông tin thanh toán. Vui lòng liên hệ Natural Farming Vietnam trước khi chuyển khoản.",
    startDateNote:
      "Ngày bắt đầu sẽ được xác nhận sau khi kiểm tra thanh toán và lịch gói hiện có.",
    informationStepTitle: "Thông tin của bạn",
    informationStepDescription:
      "Cung cấp thông tin cần thiết để xử lý yêu cầu.",
    loadingAccount: "Đang tải thông tin tài khoản…",
    termsStepTitle: "Đọc điều khoản CSA",
    termsStepDescription:
      "Vui lòng đọc toàn bộ điều khoản trước khi xác nhận đồng ý.",
    previous: "Quay lại",
    next: "Tiếp tục",
    packagesLoading: "Đang tải các gói hiện có…",
    packagesEmpty: "Hiện chưa có gói CSA nào khả dụng.",
    packagesError: "Không thể tải danh sách gói CSA. Vui lòng thử lại.",
    retry: "Thử lại",
    duration: "{count} tháng",
    signedInNote:
      "Họ tên, số điện thoại và địa chỉ được lấy an toàn từ Auth Account.",
    name: "Họ tên",
    email: "Email",
    phone: "Số điện thoại",
    province: "Tỉnh/thành phố",
    ward: "Phường/xã",
    address: "Địa chỉ chi tiết",
    selectProvince: "Chọn tỉnh/thành phố",
    selectWard: "Chọn phường/xã",
    wardsLoading: "Đang tải phường/xã…",
    required: "Vui lòng nhập thông tin này.",
    invalidPhone: "Vui lòng nhập số điện thoại Việt Nam hợp lệ.",
    terms: {
      title: "Điều khoản tham gia chương trình CSA",
      sections: [
        {
          heading: "Thông tin các bên",
          text: "Chương trình được cung cấp bởi Natural Farming Vietnam cho thành viên có thông tin được ghi trong yêu cầu mua và hợp đồng CSA.",
        },
        {
          heading: "Thanh toán",
          paragraphs: [
            "Tùy cấu hình từng gói, thành viên có thể trả thẳng hoặc trả góp. Tổng tiền, số lần thanh toán, số tiền từng lần và số kỳ tương ứng được hiển thị trước khi thành viên xác nhận yêu cầu.",
            "Khoản thanh toán đầu tiên cần được chuyển để yêu cầu được tiếp nhận và xử lý theo quy trình hiện hành. Membership chỉ được tạo sau khi yêu cầu được duyệt. Các khoản tiếp theo phải thanh toán đúng hạn.",
            "Admin kiểm tra và có quyền xác nhận hoặc từ chối thủ công từng giao dịch. Khoản tiếp theo quá hạn có thể chuyển trạng thái quá hạn và Membership có thể bị thu hồi theo quy định.",
          ],
        },
        {
          heading: "Cách chương trình hoạt động",
          text: "CSA kết nối thành viên với hoạt động sản xuất theo mùa vụ trong thời hạn của gói. Quyền nhận sản phẩm phát sinh theo từng kỳ và lịch của chương trình.",
        },
        {
          heading: "Hạn mức sản phẩm",
          text: "Số lượng được nhận của từng sản phẩm tuân theo hạn mức đã snapshot trong gói. Phần chưa sử dụng được xử lý theo chính sách expire hoặc rollover của gói tại thời điểm mua.",
        },
        {
          heading: "Thay đổi theo mùa vụ",
          text: "Chủng loại, kích thước và thời điểm có sản phẩm có thể thay đổi do mùa vụ, thời tiết, dịch bệnh và điều kiện canh tác thực tế.",
        },
        {
          heading: "Thay thế sản phẩm",
          text: "Khi sản phẩm dự kiến không có sẵn, chương trình có thể đề xuất sản phẩm thay thế có giá trị hoặc công dụng tương đương và thông báo qua kênh liên lạc phù hợp.",
        },
        {
          heading: "Giao và nhận sản phẩm",
          text: "Lịch, địa điểm, phạm vi và chi phí giao nhận được thông báo theo từng khu vực. Thành viên có trách nhiệm cung cấp địa chỉ và thông tin liên lạc chính xác.",
        },
        {
          heading: "Tạm dừng hoặc bỏ qua kỳ nhận",
          text: "Yêu cầu tạm dừng hoặc bỏ qua một kỳ phải được gửi trước thời hạn chương trình thông báo. Khả năng bảo lưu hạn mức phụ thuộc chính sách của gói đã snapshot.",
        },
        {
          heading: "Kênh liên lạc",
          text: "Thông báo có thể được gửi qua email, điện thoại, Zalo hoặc WhatsApp theo thông tin thành viên cung cấp. Thành viên cần thông báo khi thông tin liên lạc thay đổi.",
        },
        {
          heading: "Điều chỉnh chương trình",
          text: "Chương trình có thể điều chỉnh lịch, điểm nhận hoặc cách vận hành khi cần thiết và sẽ thông báo trong thời gian hợp lý, nhưng không làm thay đổi snapshot giá và thời hạn của hợp đồng đã phát hành.",
        },
        {
          heading: "Giới hạn trách nhiệm",
          text: "Trong phạm vi pháp luật cho phép, trách nhiệm của chương trình được giới hạn ở nghĩa vụ cung cấp hoặc xử lý quyền lợi còn lại của gói; chương trình không chịu trách nhiệm cho thiệt hại gián tiếp do sự kiện ngoài khả năng kiểm soát hợp lý.",
        },
      ],
    },
    termsAccept:
      "Tôi đã đọc và đồng ý với toàn bộ Điều khoản tham gia chương trình CSA.",
    termsRequired: "Bạn phải đồng ý với Điều khoản CSA trước khi tiếp tục.",
    continue: "Tiếp tục thanh toán",
    creating: "Đang tạo yêu cầu…",
    profileIncomplete:
      "Thông tin Auth Account chưa đầy đủ. Vui lòng cập nhật họ tên, số điện thoại và địa chỉ trước khi mua CSA.",
    updateAccount: "Cập nhật Auth Account",
    paymentTitle: "Thông tin chuyển khoản",
    paymentIntro:
      "Chuyển đúng số tiền và nội dung bên dưới. Không tạo thêm yêu cầu khác cho giao dịch này.",
    qrAlt: "Mã VietQR để chuyển khoản mua CSA",
    qrTitle: "Mã QR",
    bank: "Ngân hàng",
    accountNumber: "Số tài khoản",
    accountName: "Tên chủ tài khoản",
    amount: "Số tiền",
    transferContent: "Nội dung chuyển khoản",
    copy: "Sao chép",
    copied: "Đã sao chép",
    confirm: "Tôi đã chuyển khoản",
    confirming: "Đang xác nhận…",
    paymentDataError:
      "Thông tin thanh toán không khả dụng. Vui lòng liên hệ Natural Farming Vietnam để được hỗ trợ.",
    successTitle: "Yêu cầu đã được gửi",
    success:
      "Chúng tôi đã ghi nhận xác nhận thanh toán của bạn. Bạn có thể dùng mã bên dưới để tra cứu trạng thái.",
    trackLater: "Tra cứu yêu cầu sau",
    packageUnavailable:
      "Gói hoặc thời hạn này không còn khả dụng. Vui lòng chọn lại.",
    paymentUnavailable:
      "Chuyển khoản đang tạm thời không khả dụng. Vui lòng liên hệ đội ngũ hỗ trợ.",
    duplicate: "Số điện thoại này đang có một yêu cầu mua được xử lý.",
    invalidDetails: "Vui lòng kiểm tra lại số điện thoại và thông tin địa chỉ.",
    notPending: "Yêu cầu này không còn ở trạng thái chờ xác nhận.",
    expired:
      "Yêu cầu mua này đã hết hạn. Vui lòng tạo yêu cầu mới trước khi chuyển khoản.",
    newRequest: "Tạo yêu cầu mới",
    rateLimited: "Bạn thao tác quá nhiều lần. Vui lòng chờ và thử lại sau.",
    genericError: "Không thể hoàn tất yêu cầu. Vui lòng thử lại sau.",
  },
} as const;

export function getCSAPurchaseCopy(locale: Locale) {
  return copy[locale];
}
