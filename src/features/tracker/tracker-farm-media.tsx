"use client";

import { useEffect, useState } from "react";

import type { TrackerFarmViewModel } from "./lib/view-model";
import { TrackerMilestoneIcon } from "./tracker-icon";

const mediaClassNames = {
  avatar: {
    fallback: "tracker-avatar-fallback",
    image: "tracker-avatar-photo",
  },
  dialog: {
    fallback: "tracker-dialog-fallback",
    image: "tracker-dialog-photo",
  },
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
          src={image.url}
          width={image.width}
        />
      ) : null}
    </>
  );
}
