import type { Locale } from "@/lib/i18n";

function workshopLanguage(locale: Locale) {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function formatWorkshopDateTile(
  start: string,
  timeZone: string,
  locale: Locale,
) {
  const language = workshopLanguage(locale);
  const startDate = new Date(start);

  return {
    day: new Intl.DateTimeFormat(language, {
      day: "2-digit",
      timeZone,
    }).format(startDate),
    month: new Intl.DateTimeFormat(language, {
      month: "short",
      timeZone,
    }).format(startDate),
    label: new Intl.DateTimeFormat(language, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone,
    }).format(startDate),
  };
}

export function formatWorkshopMonthGroup(
  start: string,
  timeZone: string,
  locale: Locale,
) {
  const startDate = new Date(start);
  const calendarParts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(startDate);
  const month = calendarParts.find((part) => part.type === "month")?.value;
  const year = calendarParts.find((part) => part.type === "year")?.value;

  if (!month || !year) {
    throw new Error("Unable to format workshop month group");
  }

  const label =
    locale === "vi"
      ? `Tháng ${month}, ${year}`
      : new Intl.DateTimeFormat(workshopLanguage(locale), {
          month: "long",
          year: "numeric",
          timeZone,
        })
          .format(startDate)
          .toLocaleUpperCase(workshopLanguage(locale));

  return { key: `${year}-${month}`, label };
}

export function formatWorkshopDate(
  start: string,
  end: string,
  timeZone: string,
  locale: Locale,
) {
  const language = workshopLanguage(locale);
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
