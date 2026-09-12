export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function normalizeVietnamPhone(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  const national = compact.startsWith("+84")
    ? compact.slice(3)
    : compact.startsWith("84")
      ? compact.slice(2)
      : compact.startsWith("0")
        ? compact.slice(1)
        : "";
  return /^[1-9]\d{8,9}$/.test(national) ? `+84${national}` : "";
}

export function phoneHref(value: string) {
  const normalized = normalizePhoneNumber(value);
  return normalized ? `tel:${normalized}` : "";
}
