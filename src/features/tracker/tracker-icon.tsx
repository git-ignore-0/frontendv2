import type { CSSProperties } from "react";

import type { TrackerMilestoneIcon as TrackerMilestoneIconType } from "./lib/milestones";

const milestoneEmoji = {
  seed: "🌰",
  sprout: "🌱",
  harvest: "🌳",
} as const;

export function TrackerMilestoneIcon({
  type,
  size,
  className,
}: {
  type: TrackerMilestoneIconType;
  size?: number;
  className?: string;
}) {
  const style = size ? ({ fontSize: `${size}px` } satisfies CSSProperties) : {};
  const classes = ["tracker-plant-icon", className].filter(Boolean).join(" ");

  if (type === "people") {
    return (
      <span
        aria-hidden="true"
        className={`${classes} tracker-mother-tree`}
        style={style}
      >
        <span className="tracker-mother-tree-child">🌱</span>
        <span className="tracker-mother-tree-main">🌳</span>
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={classes} style={style}>
      {milestoneEmoji[type]}
    </span>
  );
}
