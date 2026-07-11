import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TextLink } from "@/components/primitives";
import { isLocale, localizedPath, siteUrl, storeUrl } from "@/lib/i18n";

const copy = {
  en: {
    title: "Life begins in living soil.",
    intro:
      "Natural Farming works with local ecosystems to nurture soil, resilient plants, healthy animals and farming communities.",
    primary: "Discover our approach",
    secondary: "Explore the knowledge",
    what: "What is Natural Farming?",
    whatBody:
      "A way of observing and cultivating that begins with the relationships already present in a place: soil structure, organic matter, roots, microorganisms, animals and people.",
    principles: [
      [
        "Nurture soil life",
        "Build the conditions for roots and soil organisms to work together.",
      ],
      [
        "Use local resources",
        "Return suitable farm materials to useful biological cycles.",
      ],
      [
        "Reduce dependency",
        "Learn to make careful decisions with fewer external inputs.",
      ],
      [
        "Observe before acting",
        "Start small, read changes and adapt to the local context.",
      ],
    ],
    pillars: "One farm, connected lives.",
    plantTitle: "Plants begin below ground",
    plantBody:
      "Explore soil, microorganisms and the inputs commonly discussed in Natural Farming.",
    animalTitle: "Care shaped by natural behavior",
    animalBody:
      "Learn how housing, bedding, feed and observation support animal wellbeing.",
    peopleTitle: "Knowledge grows between people",
    peopleBody:
      "Natural Farming Vietnam connects practical observation with shared learning.",
    storeTitle: "The store lives somewhere else.",
    storeBody:
      "Products, prices and checkout are handled by our dedicated Farmbrite store. This website stays focused on the project and its knowledge.",
    storeCta: "Visit the store",
    contactTitle: "Let’s grow knowledge together.",
    contactBody:
      "Connect with the project about learning, collaboration or applying Natural Farming in your context.",
  },
  vi: {
    title: "Sự sống bắt đầu từ đất sống.",
    intro:
      "Nông nghiệp tự nhiên cùng hệ sinh thái bản địa nuôi dưỡng đất, cây trồng bền bỉ, vật nuôi khỏe mạnh và cộng đồng nông nghiệp.",
    primary: "Khám phá cách tiếp cận",
    secondary: "Khám phá kho kiến thức",
    what: "Natural Farming là gì?",
    whatBody:
      "Một cách quan sát và canh tác bắt đầu từ các mối quan hệ đã có ở mỗi nơi: cấu trúc đất, vật liệu hữu cơ, rễ, vi sinh vật, vật nuôi và con người.",
    principles: [
      [
        "Nuôi dưỡng sự sống trong đất",
        "Tạo điều kiện để rễ cây và sinh vật đất cùng làm việc.",
      ],
      [
        "Dùng nguồn lực bản địa",
        "Đưa vật liệu phù hợp tại nông trại trở lại các vòng tuần hoàn sinh học.",
      ],
      [
        "Giảm sự phụ thuộc",
        "Học cách đưa ra quyết định thận trọng với ít đầu vào bên ngoài hơn.",
      ],
      [
        "Quan sát trước khi hành động",
        "Bắt đầu nhỏ, đọc thay đổi và thích nghi với bối cảnh địa phương.",
      ],
    ],
    pillars: "Một nông trại, những sự sống kết nối.",
    plantTitle: "Cây bắt đầu từ dưới mặt đất",
    plantBody:
      "Khám phá đất, vi sinh vật và các đầu vào thường gặp trong Natural Farming.",
    animalTitle: "Chăm sóc theo tập tính tự nhiên",
    animalBody:
      "Tìm hiểu cách chuồng trại, nền lót, thức ăn và quan sát hỗ trợ phúc lợi vật nuôi.",
    peopleTitle: "Kiến thức lớn lên giữa con người",
    peopleBody:
      "Natural Farming Vietnam kết nối quan sát thực hành với việc học hỏi cùng nhau.",
    storeTitle: "Cửa hàng ở một không gian riêng.",
    storeBody:
      "Sản phẩm, giá và thanh toán được xử lý tại cửa hàng Farmbrite. Website này tập trung vào dự án và kiến thức.",
    storeCta: "Đến cửa hàng",
    contactTitle: "Cùng nhau nuôi lớn tri thức.",
    contactBody:
      "Kết nối với dự án về học tập, hợp tác hoặc áp dụng Natural Farming trong bối cảnh của bạn.",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = copy[locale];
  return {
    title: c.title,
    description: c.intro,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", vi: "/vi", "x-default": "/en" },
    },
    openGraph: {
      title: c.title,
      description: c.intro,
      url: `${siteUrl}/${locale}`,
      images: ["/images/farm-aerial.jpg"],
    },
  };
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = copy[locale];
  return (
    <>
      <section className="home-hero">
        <div className="hero-media">
          <Image
            src="/images/farm-aerial.jpg"
            alt={
              locale === "en"
                ? "Aerial view of the tropical Natural Farming Vietnam farm"
                : "Toàn cảnh trên cao của nông trại nhiệt đới Natural Farming Vietnam"
            }
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="hero-shade" />
        <div className="shell hero-copy">
          <p className="eyebrow">Living Soil · Đất sống</p>
          <h1>{c.title}</h1>
          <p>{c.intro}</p>
          <div className="hero-actions">
            <TextLink href={localizedPath(locale, "/about")}>
              {c.primary}
            </TextLink>
            <TextLink href={localizedPath(locale, "/plants")}>
              {c.secondary}
            </TextLink>
          </div>
        </div>
      </section>
      <section className="section section-cream">
        <div className="shell split">
          <div>
            <p className="eyebrow">01 · Living systems</p>
            <h2 className="section-heading">{c.what}</h2>
          </div>
          <div>
            <p className="lede">{c.whatBody}</p>
            <div className="principles">
              {c.principles.map(([title, body], i) => (
                <div className="principle" key={title}>
                  <strong>0{i + 1}</strong>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <p className="eyebrow">02 · Soil to community</p>
          <h2 className="section-heading">{c.pillars}</h2>
          <div className="story-grid">
            <article>
              <div className="story-image">
                <Image
                  src="/images/harvest.jpg"
                  alt=""
                  fill
                  sizes="(min-width:760px) 33vw,100vw"
                />
              </div>
              <p className="eyebrow">Plants</p>
              <h3>{c.plantTitle}</h3>
              <p>{c.plantBody}</p>
              <TextLink href={localizedPath(locale, "/plants")}>
                {locale === "en" ? "Explore plants" : "Khám phá cây trồng"}
              </TextLink>
            </article>
            <article>
              <div className="story-image tall">
                <Image
                  src="/images/piglets.png"
                  alt=""
                  fill
                  sizes="(min-width:760px) 33vw,100vw"
                />
              </div>
              <p className="eyebrow">Animals</p>
              <h3>{c.animalTitle}</h3>
              <p>{c.animalBody}</p>
              <TextLink href={localizedPath(locale, "/animals")}>
                {locale === "en" ? "Explore animals" : "Khám phá vật nuôi"}
              </TextLink>
            </article>
            <article>
              <div className="story-image">
                <Image
                  src="/images/family-field.jpg"
                  alt=""
                  fill
                  sizes="(min-width:760px) 33vw,100vw"
                />
              </div>
              <p className="eyebrow">Community</p>
              <h3>{c.peopleTitle}</h3>
              <p>{c.peopleBody}</p>
              <TextLink href={localizedPath(locale, "/about")}>
                {locale === "en" ? "Meet the project" : "Tìm hiểu dự án"}
              </TextLink>
            </article>
          </div>
        </div>
      </section>
      <section className="section section-forest">
        <div className="shell split">
          <div>
            <p className="eyebrow">03 · Farmbrite</p>
            <h2 className="section-heading">{c.storeTitle}</h2>
          </div>
          <div>
            <p className="lede store-lede">{c.storeBody}</p>
            <TextLink href={storeUrl} external>
              {c.storeCta}
            </TextLink>
          </div>
        </div>
      </section>
      <section className="section contact-band">
        <div className="shell split">
          <div className="contact-image">
            <Image
              src="/images/microscope.png"
              alt=""
              fill
              sizes="(min-width:760px) 45vw,100vw"
            />
          </div>
          <div>
            <p className="eyebrow">04 · Connect</p>
            <h2 className="section-heading">{c.contactTitle}</h2>
            <p className="lede">{c.contactBody}</p>
            <TextLink href="mailto:info@naturalfarmingvietnam.com">
              info@naturalfarmingvietnam.com
            </TextLink>
          </div>
        </div>
      </section>
    </>
  );
}
