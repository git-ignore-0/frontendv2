import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/content/breadcrumb-json-ld";
import { PageHero } from "@/components/content/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { ContentReviewNote } from "@/components/ui/content-review-note";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "Câu chuyện, sứ mệnh và cách tiếp cận của Natural Farming Vietnam.",
  alternates: { canonical: "/about" },
};

const values = [
  [
    "Gần đất",
    "Bắt đầu từ điều kiện thật của đất, khí hậu và nguồn lực mỗi nơi.",
  ],
  [
    "Biết quan sát",
    "Không áp một công thức cố định lên một hệ sinh thái luôn thay đổi.",
  ],
  [
    "Có trách nhiệm",
    "Cân nhắc tác động tới con người, vật nuôi và những mùa vụ tiếp theo.",
  ],
  [
    "Cùng chia sẻ",
    "Kiến thức có ý nghĩa hơn khi được kiểm nghiệm và trao đổi trong cộng đồng.",
  ],
] as const;

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Giới thiệu" path="/about" />
      <PageHero
        eyebrow="Về dự án"
        title="Gieo một cách làm, nuôi một cách sống."
        description="Natural Farming Vietnam kết nối kiến thức và thực hành để người làm nông có thể cộng tác với tự nhiên, bắt đầu từ chính mảnh đất mình đang chăm sóc."
        image="/images/field-silhouette.webp"
        imageAlt="Hai người cầm cuốc đi trên khu đất lúc chiều muộn"
        imagePosition="62% center"
      />
      <section className="section-pad" aria-labelledby="reason-title">
        <div className="site-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="eyebrow">Lý do bắt đầu</span>
            <h2 id="reason-title" className="section-title mt-5">
              Làm giàu cho đất, không chỉ lấy đi từ đất.
            </h2>
          </div>
          <div className="prose-copy max-w-prose lg:col-span-7 lg:col-start-6">
            <p>
              Website cũ mô tả Natural Farming như một cách cộng tác với tự
              nhiên để trồng thực phẩm, chú trọng vi sinh vật bản địa, hạn chế
              đầu vào làm suy kiệt đất và tận dụng nguồn lực có sẵn tại nông
              trại.
            </p>
            <p>
              Trong bản MVP này, chúng tôi giữ lại tinh thần ấy nhưng tránh
              những tuyên bố tuyệt đối. Natural Farming không phải một công thức
              duy nhất; mỗi quyết định cần đi từ quan sát, thử nghiệm có kiểm
              soát và trách nhiệm với hệ sinh thái địa phương.
            </p>
            <ContentReviewNote>
              Bản kể chi tiết về thời điểm thành lập, người sáng lập và các cột
              mốc chưa có dữ liệu đã xác nhận nên chưa được công bố.
            </ContentReviewNote>
          </div>
        </div>
      </section>
      <section
        className="bg-forest-deep py-20 text-warm md:py-28"
        aria-labelledby="mission-title"
      >
        <div className="site-container grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="eyebrow !text-straw">Sứ mệnh</span>
            <h2 id="mission-title" className="section-title mt-5 !text-warm">
              Chăm đất hôm nay, gìn giữ khả năng sống cho ngày mai.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="font-display text-2xl leading-relaxed text-rice md:text-3xl">
              Chúng tôi hướng đến việc hỗ trợ người làm nông làm việc với sự tôn
              trọng dành cho đất đai, sinh vật và con người — để tình yêu thương
              được nhìn thấy trong cả lời nói lẫn việc làm.
            </p>
            <p className="text-rice/65 mt-6 text-sm leading-6">
              Bản diễn đạt này được biên tập từ tuyên bố sứ mệnh trên website cũ
              và cần chủ dự án duyệt.
            </p>
          </div>
        </div>
      </section>
      <section className="section-pad bg-warm" aria-labelledby="values-title">
        <div className="site-container">
          <span className="eyebrow">Giá trị định hướng</span>
          <h2 id="values-title" className="section-title mt-5">
            Thực tế. Sống động. Có trách nhiệm.
          </h2>
          <div className="border-forest/20 mt-12 grid border-t sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([title, description], index) => (
              <article
                key={title}
                className="border-forest/20 border-b py-7 sm:px-6 sm:odd:pl-0 lg:border-r lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0 lg:odd:px-6"
              >
                <span className="text-xs font-extrabold text-terra">
                  0{index + 1}
                </span>
                <h3 className="mt-5 font-display text-2xl text-forest">
                  {title}
                </h3>
                <p className="text-muted mt-3 text-sm leading-6">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad" aria-labelledby="approach-title">
        <div className="site-container grid gap-12 lg:grid-cols-12">
          <div className="image-frame aspect-[4/3] lg:col-span-7">
            <Image
              src="/images/farm-landscape.webp"
              alt="Nông trại với các luống rau, cây chuối và hàng dừa ở Bến Tre"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:self-center">
            <span className="eyebrow">Cách tiếp cận</span>
            <h2
              id="approach-title"
              className="mt-5 font-display text-4xl leading-tight text-forest"
            >
              Một nông trại là mạng lưới của nhiều mối quan hệ.
            </h2>
            <ul className="text-muted mt-7 grid gap-4 text-sm leading-6">
              <li>Quan sát đất, nước, cây và vật nuôi như một tổng thể.</li>
              <li>Ưu tiên vòng tuần hoàn vật liệu và nguồn lực tại chỗ.</li>
              <li>Thử nghiệm ở quy mô phù hợp, ghi nhận và điều chỉnh.</li>
              <li>Chia sẻ điều đã học bằng ngôn ngữ dễ tiếp cận.</li>
            </ul>
          </div>
        </div>
      </section>
      <section
        className="section-pad bg-soil text-warm"
        aria-labelledby="people-title"
      >
        <div className="site-container grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <span className="eyebrow !text-straw">Con người & đối tác</span>
            <h2 id="people-title" className="section-title mt-5 !text-warm">
              Dự án được làm nên bởi những người thật.
            </h2>
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <p className="text-rice/80 text-lg leading-8">
              Danh sách đội ngũ, vai trò và đối tác trên website cũ chưa được
              xác nhận là còn hiện hành. MVP chủ động không hiển thị danh tính
              hoặc logo đối tác cho đến khi nhận được phê duyệt.
            </p>
            <div className="mt-8">
              <ButtonLink href="/#contact" variant="light">
                Kết nối với dự án
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
