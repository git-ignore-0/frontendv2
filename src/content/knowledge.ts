import { z } from "zod";

const topicSchema = z.object({
  id: z.string().min(1),
  shortName: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(30),
  note: z.string().min(20),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(30),
  points: z.array(z.string().min(15)).min(2),
});

export type KnowledgeTopic = z.infer<typeof topicSchema>;
export type KnowledgeSection = z.infer<typeof sectionSchema>;

export const plantInputs = z.array(topicSchema).parse([
  {
    id: "imo",
    shortName: "IMO",
    name: "Vi sinh vật bản địa",
    summary:
      "Thu thập và nhân nuôi các quần thể vi sinh vật thích nghi với điều kiện địa phương để đưa trở lại đất và vật liệu hữu cơ.",
    note: "Quy trình cũ mô tả nhiều giai đoạn từ thu thập đến phối trộn. Cần học trực tiếp và kiểm soát vệ sinh thay vì làm theo một công thức tóm tắt.",
  },
  {
    id: "lab",
    shortName: "LAB",
    name: "Vi khuẩn lactic",
    summary:
      "Một nhóm vi khuẩn tạo axit lactic, thường được nhắc đến trong xử lý vật liệu hữu cơ và hệ thống nền chuồng.",
    note: "Hiệu quả phụ thuộc cách chuẩn bị, nồng độ và bối cảnh sử dụng; nội dung này chỉ giới thiệu khái niệm.",
  },
  {
    id: "ohn",
    shortName: "OHN",
    name: "Dinh dưỡng thảo mộc phương Đông",
    summary:
      "Dịch chiết từ một số nguyên liệu thảo mộc, được dùng trong hệ thống Natural Farming như một thành phần chăm sóc cây và vật nuôi.",
    note: "Không xem OHN là thuốc hoặc thay thế chẩn đoán chuyên môn.",
  },
  {
    id: "fpj",
    shortName: "FPJ",
    name: "Dịch thực vật lên men",
    summary:
      "Được tạo từ mô thực vật non và nguồn đường, nhằm thu nhận một phần hợp chất hòa tan từ nguyên liệu tại chỗ.",
    note: "Chọn nguyên liệu, thời điểm thu hái và vệ sinh dụng cụ đều ảnh hưởng chất lượng.",
  },
  {
    id: "ffj",
    shortName: "FFJ",
    name: "Dịch trái cây lên men",
    summary:
      "Sử dụng trái cây chín làm nguyên liệu lên men; tài liệu cũ đặt chế phẩm này ở giai đoạn cây chuyển sang ra hoa và tạo quả.",
    note: "Cần hiệu chỉnh theo cây trồng và điều kiện thực tế, không áp dụng đồng loạt.",
  },
  {
    id: "faa",
    shortName: "FAA",
    name: "Amino acid từ cá",
    summary:
      "Tận dụng phụ phẩm cá qua quá trình lên men để tạo nguồn dinh dưỡng dạng lỏng cho hệ thống canh tác.",
    note: "Quá trình phải được quản lý cẩn thận về nguyên liệu, mùi, vệ sinh và liều dùng.",
  },
  {
    id: "wca",
    shortName: "WCA",
    name: "Canxi hòa tan trong nước",
    summary:
      "Một dạng đầu vào chứa canxi được Natural Farming sử dụng có chọn lọc theo giai đoạn phát triển của cây.",
    note: "Nhu cầu canxi cần dựa trên cây, đất và quan sát thực tế.",
  },
  {
    id: "wcap",
    shortName: "WCAP",
    name: "Canxi phosphate hòa tan",
    summary:
      "Chế phẩm chứa canxi và phosphate, thường được giới thiệu trong tài liệu cũ cho giai đoạn chuyển tiếp sinh trưởng.",
    note: "Cần xác minh quy trình và liều lượng với người hướng dẫn có kinh nghiệm.",
  },
]);

export const animalSections = z.array(sectionSchema).parse([
  {
    id: "phuc-loi",
    title: "Bắt đầu từ tập tính tự nhiên",
    summary:
      "Vật nuôi cần không gian để vận động, nghỉ, đào bới hoặc bới tìm thức ăn theo tập tính của loài. Thiết kế nuôi hướng đến việc giảm căng thẳng thay vì chỉ tối ưu mật độ.",
    points: [
      "Quan sát hành vi, thể trạng và mức độ thoải mái mỗi ngày.",
      "Bảo đảm bóng mát, nước sạch, khu nghỉ và khoảng không phù hợp.",
    ],
  },
  {
    id: "chuong-trai",
    title: "Chuồng trại thở cùng khí hậu",
    summary:
      "Tài liệu cũ ưu tiên hướng nhà, mái cao và khoảng mở để không khí lưu chuyển, nắng có thể tiếp cận nền chuồng và vật liệu lót luôn khô.",
    points: [
      "Chọn vị trí cao ráo, tránh ngập và có đường gió tự nhiên.",
      "Dùng vật liệu địa phương khi phù hợp, nhưng không đánh đổi an toàn kết cấu.",
    ],
  },
  {
    id: "nen-chuong",
    title: "Nền chuồng là một hệ sinh thái",
    summary:
      "Nền sâu gồm vật liệu giàu carbon và hệ vi sinh được quản lý như một lớp ủ sống, hỗ trợ phân giải chất hữu cơ và tạo bề mặt phù hợp cho vật nuôi.",
    points: [
      "Giữ nền tơi, khô và theo dõi mùi như một tín hiệu quản lý.",
      "Bổ sung vật liệu theo điều kiện thật; không xem nền chuồng là hệ thống tự vận hành.",
    ],
  },
  {
    id: "thuc-an",
    title: "Thức ăn từ nguồn lực tại chỗ",
    summary:
      "Natural Farming tìm cách phối hợp nguồn thức ăn địa phương, phụ phẩm nông nghiệp và nguyên liệu lên men để tăng tính tự chủ của nông trại.",
    points: [
      "Khẩu phần phải phù hợp loài, tuổi, giai đoạn sinh sản và thể trạng.",
      "Chuyển đổi thức ăn từ từ và theo dõi phản ứng của từng đàn.",
    ],
  },
  {
    id: "suc-khoe",
    title: "Phòng ngừa bằng quan sát",
    summary:
      "Môi trường sạch, thông thoáng, khẩu phần cân đối và theo dõi sớm là nền tảng. Natural Farming không đồng nghĩa với bỏ tiêm phòng hay trì hoãn điều trị.",
    points: [
      "Thiết lập lịch kiểm tra sức khỏe và an toàn sinh học.",
      "Khi có dấu hiệu bệnh, liên hệ bác sĩ thú y và tuân thủ quy định địa phương.",
    ],
  },
]);
