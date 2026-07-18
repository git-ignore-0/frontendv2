import type { Locale } from "@/lib/i18n";

export function formatWorkshopDate(
  start: string,
  end: string,
  timeZone: string,
  locale: Locale,
) {
  const language = locale === "vi" ? "vi-VN" : "en-US";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const date = new Intl.DateTimeFormat(language, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });
  const time = new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  const startDay = date.format(startDate);
  const endDay = date.format(endDate);
  if (startDay === endDay) {
    return `${startDay} · ${time.format(startDate)}–${time.format(endDate)}`;
  }
  return `${startDay} · ${time.format(startDate)} – ${endDay} · ${time.format(endDate)}`;
}
