import type { Locale } from "@/lib/i18n";

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function vietnamTimestampParts(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(parsed);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return {
    date: `${part("day")}/${part("month")}/${part("year")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

export function formatMembershipDate(value: string | null | undefined) {
  const match = value?.match(isoDatePattern);
  if (!match) return "—";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatMembershipTimestampDate(
  value: string | null | undefined,
) {
  return vietnamTimestampParts(value)?.date ?? "—";
}

export function formatMembershipExclusiveEndDate(
  value: string | null | undefined,
) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "—";
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const calendarDate = new Date(Date.UTC(year, monthIndex, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== monthIndex ||
    calendarDate.getUTCDate() !== day
  )
    return "—";
  calendarDate.setUTCDate(calendarDate.getUTCDate() - 1);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(calendarDate.getUTCDate())}/${pad(calendarDate.getUTCMonth() + 1)}/${calendarDate.getUTCFullYear()}`;
}

export function formatMembershipDateTime(value: string | null | undefined) {
  const parts = vietnamTimestampParts(value);
  return parts ? `${parts.date} ${parts.time}` : "—";
}

function normalizedDecimal(value: string) {
  const match = value.trim().match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const fraction = (match[2] ?? "").replace(/0+$/, "");
  return { integer: match[1].replace(/^0+(?=\d)/, ""), fraction };
}

function groupInteger(value: string, separator: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function formatMembershipMoney(value: string, locale: Locale) {
  const decimal = normalizedDecimal(value);
  if (!decimal || decimal.fraction) return value;
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(BigInt(decimal.integer));
}

export function formatMembershipUnits(
  unitSize: string,
  units: number,
  locale: Locale,
) {
  const decimal = normalizedDecimal(unitSize);
  if (!decimal || !Number.isSafeInteger(units)) return `${units} × ${unitSize}`;
  const scale = decimal.fraction.length;
  const scaled =
    BigInt(`${decimal.integer}${decimal.fraction}`) * BigInt(units);
  const padded = scaled.toString().padStart(scale + 1, "0");
  const integer = scale ? padded.slice(0, -scale) : padded;
  const fraction = scale ? padded.slice(-scale).replace(/0+$/, "") : "";
  const groupSeparator = locale === "vi" ? "." : ",";
  const decimalSeparator = locale === "vi" ? "," : ".";
  return `${groupInteger(integer, groupSeparator)}${fraction ? `${decimalSeparator}${fraction}` : ""}`;
}

export function membershipUnitLabel(
  locale: Locale,
  labels: { unit_label_vi: string; unit_label_en: string },
) {
  return locale === "vi" ? labels.unit_label_vi : labels.unit_label_en;
}
