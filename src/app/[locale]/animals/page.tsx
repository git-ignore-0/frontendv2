import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  KnowledgeLayout,
  KnowledgeSection,
} from "@/components/knowledge-layout";
import { PageHero, TableWrap } from "@/components/primitives";
import { k } from "@/content/knowledge";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: k(locale, "Animals", "Vật nuôi"),
    description: k(
      locale,
      "Natural behavior, housing, deep bedding, feed cycles and responsible animal care.",
      "Tập tính tự nhiên, chuồng trại, nền sâu, chu kỳ thức ăn và chăm sóc vật nuôi có trách nhiệm.",
    ),
    alternates: {
      canonical: `/${locale}/animals`,
      languages: {
        en: "/en/animals",
        vi: "/vi/animals",
        "x-default": "/en/animals",
      },
    },
  };
}
export default async function Animals({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const toc = [
    {
      id: "philosophy",
      label: k(locale, "Natural behavior", "Tập tính tự nhiên"),
    },
    { id: "housing", label: k(locale, "Housing", "Chuồng trại") },
    { id: "bedding", label: k(locale, "Deep bedding", "Nền chuồng sâu") },
    { id: "pigs", label: k(locale, "Pig care", "Chăm sóc heo") },
    { id: "chickens", label: k(locale, "Chicken care", "Chăm sóc gà") },
    { id: "health", label: k(locale, "Health & safety", "Sức khỏe & an toàn") },
  ];
  return (
    <>
      <PageHero
        eyebrow="Animals · Vật nuôi"
        title={k(
          locale,
          "A good environment begins with natural behavior.",
          "Môi trường tốt bắt đầu từ tập tính tự nhiên.",
        )}
        intro={k(
          locale,
          "Housing, bedding, feed and daily care are shaped so animals can stay comfortable, express suitable behavior and be observed closely.",
          "Chuồng trại, nền lót, thức ăn và nhịp chăm sóc được định hình để vật nuôi thoải mái, biểu hiện hành vi phù hợp và được quan sát kỹ.",
        )}
        image="/images/piglets.png"
        alt={k(
          locale,
          "Healthy piglets resting on straw bedding",
          "Heo con khỏe mạnh nghỉ trên nền rơm",
        )}
        position="center 42%"
      />
      <KnowledgeLayout locale={locale} toc={toc}>
        <KnowledgeSection
          id="philosophy"
          index="01 · Welfare"
          title={k(
            locale,
            "Respect the animal before designing the system.",
            "Tôn trọng vật nuôi trước khi thiết kế hệ thống.",
          )}
        >
          <div className="prose">
            <p>
              {k(
                locale,
                "Natural Farming livestock systems aim for low-input care while respecting core behavioral needs. Pigs root and wallow; chickens scratch, perch and dust-bathe. Space, shade, clean water, dry resting areas and daily observation are foundational.",
                "Hệ chăn nuôi Natural Farming hướng đến chăm sóc ít đầu vào nhưng tôn trọng nhu cầu hành vi cốt lõi. Heo ủi đất và đằm; gà bới, đậu và tắm bụi. Không gian, bóng mát, nước sạch, khu nghỉ khô và quan sát hằng ngày là nền tảng.",
              )}
            </p>
            <p>
              {k(
                locale,
                "Low input never means low responsibility. Stocking density, nutrition, vaccination, disease control and veterinary care must fit the species, climate and local law.",
                "Ít đầu vào không bao giờ đồng nghĩa ít trách nhiệm. Mật độ, dinh dưỡng, tiêm phòng, kiểm soát bệnh và chăm sóc thú y phải phù hợp loài, khí hậu và pháp luật địa phương.",
              )}
            </p>
          </div>
          <div className="cards">
            {[
              [
                "01",
                k(locale, "Behavior", "Tập tính"),
                k(
                  locale,
                  "Make room for movement, foraging and rest.",
                  "Tạo không gian vận động, tìm thức ăn và nghỉ ngơi.",
                ),
              ],
              [
                "02",
                k(locale, "Climate", "Khí hậu"),
                k(
                  locale,
                  "Use airflow, shade and sunlight deliberately.",
                  "Chủ động dùng luồng khí, bóng mát và ánh nắng.",
                ),
              ],
              [
                "03",
                k(locale, "Observation", "Quan sát"),
                k(
                  locale,
                  "Read appetite, posture, manure, sound and social behavior.",
                  "Đọc sự thèm ăn, tư thế, phân, âm thanh và hành vi xã hội.",
                ),
              ],
            ].map(([n, t, b]) => (
              <article className="card" key={n}>
                <p className="eyebrow">{n}</p>
                <h3>{t}</h3>
                <p>{b}</p>
              </article>
            ))}
          </div>
        </KnowledgeSection>
        <KnowledgeSection
          id="housing"
          index="02 · Housing"
          title={k(
            locale,
            "A building that breathes with the climate.",
            "Một công trình thở cùng khí hậu.",
          )}
        >
          <p>
            {k(
              locale,
              "Legacy pig and chicken designs use an east–west building length, a high offset roof and open sides to move hot, moist air upward while sunlight reaches the floor. The site should be open to wind, free from flooding and practical to access.",
              "Thiết kế chuồng heo và gà cũ dùng trục dài đông–tây, mái cao lệch và cạnh mở để đưa khí nóng ẩm lên trên trong khi nắng tiếp cận nền. Vị trí cần đón gió, không ngập và thuận tiện tiếp cận.",
            )}
          </p>
          <figure>
            <Image
              src="/images/legacy/pig-house-design.png"
              alt={k(
                locale,
                "Legacy airflow diagram for a Natural Farming pig house",
                "Sơ đồ luồng khí cũ cho chuồng heo Natural Farming",
              )}
              width={1000}
              height={600}
            />
            <figcaption>
              {k(
                locale,
                "Technical diagram from the legacy knowledge library.",
                "Sơ đồ kỹ thuật từ thư viện kiến thức cũ.",
              )}
            </figcaption>
          </figure>
          <ul>
            <li>
              {k(
                locale,
                "Roof overlap protects the bedding from rain while leaving a high outlet for hot air.",
                "Phần mái chồng bảo vệ nền khỏi mưa đồng thời để lại lối thoát cao cho khí nóng.",
              )}
            </li>
            <li>
              {k(
                locale,
                "Open or curtained sides allow seasonal control without blocking ventilation.",
                "Cạnh mở hoặc rèm cuốn cho phép điều chỉnh theo mùa mà không chặn thông gió.",
              )}
            </li>
            <li>
              {k(
                locale,
                "Local bamboo, timber, masonry or steel may be used only where structurally safe.",
                "Tre, gỗ, gạch hoặc thép địa phương chỉ được dùng khi bảo đảm an toàn kết cấu.",
              )}
            </li>
          </ul>
          <figure>
            <Image
              src="/images/legacy/sample-pig-house.png"
              alt={k(
                locale,
                "Examples of legacy pig house structures",
                "Các ví dụ cấu trúc chuồng heo cũ",
              )}
              width={1100}
              height={650}
            />
          </figure>
        </KnowledgeSection>
        <KnowledgeSection
          id="bedding"
          index="03 · Deep bedding"
          title={k(
            locale,
            "The floor is managed as a living layer.",
            "Nền chuồng được quản lý như một lớp sống.",
          )}
        >
          <div className="prose">
            <p>
              {k(
                locale,
                "The legacy pig system describes a deep layer with coarse woody material below and finer carbon-rich material, soil, salt and microbial preparations above. Chickens use a shallower dirt-and-chopped-straw floor. The goals are a dry surface, biological breakdown and room for natural behavior.",
                "Hệ chuồng heo cũ mô tả lớp sâu với vật liệu gỗ thô phía dưới và vật liệu giàu carbon mịn hơn, đất, muối cùng chế phẩm vi sinh phía trên. Gà dùng nền đất và rơm cắt nông hơn. Mục tiêu là bề mặt khô, phân giải sinh học và không gian cho tập tính tự nhiên.",
              )}
            </p>
            <p>
              {k(
                locale,
                "Bedding is not maintenance-free. Moisture, odor, compaction, pests and animal comfort must be monitored. Add dry carbon material and correct ventilation when conditions change; seek professional guidance for persistent problems.",
                "Nền lót không tự vận hành. Cần theo dõi ẩm, mùi, độ nén, côn trùng và sự thoải mái của vật nuôi. Bổ sung vật liệu carbon khô và điều chỉnh thông gió khi điều kiện thay đổi; tìm hỗ trợ chuyên môn nếu vấn đề kéo dài.",
              )}
            </p>
          </div>
          <TableWrap
            label={k(
              locale,
              "Deep bedding management signals",
              "Tín hiệu quản lý nền sâu",
            )}
          >
            <table>
              <thead>
                <tr>
                  <th>{k(locale, "Observe", "Quan sát")}</th>
                  <th>
                    {k(locale, "Desired condition", "Điều kiện mong muốn")}
                  </th>
                  <th>{k(locale, "Response", "Phản ứng")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{k(locale, "Moisture", "Độ ẩm")}</th>
                  <td>
                    {k(
                      locale,
                      "Tidy, friable surface without wet patches",
                      "Bề mặt tơi, gọn, không có vùng ướt",
                    )}
                  </td>
                  <td>
                    {k(
                      locale,
                      "Check leaks, airflow and carbon balance",
                      "Kiểm tra rò nước, luồng khí và cân bằng carbon",
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{k(locale, "Odor", "Mùi")}</th>
                  <td>
                    {k(
                      locale,
                      "Earthy rather than sharp ammonia",
                      "Mùi đất thay vì amoniac nồng",
                    )}
                  </td>
                  <td>
                    {k(
                      locale,
                      "Reduce loading pressure and correct wet zones",
                      "Giảm áp lực mật độ và xử lý vùng ướt",
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{k(locale, "Behavior", "Hành vi")}</th>
                  <td>
                    {k(
                      locale,
                      "Animals rest and forage comfortably",
                      "Vật nuôi nghỉ và tìm thức ăn thoải mái",
                    )}
                  </td>
                  <td>
                    {k(
                      locale,
                      "Investigate heat, injury, pests and footing",
                      "Kiểm tra nhiệt, chấn thương, côn trùng và độ bám nền",
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </TableWrap>
        </KnowledgeSection>
        <KnowledgeSection
          id="pigs"
          index="04 · Pigs"
          title={k(
            locale,
            "Transition feed and care by life stage.",
            "Chuyển thức ăn và chăm sóc theo giai đoạn sống.",
          )}
        >
          <p>
            {k(
              locale,
              "Legacy material covers selecting healthy piglets, estimating weight, gradual feed transition, growth-stage rations, breeding, farrowing and weaning. The most durable principle is to change feed slowly and observe every animal.",
              "Tài liệu cũ bao gồm chọn heo con khỏe, ước tính khối lượng, chuyển thức ăn từ từ, khẩu phần theo giai đoạn, phối giống, sinh con và cai sữa. Nguyên tắc bền vững nhất là đổi thức ăn chậm và quan sát từng con.",
            )}
          </p>
          <div className="media-prose">
            <figure>
              <Image
                src="/images/legacy/feed-process.png"
                alt={k(
                  locale,
                  "Legacy four-week pig feed transition diagram",
                  "Sơ đồ cũ về chuyển thức ăn cho heo trong bốn tuần",
                )}
                width={760}
                height={500}
              />
              <figcaption>
                {k(
                  locale,
                  "Historical phase-out diagram; adapt with a qualified nutrition or veterinary professional.",
                  "Sơ đồ chuyển đổi lịch sử; cần điều chỉnh cùng chuyên gia dinh dưỡng hoặc thú y.",
                )}
              </figcaption>
            </figure>
            <div>
              <h3>
                {k(
                  locale,
                  "Six stages in the legacy nutritive cycle",
                  "Sáu giai đoạn trong chu kỳ dinh dưỡng cũ",
                )}
              </h3>
              <ol>
                <li>{k(locale, "Weaned piglets", "Heo con cai sữa")}</li>
                <li>{k(locale, "Growers", "Heo sinh trưởng")}</li>
                <li>{k(locale, "Gilts before pregnancy", "Heo nái hậu bị")}</li>
                <li>{k(locale, "Gestating sows", "Heo nái mang thai")}</li>
                <li>{k(locale, "Lactating sows", "Heo nái cho sữa")}</li>
                <li>
                  {k(
                    locale,
                    "Sows returning to mating",
                    "Heo nái trở lại phối giống",
                  )}
                </li>
              </ol>
            </div>
          </div>
          <h3>
            {k(
              locale,
              "Weight estimation retained from the legacy page",
              "Ước tính khối lượng giữ từ trang cũ",
            )}
          </h3>
          <p>
            {k(
              locale,
              "Measure heart girth and body length in metres. The legacy formula is: heart girth × heart girth × body length × 69.3. Treat this only as an estimate and verify with current husbandry guidance.",
              "Đo vòng ngực và chiều dài thân theo mét. Công thức cũ là: vòng ngực × vòng ngực × chiều dài thân × 69,3. Chỉ xem đây là ước tính và xác minh với hướng dẫn chăn nuôi hiện hành.",
            )}
          </p>
        </KnowledgeSection>
        <KnowledgeSection
          id="chickens"
          index="05 · Chickens"
          title={k(
            locale,
            "Dry footing, fresh air and room to scratch.",
            "Nền khô, khí tươi và không gian để bới.",
          )}
        >
          <div className="media-prose">
            <figure>
              <Image
                src="/images/chickens.png"
                alt={k(
                  locale,
                  "Chickens in a naturally ventilated farm shelter",
                  "Gà trong khu chuồng thông gió tự nhiên",
                )}
                width={820}
                height={980}
              />
            </figure>
            <div className="prose">
              <p>
                {k(
                  locale,
                  "The chicken knowledge covers house design, straw bedding, purchasing chicks, a rounded brooder crib, feeds, water, perches and nesting. Chicks need protection from drafts, predators, mosquitoes and temperature stress.",
                  "Kho kiến thức về gà bao gồm thiết kế chuồng, nền rơm, mua gà con, quây úm tròn, thức ăn, nước, cầu đậu và ổ đẻ. Gà con cần được bảo vệ khỏi gió lùa, thú săn, muỗi và stress nhiệt.",
                )}
              </p>
              <p>
                {k(
                  locale,
                  "Legacy guidance uses body heat and composting warmth in a rounded brooder rather than corners where chicks can pile up. Temperature and chick behavior still require active monitoring.",
                  "Hướng dẫn cũ dùng thân nhiệt và nhiệt ủ trong quây tròn, tránh góc nơi gà con có thể chồng đè. Nhiệt độ và hành vi gà vẫn cần được theo dõi chủ động.",
                )}
              </p>
            </div>
          </div>
          <figure>
            <Image
              src="/images/legacy/brooder-crib.jpg"
              alt={k(
                locale,
                "Legacy rounded brooder crib diagram",
                "Sơ đồ quây úm tròn cũ",
              )}
              width={900}
              height={600}
            />
          </figure>
          <TableWrap
            label={k(
              locale,
              "Natural Farming chicken system overview",
              "Tổng quan hệ nuôi gà Natural Farming",
            )}
          >
            <table>
              <thead>
                <tr>
                  <th>{k(locale, "Element", "Yếu tố")}</th>
                  <th>Natural Farming</th>
                  <th>{k(locale, "Management question", "Câu hỏi quản lý")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{k(locale, "Housing", "Chuồng")}</th>
                  <td>
                    {k(
                      locale,
                      "Ventilated shelter with outdoor access where safe",
                      "Nơi trú thông gió, có tiếp cận ngoài trời khi an toàn",
                    )}
                  </td>
                  <td>
                    {k(
                      locale,
                      "Are birds dry, shaded and protected?",
                      "Gà có khô, mát và được bảo vệ không?",
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{k(locale, "Floor", "Nền")}</th>
                  <td>
                    {k(
                      locale,
                      "Dirt and chopped straw managed for dryness",
                      "Đất và rơm cắt được quản lý để giữ khô",
                    )}
                  </td>
                  <td>
                    {k(
                      locale,
                      "Is ammonia or compaction developing?",
                      "Có xuất hiện amoniac hoặc nén chặt không?",
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{k(locale, "Brooder", "Quây úm")}</th>
                  <td>
                    {k(
                      locale,
                      "Rounded, protected and sized for movement",
                      "Tròn, được bảo vệ và đủ chỗ vận động",
                    )}
                  </td>
                  <td>
                    {k(
                      locale,
                      "Are chicks evenly distributed and active?",
                      "Gà con có phân bố đều và hoạt động không?",
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </TableWrap>
        </KnowledgeSection>
        <KnowledgeSection
          id="health"
          index="06 · Responsibility"
          title={k(
            locale,
            "Prevention begins with observation—not omission.",
            "Phòng ngừa bắt đầu từ quan sát, không phải bỏ qua.",
          )}
        >
          <div className="safety-panel">
            <h3>
              {k(
                locale,
                "Animal health boundary",
                "Ranh giới sức khỏe vật nuôi",
              )}
            </h3>
            <p>
              {k(
                locale,
                "Natural Farming does not replace veterinary diagnosis, vaccination programs, biosecurity, balanced nutrition or legal welfare requirements. Isolate concerning symptoms, document changes and contact a veterinarian promptly.",
                "Natural Farming không thay thế chẩn đoán thú y, chương trình tiêm phòng, an toàn sinh học, dinh dưỡng cân đối hay yêu cầu pháp lý về phúc lợi. Cách ly triệu chứng đáng lo, ghi nhận thay đổi và liên hệ bác sĩ thú y kịp thời.",
              )}
            </p>
          </div>
          <ul>
            <li>
              {k(
                locale,
                "Check appetite, water intake, manure, breathing, gait, skin and social behavior daily.",
                "Kiểm tra sự thèm ăn, uống nước, phân, hô hấp, dáng đi, da và hành vi xã hội hằng ngày.",
              )}
            </li>
            <li>
              {k(
                locale,
                "Keep feed changes gradual and water clean and continuously available.",
                "Chuyển thức ăn từ từ, giữ nước sạch và luôn sẵn có.",
              )}
            </li>
            <li>
              {k(
                locale,
                "Maintain records for lineage, treatment, mortality and production decisions.",
                "Giữ hồ sơ phả hệ, điều trị, tử vong và quyết định sản xuất.",
              )}
            </li>
          </ul>
        </KnowledgeSection>
      </KnowledgeLayout>
    </>
  );
}
