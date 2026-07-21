const vi = {
  eyebrow: "Workshop · Học từ thực hành",
  title: "Workshop sắp diễn ra",
  intro:
    "Gặp gỡ, quan sát và thực hành Natural Farming trong bối cảnh địa phương.",
  upcoming: "Sắp và đang diễn ra",
  past: "Đã tổ chức",
  emptyUpcoming: "Chưa có workshop mới được công bố.",
  emptyPast: "Chưa có workshop đã tổ chức.",
  details: "Xem chi tiết",
  register: "Đăng ký workshop",
  fallback: "Nội dung này hiện chỉ có bằng tiếng Anh.",
  readOriginal: "Read in English",
  date: "Thời gian",
  statusLabel: "Trạng thái",
  status: {
    upcoming: "Sắp diễn ra",
    ongoing: "Đang diễn ra",
    completed: "Đã diễn ra",
  },
  homeEyebrow: "Workshop · Học cùng nhau",
  homeTitle: "Từ quan sát đến thực hành.",
  homeCta: "Xem tất cả workshop",
  preview: "Bản xem trước — nội dung này chưa được xuất bản",
};

type WorkshopCopy = typeof vi;

const en: WorkshopCopy = {
  eyebrow: "Workshops · Learning by doing",
  title: "Upcoming workshops",
  intro: "Meet, observe and practise Natural Farming in its local context.",
  upcoming: "Upcoming and ongoing",
  past: "Past workshops",
  emptyUpcoming: "No new workshop has been announced yet.",
  emptyPast: "No past workshop is available yet.",
  details: "View details",
  register: "Register for workshop",
  fallback: "This content is currently available in Vietnamese only.",
  readOriginal: "Đọc bằng tiếng Việt",
  date: "Date & time",
  statusLabel: "Status",
  status: {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
  },
  homeEyebrow: "Workshops · Learn together",
  homeTitle: "From observation to practice.",
  homeCta: "View all workshops",
  preview: "Draft preview — this content is not published",
};

export const workshopCopy = { vi, en };
