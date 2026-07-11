import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="site-container grid min-h-[65svh] place-items-center py-20 text-center">
      <div>
        <span className="eyebrow">404 · Không tìm thấy</span>
        <h1 className="display-title mx-auto">Trang này chưa mọc lên.</h1>
        <p className="lead mx-auto mt-6">
          Đường dẫn có thể đã thay đổi hoặc nội dung chưa thuộc phạm vi hiện
          tại.
        </p>
        <div className="mt-8">
          <ButtonLink href="/">Về trang chủ</ButtonLink>
        </div>
      </div>
    </div>
  );
}
