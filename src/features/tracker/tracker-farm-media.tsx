"use client";

import { useEffect, useState } from "react";

import type { TrackerFarmViewModel } from "./lib/view-model";
import { getTrackerImageSource } from "./lib/media";
import { TrackerMilestoneIcon } from "./tracker-icon";

const mediaClassNames = {
  avatar: {
    fallback: "tracker-avatar-fallback",
    image: "tracker-avatar-photo",
  },
  dialog: {
    fallback: "farmer-dialog__fallback",
    image: "dialog-photo",
  },
} as const;

const mediaUseByVariant = {
  avatar: "thumbnail",
  dialog: "primary",
} as const;

export function TrackerFarmMedia({
  farm,
  variant,
}: {
  farm: TrackerFarmViewModel;
  variant: "avatar" | "dialog";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = farm.image;
  const classNames = mediaClassNames[variant];

  useEffect(() => {
    setImageFailed(false);
  }, [image?.id, image?.url]);

  const fallbackSize =
    variant === "dialog" ? (farm.isLeader ? 72 : 78) : farm.isLeader ? 28 : 30;

  return (
    <>
      <span className={classNames.fallback}>
        <TrackerMilestoneIcon size={fallbackSize} type={farm.icon} />
      </span>
      {image && !imageFailed ? (
        // The backend supplies validated media URLs that may use different hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={image.alt}
          className={classNames.image}
          height={image.height}
          onError={() => setImageFailed(true)}
          src={getTrackerImageSource(image, mediaUseByVariant[variant])}
          width={image.width}
        />
      ) : null}
    </>
  );
}
