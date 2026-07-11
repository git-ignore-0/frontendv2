import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/content/breadcrumb-json-ld";
import { KnowledgeNote } from "@/components/content/knowledge-note";
import { PageHero } from "@/components/content/page-hero";
import { TableOfContents } from "@/components/content/table-of-contents";
import { ButtonLink } from "@/components/ui/button-link";
import { animalSections } from "@/content/knowledge";

export const metadata: Metadata = {
  title: "Vật nuôi",
  description:
    "Cách tiếp cận Natural Farming với tập tính vật nuôi, chuồng trại, nền sâu, thức ăn và sức khỏe đàn.",
  alternates: { canonical: "/animals" },
};
const toc = [
  { id: "triet-ly", label: "Triết lý" },
  ...animalSections.map((item) => ({ id: item.id, label: item.title })),
  { id: "ga-va-heo", label: "Gà và heo" },
  { id: "an-toan", label: "An toàn & sức khỏe" },
];

export default function AnimalsPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Vật nuôi" path="/animals" />
      <PageHero
        eyebrow="Animals · Vật nuôi"
        title="Một môi trường tốt bắt đầu từ tập tính tự nhiên."
        description="Chuồng trại, nền lót, thức ăn và nhịp chăm sóc được thiết kế để vật nuôi có thể sống khỏe, biểu hiện hành vi phù hợp và được quan sát mỗi ngày."
        image="/images/piglets-straw.webp"
        imageAlt="Hai heo con khỏe mạnh nằm nghỉ trên nền rơm"
        imagePosition="center 45%"
      />
      <div className="site-container py-10 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:py-20">
        <TableOfContents items={toc} />
        <article className="min-w-0 max-w-4xl">
          <KnowledgeNote />
          <section
            id="triet-ly"
            className="border-forest/15 scroll-mt-28 border-b py-14"
          >
            <span className="eyebrow">01 · Triết lý</span>
            <h2 className="section-title mt-5">
              Tôn trọng con vật trước khi thiết kế hệ thống.
            </h2>
            <div className="prose-copy mt-7 max-w-prose">
              <p>
                Website cũ mô tả chăn nuôi Natural Farming như một cách giữ chi
                phí hợp lý trong khi tôn trọng nhu cầu hành vi của vật nuôi. Bản
                biên tập này đặt phúc lợi và quản lý có trách nhiệm lên trước
                những tuyên bố về lợi nhuận.
              </p>
              <p>
                Một hệ thống tốt không chỉ “ít mùi”. Nó cần đủ không gian, thông
                gió, nền phù hợp, nước sạch, khẩu phần cân đối, an toàn sinh học
                và khả năng can thiệp chuyên môn khi cần.
              </p>
            </div>
          </section>
          {animalSections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="border-forest/15 scroll-mt-28 border-b py-14"
            >
              <span className="eyebrow">0{index + 2} · Nền tảng</span>
              <h2 className="section-title mt-5">{section.title}</h2>
              <p className="lead mt-6">{section.summary}</p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="border-forest/20 text-muted border-t pt-4 text-sm leading-6"
                  >
                    {point}
                  </li>
                ))}
              </ul>
              {section.id === "nen-chuong" && (
                <div className="image-frame mt-10 aspect-[16/9]">
                  <Image
                    src="/images/chicken-house.webp"
                    alt="Gà đứng trong chuồng có ánh sáng và nền vật liệu tự nhiên"
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover object-center"
                  />
                </div>
              )}
            </section>
          ))}
          <section
            id="ga-va-heo"
            className="border-forest/15 scroll-mt-28 border-b py-14"
          >
            <span className="eyebrow">07 · Mô hình</span>
            <h2 className="section-title mt-5">
              Cùng nguyên tắc, khác cách biểu hiện.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <article>
                <div className="image-frame aspect-[4/3]">
                  <Image
                    src="/images/chicken-house.webp"
                    alt="Gà trong khu chuồng có nền tự nhiên"
                    fill
                    sizes="(min-width: 768px) 32vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-5 font-display text-3xl text-forest">
                  Mô hình gà
                </h3>
                <p className="text-muted mt-3 text-sm leading-6">
                  Gà cần chỗ đậu, khu bới tìm thức ăn, nền khô và bảo vệ khỏi
                  thời tiết lẫn động vật gây hại. Mật độ và khẩu phần thay đổi
                  theo tuổi và mục đích nuôi.
                </p>
              </article>
              <article>
                <div className="image-frame aspect-[4/3]">
                  <Image
                    src="/images/piglets-field.webp"
                    alt="Hai heo con đi trên khu đất có cỏ"
                    fill
                    sizes="(min-width: 768px) 32vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-5 font-display text-3xl text-forest">
                  Mô hình heo
                </h3>
                <p className="text-muted mt-3 text-sm leading-6">
                  Heo cần không gian đào bới, khu mát, nền sâu được quản lý và
                  chuyển đổi khẩu phần từ từ. Thiết kế phải phù hợp khí hậu nóng
                  ẩm và khả năng chăm sóc thực tế.
                </p>
              </article>
            </div>
          </section>
          <section id="an-toan" className="scroll-mt-28 py-14">
            <span className="eyebrow">08 · Trách nhiệm</span>
            <h2 className="section-title mt-5">
              “Tự nhiên” không thay thế chuyên môn thú y.
            </h2>
            <div className="prose-copy mt-7 max-w-prose">
              <p>
                Các công thức chi tiết, số liệu hiệu quả và khuyến nghị ngừng
                kháng sinh hoặc tiêm phòng trên website cũ không được đưa vào
                MVP vì chưa có thẩm định. Thuốc chỉ nên dùng theo chỉ định
                chuyên môn, đúng thời gian ngưng thuốc và quy định hiện hành.
              </p>
              <p>
                Nếu vật nuôi bỏ ăn, sốt, khó thở, tiêu chảy kéo dài, tổn thương
                hoặc thay đổi hành vi bất thường, hãy cách ly phù hợp và liên hệ
                bác sĩ thú y.
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
