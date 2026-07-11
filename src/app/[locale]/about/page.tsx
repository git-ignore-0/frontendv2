import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHero, ReviewNote, TextLink } from "@/components/primitives";
import { getDictionary } from "@/content/dictionaries";
import { isLocale } from "@/lib/i18n";

const content = {
  en: {
    title: "Rooted in place. Open to learning.",
    intro:
      "Natural Farming Vietnam is a project exploring how careful observation, local resources and shared practice can nourish land and life.",
    mission: "Our reason for being",
    body: [
      "Modern farming can place pressure on soil, biodiversity and farmer independence. Natural Farming offers a practical lens: understand the ecology of a place, use what is locally available and intervene with care.",
      "The project brings together cultivation, animal care, observation and learning. Its Christian roots inform a commitment to stewardship, while its knowledge and invitation remain open to everyone.",
    ],
    values: "How we approach the work",
    cards: [
      [
        "Observe",
        "Read the land, animals and seasonal change before choosing an intervention.",
      ],
      [
        "Regenerate",
        "Return organic resources to living cycles and protect the conditions for life.",
      ],
      [
        "Share",
        "Treat knowledge as a practice strengthened through transparent learning.",
      ],
      [
        "Adapt",
        "Respect that climate, culture and each farm require contextual decisions.",
      ],
    ],
    truth: "A story still being documented",
    truthBody:
      "Confirmed milestones, team profiles, partner names and operating regions have not yet been supplied for publication. This section deliberately avoids invented claims and is ready for project-owner content.",
    cta: "Start a conversation",
  },
  vi: {
    title: "Bám rễ tại nơi chốn. Rộng mở để học hỏi.",
    intro:
      "Natural Farming Vietnam là dự án khám phá cách quan sát thận trọng, nguồn lực bản địa và thực hành chung có thể nuôi dưỡng đất và sự sống.",
    mission: "Lý do chúng tôi hiện diện",
    body: [
      "Nông nghiệp hiện đại có thể tạo áp lực lên đất, đa dạng sinh học và tính tự chủ của người nông dân. Natural Farming đem đến một góc nhìn thực hành: hiểu sinh thái nơi chốn, dùng những gì sẵn có tại địa phương và can thiệp thận trọng.",
      "Dự án kết nối canh tác, chăm sóc vật nuôi, quan sát và học hỏi. Căn tính Cơ Đốc nuôi dưỡng cam kết quản gia có trách nhiệm, trong khi kiến thức và lời mời tham gia luôn rộng mở với mọi người.",
    ],
    values: "Cách chúng tôi tiếp cận công việc",
    cards: [
      [
        "Quan sát",
        "Đọc đất, vật nuôi và thay đổi mùa vụ trước khi chọn cách can thiệp.",
      ],
      [
        "Tái sinh",
        "Đưa nguồn hữu cơ trở lại vòng tuần hoàn sống và bảo vệ điều kiện cho sự sống.",
      ],
      [
        "Chia sẻ",
        "Xem kiến thức là một thực hành mạnh lên qua việc học hỏi minh bạch.",
      ],
      [
        "Thích nghi",
        "Tôn trọng khí hậu, văn hóa và bối cảnh riêng của mỗi nông trại.",
      ],
    ],
    truth: "Một câu chuyện đang được ghi lại",
    truthBody:
      "Các cột mốc, hồ sơ đội ngũ, tên đối tác và khu vực hoạt động đã xác nhận chưa được cung cấp để xuất bản. Phần này chủ động không tạo thông tin giả và sẵn sàng nhận nội dung từ chủ dự án.",
    cta: "Bắt đầu trao đổi",
  },
} as const;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = content[locale];
  return {
    title: locale === "en" ? "About" : "Về chúng tôi",
    description: c.intro,
    alternates: {
      canonical: `/${locale}/about`,
      languages: { en: "/en/about", vi: "/vi/about", "x-default": "/en/about" },
    },
  };
}
export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = content[locale];
  const t = getDictionary(locale);
  return (
    <>
      <PageHero
        eyebrow="About · Câu chuyện"
        title={c.title}
        intro={c.intro}
        image="/images/farmer-field.jpg"
        alt={
          locale === "en"
            ? "A farmer working in a sunlit field"
            : "Người nông dân làm việc trên cánh đồng trong nắng"
        }
        position="center 38%"
      />
      <section className="section">
        <div className="shell split">
          <div>
            <p className="eyebrow">01 · Purpose</p>
            <h2 className="section-heading">{c.mission}</h2>
          </div>
          <div className="prose">
            {c.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-cream">
        <div className="shell">
          <p className="eyebrow">02 · Values</p>
          <h2 className="section-heading">{c.values}</h2>
          <div className="value-grid">
            {c.cards.map(([title, body], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell split">
          <div className="about-image">
            <Image
              src="/images/farm-garden.jpeg"
              alt={
                locale === "en"
                  ? "Tropical garden at Natural Farming Vietnam"
                  : "Khu vườn nhiệt đới tại Natural Farming Vietnam"
              }
              fill
              sizes="(min-width:760px) 48vw,100vw"
            />
          </div>
          <div>
            <p className="eyebrow">03 · Our story</p>
            <h2 className="section-heading">{c.truth}</h2>
            <p className="lede">{c.truthBody}</p>
            <ReviewNote>{t.review}</ReviewNote>
            <TextLink href="mailto:info@naturalfarmingvietnam.com">
              {c.cta}
            </TextLink>
          </div>
        </div>
      </section>
    </>
  );
}
