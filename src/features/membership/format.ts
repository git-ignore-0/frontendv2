import type { Locale } from "@/lib/i18n";

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

export function vietQrUrl(instruction: {
  bank_bin?: string;
  bank_code?: string;
  account_number: string;
  account_name: string;
  amount: string;
  transfer_content: string;
}) {
  const bank = encodeURIComponent(instruction.bank_bin || instruction.bank_code || "");
  const account = encodeURIComponent(instruction.account_number);
  const url = new URL(
    `https://img.vietqr.io/image/${bank}-${account}-compact2.png`,
  );
  url.searchParams.set("amount", instruction.amount);
  url.searchParams.set("addInfo", instruction.transfer_content);
  url.searchParams.set("accountName", instruction.account_name);
  return url.toString();
}
