import type { Metadata } from "next";
import { ContentReviewNote } from "@/components/ui/content-review-note";

export const metadata: Metadata = {
  title: "Chính sách riêng tư",
  description: "Thông tin về dữ liệu trên website Natural Farming Vietnam.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="site-container section-pad">
      <div className="max-w-prose">
        <span className="eyebrow">Thông tin website</span>
        <h1 className="display-title">Chính sách riêng tư</h1>
        <div className="prose-copy mt-10">
          <p>
            Phiên bản MVP này không có tài khoản, biểu mẫu nội bộ, giỏ hàng,
            thanh toán hoặc công cụ phân tích hành vi. Khi bạn chọn Cửa hàng,
            trình duyệt sẽ mở website Farmbrite và chính sách của dịch vụ đó
            được áp dụng.
          </p>
          <p>
            Khi bạn liên hệ qua email hoặc điện thoại, thông tin được xử lý qua
            nhà cung cấp liên lạc tương ứng. Website không lưu bản sao trong cơ
            sở dữ liệu riêng.
          </p>
          <p>
            Nếu công cụ analytics, biểu mẫu hoặc CMS được thêm trong tương lai,
            chính sách này cần được cập nhật trước khi tính năng được kích hoạt.
          </p>
        </div>
        <div className="mt-8">
          <ContentReviewNote>
            Đây là bản thảo vận hành cho MVP, cần người phụ trách pháp lý/chủ dự
            án duyệt trước khi xuất bản chính thức.
          </ContentReviewNote>
        </div>
      </div>
    </div>
  );
}
