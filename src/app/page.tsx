import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { ContentReviewNote } from "@/components/ui/content-review-note";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Đất sống — Từ đất, sự sống bắt đầu",
  description:
    "Khám phá Natural Farming Vietnam và cách tiếp cận bắt đầu từ đất, cây trồng, vật nuôi và cộng đồng.",
  alternates: { canonical: "/" },
};

const principles = [
  [
    "01",
    "Nuôi dưỡng đất",
    "Xem đất là một hệ sinh thái sống, nơi rễ, vi sinh vật và vật liệu hữu cơ cùng tương tác.",
  ],
  [
    "02",
    "Dùng nguồn lực bản địa",
    "Quan sát những gì nông trại đang có và tìm cách đưa chúng trở lại vòng tuần hoàn.",
  ],
  [
    "03",
    "Giảm phụ thuộc bên ngoài",
    "Từng bước tăng khả năng tự chủ thay vì chạy theo một công thức áp dụng cho mọi nơi.",
  ],
  [
    "04",
    "Học bằng quan sát",
    "Đọc dấu hiệu từ đất, cây và vật nuôi trước khi quyết định cách can thiệp.",
  ],
] as const;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/logo-mark.png`,
  email: siteConfig.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bến Tre",
    addressCountry: "VN",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <section className="bg-warm">
        <div className="site-container grid min-h-[calc(92svh-var(--header-height))] grid-cols-[minmax(0,1fr)] items-center gap-9 py-8 md:grid-cols-12 md:gap-8 md:py-12">
          <div className="hero-enter md:col-span-5 md:pr-5">
            <span className="eyebrow">Living Soil · Đất sống</span>
            <h1 className="display-title">
              Cùng thiên nhiên nuôi dưỡng sự sống
            </h1>
            <p className="lead mt-7">
              Từ đất khỏe đến cây trồng, vật nuôi và cộng đồng — Natural Farming
              bắt đầu bằng quan sát và lớn lên từ nguồn lực tại chỗ.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/about">Khám phá Natural Farming</ButtonLink>
              <ButtonLink href="#knowledge" variant="secondary">
                Plants & Animals
              </ButtonLink>
            </div>
          </div>
          <figure className="relative md:col-span-7 md:pl-3">
            <div className="image-frame aspect-[4/3] md:aspect-[5/6] md:max-h-[44rem] lg:aspect-[4/3]">
              <Image
                src="/images/farm-aerial.webp"
                alt="Toàn cảnh nông trại nhiệt đới nhìn từ trên cao với các luống trồng và nhà kính"
                fill
                priority
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="absolute -bottom-3 right-3 bg-rice px-4 py-3 text-xs font-bold uppercase tracking-[0.13em] text-soil md:-left-3 md:right-auto">
              Bến Tre · Việt Nam
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        className="section-pad"
        aria-labelledby="what-is-natural-farming"
      >
        <div className="site-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="eyebrow">Một cách nhìn khác</span>
            <h2 id="what-is-natural-farming" className="section-title mt-5">
              Đất không chỉ là đất.
            </h2>
            <p className="lead mt-6">
              Đó là nơi những mối quan hệ vô hình tạo nên khả năng sinh trưởng
              nhìn thấy được.
            </p>
            <Link href="/about" className="text-link mt-6">
              Tìm hiểu phương pháp <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="lg:col-span-7 lg:pt-16">
            <ol className="border-forest/20 grid border-t sm:grid-cols-2">
              {principles.map(([number, title, description]) => (
                <li
                  key={number}
                  className="border-forest/20 sm:nth-[2]:pr-0 sm:nth-[3]:pl-0 border-b py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-2xl text-forest">
                      {title}
                    </h3>
                    <span className="text-xs font-bold text-terra">
                      {number}
                    </span>
                  </div>
                  <p className="text-muted mt-3 text-sm leading-6">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        id="knowledge"
        className="bg-forest-deep py-20 text-warm md:py-28"
        aria-labelledby="knowledge-title"
      >
        <div className="site-container">
          <span className="eyebrow !text-straw">Hai cánh cửa kiến thức</span>
          <h2 id="knowledge-title" className="section-title mt-5 !text-warm">
            Chăm đất. Hiểu sự sống.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-12 md:items-end">
            <Link href="/plants" className="group md:col-span-7">
              <article>
                <div className="image-frame aspect-[4/3]">
                  <Image
                    src="/images/harvest-leaves.webp"
                    alt="Rau lá vừa thu hoạch được đặt trong khay"
                    fill
                    sizes="(min-width: 768px) 58vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="border-warm/25 flex min-h-24 items-center justify-between border-t py-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.13em] text-young">
                      Plants
                    </span>
                    <h3 className="mt-1 font-display text-3xl">
                      Đất sống, cây khỏe
                    </h3>
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-2xl transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </article>
            </Link>
            <Link href="/animals" className="group md:col-span-5 md:mb-10">
              <article>
                <div className="image-frame aspect-[4/3]">
                  <Image
                    src="/images/piglets-straw.webp"
                    alt="Hai heo con nằm nghỉ trên lớp rơm khô"
                    fill
                    sizes="(min-width: 768px) 42vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="border-warm/25 flex min-h-24 items-center justify-between border-t py-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.13em] text-straw">
                      Animals
                    </span>
                    <h3 className="mt-1 font-display text-3xl">
                      Nuôi dưỡng đúng tập tính
                    </h3>
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-2xl transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </article>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-warm" aria-labelledby="our-work-title">
        <div className="site-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="image-frame aspect-[3/4] lg:sticky lg:top-28">
              <Image
                src="/images/microscope.webp"
                alt="Thành viên Natural Farming Vietnam quan sát mẫu vật qua kính hiển vi"
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:py-12">
            <span className="eyebrow">Từ quan sát đến thực hành</span>
            <h2 id="our-work-title" className="section-title mt-5">
              Học cách đọc hệ sinh thái trước khi hành động.
            </h2>
            <ol className="border-forest/20 mt-10 grid gap-0 border-t">
              {[
                "Quan sát hệ sinh thái",
                "Học và thử nghiệm",
                "Áp dụng tại nông trại",
                "Chia sẻ điều đã học",
              ].map((item, index) => (
                <li
                  key={item}
                  className="border-forest/20 grid min-h-20 grid-cols-[3rem_1fr] items-center border-b"
                >
                  <span className="text-xs font-extrabold text-terra">
                    0{index + 1}
                  </span>
                  <span className="font-display text-xl text-forest">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
            <p className="prose-copy mt-8">
              Natural Farming Vietnam hướng đến việc kết nối quan sát, kiến thức
              và thực hành trên nông trại. Những kết quả, chương trình và phạm
              vi hoạt động cụ thể sẽ chỉ được công bố sau khi có dữ liệu đã xác
              nhận.
            </p>
          </div>
        </div>
      </section>

      <section
        className="overflow-hidden bg-soil text-warm"
        aria-labelledby="next-generation-title"
      >
        <div className="site-container grid md:grid-cols-12">
          <div className="py-16 md:col-span-5 md:py-24 md:pr-10">
            <span className="eyebrow !text-straw">Cho thế hệ tiếp theo</span>
            <h2
              id="next-generation-title"
              className="section-title mt-5 !text-warm"
            >
              Điều hôm nay gieo xuống sẽ ở lại trong đất ngày mai.
            </h2>
            <p className="text-rice/80 mt-6 max-w-lg leading-7">
              Một nông trại không chỉ tạo ra mùa vụ. Nó còn lưu giữ kiến thức,
              thói quen chăm sóc và trách nhiệm với những người sẽ tiếp tục làm
              việc trên mảnh đất ấy.
            </p>
          </div>
          <div className="relative min-h-[28rem] md:col-span-7 md:min-h-[40rem]">
            <Image
              src="/images/people-on-soil.webp"
              alt="Một người lớn và một em nhỏ cùng đi trên khu đất canh tác"
              fill
              sizes="(min-width: 768px) 58vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section className="section-pad" aria-labelledby="store-title">
        <div className="site-container border-forest/20 grid gap-10 border-y py-12 md:grid-cols-12 md:items-center md:py-16">
          <div className="md:col-span-8">
            <span className="eyebrow">Cửa hàng riêng</span>
            <h2
              id="store-title"
              className="mt-4 max-w-3xl font-display text-4xl leading-tight text-forest md:text-5xl"
            >
              Sản phẩm từ mạng lưới được quản lý trên Farmbrite.
            </h2>
            <p className="text-muted mt-4 max-w-2xl leading-7">
              Website chính không hiển thị giá, giỏ hàng hay thanh toán. Bạn sẽ
              được chuyển sang cửa hàng riêng để tiếp tục.
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <ButtonLink href={siteConfig.storeUrl} external>
              Đến cửa hàng
            </ButtonLink>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="section-pad bg-warm"
        aria-labelledby="contact-title"
      >
        <div className="site-container grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="eyebrow">Kết nối</span>
            <h2 id="contact-title" className="section-title mt-5">
              Cùng bắt đầu một cuộc trò chuyện từ điều thật.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="lead">
              Nếu bạn muốn tìm hiểu Natural Farming hoặc trao đổi về một hướng
              hợp tác, hãy liên hệ trực tiếp với dự án.
            </p>
            <div className="mt-7 grid gap-2">
              <a className="text-link" href={`mailto:${siteConfig.email}`}>
                {siteConfig.email}
              </a>
              <a className="text-link" href="tel:+84971519185">
                {siteConfig.phone}
              </a>
              <span className="text-muted mt-2 text-sm">
                {siteConfig.location}
              </span>
            </div>
            <ContentReviewNote>
              Thông tin liên hệ trên được kế thừa từ website cũ. Chủ dự án cần
              xác nhận trước khi xuất bản chính thức.
            </ContentReviewNote>
          </div>
        </div>
      </section>
    </>
  );
}
