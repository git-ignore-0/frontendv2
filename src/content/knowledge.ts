import { z } from "zod";
import { locales, type Locale } from "@/lib/i18n";

const inputTranslationSchema = z.object({
  name: z.string(),
  summary: z.string(),
});
const localizedInputShape = Object.fromEntries(
  locales.map((locale) => [locale, inputTranslationSchema]),
) as Record<Locale, typeof inputTranslationSchema>;
const inputSchema = z.object({
  code: z.string(),
  ...localizedInputShape,
});
export const plantInputs = z.array(inputSchema).parse([
  {
    code: "IMO",
    en: {
      name: "Indigenous Microorganisms",
      summary:
        "Locally adapted microorganism communities collected and cultured for use with soil and organic matter.",
    },
    vi: {
      name: "Vi sinh vật bản địa",
      summary:
        "Quần thể vi sinh vật thích nghi tại chỗ được thu thập và nhân nuôi để dùng với đất và vật liệu hữu cơ.",
    },
  },
  {
    code: "LAB",
    en: {
      name: "Lactic Acid Bacteria",
      summary:
        "Lactic-acid-producing bacteria discussed in organic material processing and livestock bedding systems.",
    },
    vi: {
      name: "Vi khuẩn lactic",
      summary:
        "Nhóm vi khuẩn tạo axit lactic được nhắc đến trong xử lý vật liệu hữu cơ và hệ thống nền chuồng.",
    },
  },
  {
    code: "OHN",
    en: {
      name: "Oriental Herbal Nutrient",
      summary:
        "An herbal extract used as one component in some Natural Farming plant and animal practices.",
    },
    vi: {
      name: "Dinh dưỡng thảo mộc phương Đông",
      summary:
        "Dịch chiết thảo mộc được dùng như một thành phần trong một số thực hành cho cây và vật nuôi.",
    },
  },
  {
    code: "FPJ",
    en: {
      name: "Fermented Plant Juice",
      summary:
        "A fermented input made from actively growing plant tissue and a sugar source.",
    },
    vi: {
      name: "Dịch thực vật lên men",
      summary:
        "Đầu vào lên men từ mô thực vật đang sinh trưởng và một nguồn đường.",
    },
  },
  {
    code: "FFJ",
    en: {
      name: "Fermented Fruit Juice",
      summary:
        "A fruit-based ferment associated in legacy material with flowering and fruiting stages.",
    },
    vi: {
      name: "Dịch trái cây lên men",
      summary:
        "Chế phẩm lên men từ trái cây, được tài liệu cũ liên hệ với giai đoạn ra hoa và tạo quả.",
    },
  },
  {
    code: "FAA",
    en: {
      name: "Fish Amino Acid",
      summary:
        "A fermented input that makes use of fish by-products as a liquid nutrient source.",
    },
    vi: {
      name: "Amino acid từ cá",
      summary:
        "Đầu vào lên men tận dụng phụ phẩm cá làm nguồn dinh dưỡng dạng lỏng.",
    },
  },
  {
    code: "WCA",
    en: {
      name: "Water-soluble Calcium",
      summary:
        "A calcium-containing input selectively used according to plant development and observed need.",
    },
    vi: {
      name: "Canxi hòa tan trong nước",
      summary:
        "Đầu vào chứa canxi được dùng có chọn lọc theo giai đoạn phát triển và nhu cầu quan sát được của cây.",
    },
  },
  {
    code: "WCAP",
    en: {
      name: "Water-soluble Calcium Phosphate",
      summary:
        "A calcium-and-phosphate preparation associated with transitional growth stages.",
    },
    vi: {
      name: "Canxi phosphate hòa tan",
      summary:
        "Chế phẩm canxi và phosphate được liên hệ với các giai đoạn chuyển tiếp sinh trưởng.",
    },
  },
]);
