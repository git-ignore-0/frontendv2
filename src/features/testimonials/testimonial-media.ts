import type { PublicTestimonial } from "@/lib/content-api";

export function testimonialImageSources(
  image: NonNullable<PublicTestimonial["image"]>,
) {
  const variants = [...image.variants]
    .filter((variant) => variant.width > 0 && variant.url)
    .sort((left, right) => left.width - right.width);
  return {
    src: variants[0]?.url ?? image.url,
    srcSet:
      variants.length > 0
        ? variants
            .map((variant) => `${variant.url} ${variant.width}w`)
            .join(", ")
        : undefined,
  };
}
