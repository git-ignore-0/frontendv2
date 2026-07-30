import type { RewardMedia } from "@/features/account/types";

export function rewardImageSources(image: RewardMedia) {
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
