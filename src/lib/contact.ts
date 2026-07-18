export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function phoneHref(value: string) {
  const normalized = normalizePhoneNumber(value);
  return normalized ? `tel:${normalized}` : "";
}
