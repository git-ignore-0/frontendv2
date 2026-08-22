import type { PublicTrackerImage } from "./public-contract";

type TrackerImageUse = "thumbnail" | "primary" | "lightbox";

export function getTrackerImageSource(
  image: PublicTrackerImage,
  use: TrackerImageUse,
) {
  if (use === "lightbox") {
    return [
      { url: image.url, width: image.width },
      ...image.variants.map((variant) => ({
        url: variant.url,
        width: variant.width,
      })),
    ].sort((left, right) => right.width - left.width)[0].url;
  }

  const targetWidth = use === "thumbnail" ? 480 : 960;
  return (
    image.variants.find((variant) => variant.width === targetWidth)?.url ??
    image.url
  );
}
