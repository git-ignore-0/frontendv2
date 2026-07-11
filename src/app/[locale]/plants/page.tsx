import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  KnowledgeLayout,
  KnowledgeSection,
} from "@/components/knowledge-layout";
import { PageHero, TableWrap, TextLink } from "@/components/primitives";
import { k, plantInputs } from "@/content/knowledge";
import { isLocale, localizedPath } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: k(locale, "Plants", "Cây trồng"),
    description: k(
      locale,
      "Living soil, farming systems and an index of Natural Farming inputs.",
      "Đất sống, hệ thống canh tác và chỉ mục đầu vào Natural Farming.",
    ),
    alternates: {
      canonical: `/${locale}/plants`,
      languages: {
        en: "/en/plants",
        vi: "/vi/plants",
        "x-default": "/en/plants",
      },
    },
  };
}
export default async function Plants({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const toc = [
    {
      id: "context",
      label: k(locale, "A different question", "Một câu hỏi khác"),
    },
    { id: "systems", label: k(locale, "Farming systems", "Hệ thống canh tác") },
    { id: "soil", label: k(locale, "Living soil", "Đất sống") },
    { id: "cycle", label: k(locale, "Nutritive cycle", "Chu kỳ dinh dưỡng") },
    { id: "inputs", label: k(locale, "Input index", "Chỉ mục chế phẩm") },
    {
      id: "practice",
      label: k(locale, "Practice with care", "Thực hành thận trọng"),
    },
  ];
  return (
    <>
      <PageHero
        eyebrow="Plants · Cây trồng"
        title={k(
          locale,
          "Feed the soil before feeding the plant.",
          "Nuôi đất trước khi nuôi cây.",
        )}
        intro={k(
          locale,
          "Natural Farming sees plant health as the result of a living system where structure, organic matter, roots and microorganisms work together.",
          "Natural Farming nhìn sức khỏe cây trồng như kết quả của một hệ sống, nơi cấu trúc, hữu cơ, rễ và vi sinh vật cùng làm việc.",
        )}
        image="/images/plants-hero.jpg"
        alt={k(
          locale,
          "Fresh green plants growing in rich soil",
          "Cây xanh tươi phát triển trong đất giàu hữu cơ",
        )}
      />
      <KnowledgeLayout locale={locale} toc={toc}>
        <KnowledgeSection
          id="context"
          index="01 · Context"
          title={k(
            locale,
            "A different way begins with a different question.",
            "Một cách làm khác bắt đầu từ câu hỏi khác.",
          )}
        >
          <div className="prose">
            <p>
              {k(
                locale,
                "Instead of asking only what a crop lacks, Natural Farming also asks what is happening in the soil, which local resources are being overlooked, and what intervention is sufficient.",
                "Thay vì chỉ hỏi cây đang thiếu gì, Natural Farming còn hỏi điều gì đang diễn ra trong đất, nguồn lực địa phương nào đang bị bỏ qua và can thiệp nào là vừa đủ.",
              )}
            </p>
            <p>
              {k(
                locale,
                "Legacy material contrasts ploughing, complete weeding and purchased inputs with reduced disturbance, living ground cover and farm-made inputs. These are directions for observation—not a universal prescription.",
                "Tài liệu cũ đặt cày xới, làm cỏ hoàn toàn và đầu vào mua ngoài cạnh giảm xáo trộn, lớp phủ sống và đầu vào tự làm. Đây là định hướng quan sát, không phải công thức chung cho mọi nơi.",
              )}
            </p>
          </div>
        </KnowledgeSection>
        <KnowledgeSection
          id="systems"
          index="02 · Comparison"
          title={k(
            locale,
            "Conventional, organic and Natural Farming.",
            "Canh tác thông thường, hữu cơ và Natural Farming.",
          )}
        >
          <TableWrap
            label={k(
              locale,
              "Comparison of farming systems",
              "So sánh các hệ thống canh tác",
            )}
          >
            <table>
              <thead>
                <tr>
                  <th>{k(locale, "Lens", "Góc nhìn")}</th>
                  <th>{k(locale, "Conventional", "Thông thường")}</th>
                  <th>{k(locale, "Organic", "Hữu cơ")}</th>
                  <th>Natural Farming</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    k(locale, "Inputs", "Đầu vào"),
                    k(
                      locale,
                      "Commercial fertilizers and crop-protection products may be used.",
                      "Có thể dùng phân bón và sản phẩm bảo vệ cây trồng thương mại.",
                    ),
                    k(
                      locale,
                      "Inputs follow the organic standard in use.",
                      "Đầu vào tuân theo tiêu chuẩn hữu cơ áp dụng.",
                    ),
                    k(
                      locale,
                      "Prioritizes local materials and farm-made preparations.",
                      "Ưu tiên vật liệu tại chỗ và chế phẩm tự làm.",
                    ),
                  ],
                  [
                    k(locale, "Soil management", "Quản lý đất"),
                    k(
                      locale,
                      "Tillage and direct control are common tools.",
                      "Cày xới và kiểm soát trực tiếp là công cụ phổ biến.",
                    ),
                    k(
                      locale,
                      "Practices vary by standard and farm context.",
                      "Thực hành thay đổi theo tiêu chuẩn và bối cảnh nông trại.",
                    ),
                    k(
                      locale,
                      "Seeks less disturbance and more biological activity.",
                      "Hướng đến ít xáo trộn và nhiều hoạt động sinh học hơn.",
                    ),
                  ],
                  [
                    k(locale, "Decision making", "Ra quyết định"),
                    k(
                      locale,
                      "Often follows input and yield schedules.",
                      "Thường theo lịch đầu vào và năng suất.",
                    ),
                    k(
                      locale,
                      "Combines agronomy with certification requirements.",
                      "Kết hợp nông học với yêu cầu chứng nhận.",
                    ),
                    k(
                      locale,
                      "Emphasizes observation and ecological relationships.",
                      "Nhấn mạnh quan sát và quan hệ sinh thái.",
                    ),
                  ],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) =>
                      i === 0 ? <th key={c}>{c}</th> : <td key={c}>{c}</td>,
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </KnowledgeSection>
        <KnowledgeSection
          id="soil"
          index="03 · Foundation"
          title={k(
            locale,
            "Soil is a place of exchange.",
            "Đất là nơi sự sống trao đổi.",
          )}
        >
          <div className="media-prose">
            <figure>
              <Image
                src="/images/microscope.png"
                alt={k(
                  locale,
                  "A person observing a sample through a microscope",
                  "Một người quan sát mẫu vật qua kính hiển vi",
                )}
                width={900}
                height={900}
              />
              <figcaption>
                {k(
                  locale,
                  "Observation connects what is visible above ground with processes too small to see directly.",
                  "Quan sát kết nối điều nhìn thấy trên mặt đất với những quá trình quá nhỏ để thấy trực tiếp.",
                )}
              </figcaption>
            </figure>
            <div className="prose">
              <p>
                {k(
                  locale,
                  "Roots, minerals, water, air, organic matter and organisms form the soil environment. Covering the surface, returning appropriate organic matter and limiting unnecessary disturbance can support this system.",
                  "Rễ, khoáng, nước, không khí, vật liệu hữu cơ và sinh vật tạo nên môi trường đất. Che phủ bề mặt, hoàn trả hữu cơ phù hợp và hạn chế xáo trộn không cần thiết có thể hỗ trợ hệ này.",
                )}
              </p>
              <p>
                {k(
                  locale,
                  "Indigenous Microorganisms (IMO) are central in the legacy knowledge. Collection and culture require hygiene, judgment and on-site learning; they should not be treated as one identical product for every place.",
                  "Vi sinh vật bản địa (IMO) là nội dung trung tâm trong kho kiến thức cũ. Việc thu thập và nhân nuôi cần vệ sinh, phán đoán và học tại chỗ; không nên xem như một sản phẩm giống nhau cho mọi nơi.",
                )}
              </p>
            </div>
          </div>
        </KnowledgeSection>
        <KnowledgeSection
          id="cycle"
          index="04 · Growth"
          title={k(
            locale,
            "Read the plant’s changing needs.",
            "Đọc nhu cầu thay đổi của cây.",
          )}
        >
          <p>
            {k(
              locale,
              "Legacy material organizes plant development into vegetative growth, transition, flowering and fruiting. Its potato diagram is retained below as a historical teaching aid; crop stage, soil and local conditions must guide actual decisions.",
              "Tài liệu cũ tổ chức sự phát triển của cây theo sinh trưởng, chuyển tiếp, ra hoa và tạo quả. Sơ đồ khoai tây được giữ dưới đây như tư liệu giảng dạy lịch sử; giai đoạn cây, đất và điều kiện địa phương phải dẫn dắt quyết định thực tế.",
            )}
          </p>
          <figure>
            <Image
              src="/images/legacy/potato-cycle.png"
              alt={k(
                locale,
                "Legacy potato growth and nutritive-cycle diagram",
                "Sơ đồ cũ về sinh trưởng và chu kỳ dinh dưỡng của khoai tây",
              )}
              width={900}
              height={520}
            />
            <figcaption>
              {k(
                locale,
                "Legacy diagram retained for knowledge parity; terminology and application require practitioner review.",
                "Sơ đồ cũ được giữ để bảo toàn kiến thức; thuật ngữ và ứng dụng cần người thực hành rà soát.",
              )}
            </figcaption>
          </figure>
        </KnowledgeSection>
        <KnowledgeSection
          id="inputs"
          index="05 · Knowledge index"
          title={k(
            locale,
            "Eight names commonly encountered.",
            "Tám tên gọi thường gặp.",
          )}
        >
          <p>
            {k(
              locale,
              "This is a concept map, not a recipe set. Preparation, dilution, crop stage, hygiene and local regulation all matter.",
              "Đây là bản đồ khái niệm, không phải bộ công thức. Cách chuẩn bị, pha loãng, giai đoạn cây, vệ sinh và quy định địa phương đều quan trọng.",
            )}
          </p>
          <div className="input-list">
            {plantInputs.map((input) => (
              <details key={input.code}>
                <summary>
                  <strong>{input.code}</strong>
                  <span>{input[locale].name}</span>
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{input[locale].summary}</p>
              </details>
            ))}
          </div>
        </KnowledgeSection>
        <KnowledgeSection
          id="practice"
          index="06 · Next step"
          title={k(
            locale,
            "Begin small, record, compare.",
            "Bắt đầu nhỏ, ghi lại, so sánh.",
          )}
        >
          <div className="prose">
            <p>
              {k(
                locale,
                "Record moisture, ground cover, structure, volunteer plants, insects and crop response. Change one observable factor, retain a comparison where practical, and evaluate through time.",
                "Ghi nhận độ ẩm, lớp phủ, cấu trúc, cây tự mọc, côn trùng và phản ứng của cây. Thay đổi một yếu tố có thể quan sát, giữ phần đối chứng khi phù hợp và đánh giá theo thời gian.",
              )}
            </p>
            <p>
              {k(
                locale,
                "Learn preparation and use from experienced practitioners, and protect people, crops, water and soil.",
                "Học cách chuẩn bị và sử dụng từ người có kinh nghiệm, đồng thời bảo vệ con người, cây trồng, nguồn nước và đất.",
              )}
            </p>
          </div>
          <TextLink href={localizedPath(locale, "/about")}>
            {k(locale, "Understand our approach", "Hiểu cách tiếp cận")}
          </TextLink>
        </KnowledgeSection>
      </KnowledgeLayout>
    </>
  );
}
