export const EXTERNAL_LINK_PROPS = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

export function validExternalHttpUrl(value?: string) {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}
