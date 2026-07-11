import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/content/breadcrumb-json-ld";
import { KnowledgeNote } from "@/components/content/knowledge-note";
import { PageHero } from "@/components/content/page-hero";
import { TableOfContents } from "@/components/content/table-of-contents";
import { ButtonLink } from "@/components/ui/button-link";
import { plantInputs } from "@/content/knowledge";

export const metadata: Metadata = {
  title: "Cây trồng",
  description:
    "Kiến thức nhập môn về đất sống, hệ vi sinh và các đầu vào thường gặp trong Natural Farming.",
  alternates: { canonical: "/plants" },
};

const toc = [
  { id: "mot-cach-lam-khac", label: "Một cách làm khác" },
  { id: "dat-va-vi-sinh", label: "Đất và hệ vi sinh" },
  { id: "nguyen-tac", label: "Nguyên tắc thực hành" },
  { id: "che-pham", label: "Chỉ mục chế phẩm" },
  { id: "bat-dau", label: "Bắt đầu từ đâu" },
];

export default function PlantsPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Cây trồng" path="/plants" />
      <PageHero
        eyebrow="Plants · Cây trồng"
        title="Nuôi đất trước khi nuôi cây."
        description="Natural Farming nhìn sức khỏe cây trồng như kết quả của một hệ đất đang sống — nơi cấu trúc, hữu cơ, rễ và vi sinh vật cùng làm việc."
        image="/images/plant-texture.webp"
        imageAlt="Cận cảnh rau lá xanh vừa thu hoạch"
      />
      <div className="site-container py-10 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:py-20">
        <TableOfContents items={toc} />
        <article className="min-w-0 max-w-4xl">
          <KnowledgeNote />
          <section
            id="mot-cach-lam-khac"
            className="border-forest/15 scroll-mt-28 border-b py-14"
          >
            <span className="eyebrow">01 · Bối cảnh</span>
            <h2 className="section-title mt-5">
              Một cách làm khác bắt đầu từ câu hỏi khác.
            </h2>
            <div className="prose-copy mt-7 max-w-prose">
              <p>
                Thay vì chỉ hỏi “cây đang thiếu gì?”, Natural Farming còn hỏi:
                điều gì đang diễn ra trong đất, vật liệu nào đang bị bỏ phí, và
                can thiệp nào là vừa đủ?
              </p>
              <p>
                Website cũ đặt canh tác thông thường, hữu cơ và tự nhiên cạnh
                nhau. Bản biên tập này không xếp hạng các hệ thống; chúng khác
                nhau về mục tiêu, tiêu chuẩn, loại đầu vào và mức độ phụ thuộc
                vào hệ sinh thái tại chỗ.
              </p>
            </div>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-forest/25 border-y text-forest">
                    <th className="py-4 pr-4">Góc nhìn</th>
                    <th className="p-4">Thông thường</th>
                    <th className="p-4">Hữu cơ</th>
                    <th className="py-4 pl-4">Natural Farming</th>
                  </tr>
                </thead>
                <tbody className="text-muted align-top">
                  <tr className="border-forest/15 border-b">
                    <th className="py-5 pr-4 font-bold text-charcoal">
                      Đầu vào
                    </th>
                    <td className="p-5">
                      Có thể dùng đầu vào tổng hợp theo quy trình.
                    </td>
                    <td className="p-5">
                      Tuân theo tiêu chuẩn hữu cơ áp dụng.
                    </td>
                    <td className="py-5 pl-5">
                      Ưu tiên nguồn tại chỗ và chế phẩm tự làm.
                    </td>
                  </tr>
                  <tr className="border-forest/15 border-b">
                    <th className="py-5 pr-4 font-bold text-charcoal">
                      Quản lý
                    </th>
                    <td className="p-5">
                      Tối ưu năng suất và kiểm soát trực tiếp.
                    </td>
                    <td className="p-5">
                      Quản lý theo chuẩn và đầu vào được phép.
                    </td>
                    <td className="py-5 pl-5">
                      Quan sát quan hệ sinh thái và điều chỉnh.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section
            id="dat-va-vi-sinh"
            className="border-forest/15 scroll-mt-28 border-b py-14"
          >
            <span className="eyebrow">02 · Nền tảng</span>
            <h2 className="section-title mt-5">Đất là nơi sự sống trao đổi.</h2>
            <div className="mt-9 grid gap-8 md:grid-cols-2 md:items-center">
              <div className="image-frame aspect-[3/4]">
                <Image
                  src="/images/microscope.webp"
                  alt="Quan sát mẫu vật trong quá trình tìm hiểu hệ vi sinh"
                  fill
                  sizes="(min-width: 768px) 36vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="prose-copy">
                <p>
                  Rễ cây, khoáng chất, nước, không khí, vật liệu hữu cơ và vô số
                  sinh vật cùng tạo nên môi trường đất. Khi cấu trúc đất và vòng
                  phân giải được chăm sóc, cây có điều kiện tiếp cận dinh dưỡng
                  theo nhịp phát triển.
                </p>
                <p>
                  Vi sinh vật bản địa (IMO) là một nội dung trung tâm trên
                  website cũ. Trong thực hành, việc thu thập và nhân nuôi cần
                  kiến thức, vệ sinh và đánh giá tại chỗ; không nên xem đây là
                  một gói “men” dùng giống nhau ở mọi nơi.
                </p>
              </div>
            </div>
          </section>
          <section
            id="nguyen-tac"
            className="border-forest/15 scroll-mt-28 border-b py-14"
          >
            <span className="eyebrow">03 · Thực hành</span>
            <h2 className="section-title mt-5">
              Bốn nguyên tắc để bắt đầu quan sát.
            </h2>
            <ol className="border-forest/20 mt-9 grid gap-0 border-t">
              {[
                "Giữ bề mặt đất được che phủ và hạn chế xáo trộn không cần thiết.",
                "Đưa vật liệu hữu cơ trở lại vòng tuần hoàn phù hợp.",
                "Xem cây tự mọc, côn trùng và mùi đất như những tín hiệu để đọc.",
                "Thử trên diện tích nhỏ, ghi lại thay đổi rồi mới mở rộng.",
              ].map((item, index) => (
                <li
                  key={item}
                  className="border-forest/20 grid grid-cols-[3rem_1fr] border-b py-5"
                >
                  <span className="text-xs font-extrabold text-terra">
                    0{index + 1}
                  </span>
                  <p className="leading-7 text-charcoal">{item}</p>
                </li>
              ))}
            </ol>
          </section>
          <section
            id="che-pham"
            className="border-forest/15 scroll-mt-28 border-b py-14"
          >
            <span className="eyebrow">04 · Knowledge index</span>
            <h2 className="section-title mt-5">Tám tên gọi thường gặp.</h2>
            <p className="lead mt-6">
              Đây là bản đồ khái niệm, không phải bộ công thức. Mỗi chế phẩm cần
              được hiểu trong bối cảnh đất, cây và mục tiêu sử dụng.
            </p>
            <div className="border-forest/20 mt-10 border-t">
              {plantInputs.map((input) => (
                <details
                  key={input.id}
                  id={input.id}
                  className="border-forest/20 group scroll-mt-28 border-b"
                >
                  <summary className="grid min-h-20 cursor-pointer list-none grid-cols-[4rem_1fr_2rem] items-center gap-3 py-3">
                    <strong className="font-display text-2xl text-terra">
                      {input.shortName}
                    </strong>
                    <span className="font-bold text-forest">{input.name}</span>
                    <span
                      aria-hidden="true"
                      className="text-xl transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="text-muted grid gap-3 pb-7 pl-[5rem] pr-3 text-sm leading-6">
                    <p>{input.summary}</p>
                    <p className="border-l-2 border-straw pl-4 text-soil">
                      {input.note}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
          <section id="bat-dau" className="scroll-mt-28 py-14">
            <span className="eyebrow">05 · Bước tiếp theo</span>
            <h2 className="section-title mt-5">
              Bắt đầu bằng một mảnh đất nhỏ và một cuốn sổ.
            </h2>
            <div className="prose-copy mt-7 max-w-prose">
              <p>
                Ghi nhận độ ẩm, lớp phủ, cấu trúc, loài cây tự mọc, côn trùng và
                phản ứng của cây. Chọn một thay đổi có thể quan sát, giữ phần
                đối chứng nếu phù hợp, rồi đánh giá qua thời gian.
              </p>
              <p>
                Khi chuẩn bị hoặc sử dụng chế phẩm, hãy học từ người có kinh
                nghiệm thực tế và ưu tiên an toàn cho người, cây trồng, nguồn
                nước và đất.
              </p>
            </div>
            <div className="mt-8">
              <ButtonLink href="/#contact">Trao đổi với dự án</ButtonLink>
            </div>
          </section>
        </article>
      </div>
    </>
  );
}
