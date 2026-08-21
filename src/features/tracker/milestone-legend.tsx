import { TRACKER_LEGEND_MILESTONES } from "./lib/milestones";
import { TrackerMilestoneIcon } from "./tracker-icon";
import type { TrackerCopy } from "./types";

export function MilestoneLegend({ copy }: { copy: TrackerCopy }) {
  return (
    <section aria-label={copy.legendLabel} className="tracker-legend">
      <ul>
        {TRACKER_LEGEND_MILESTONES.map((milestone) => {
          const milestoneCopy = copy.milestones[milestone.key];
          return (
            <li key={milestone.key}>
              <span className="tracker-legend-threshold">
                {milestone.minimum}
              </span>
              <TrackerMilestoneIcon size={18} type={milestone.icon} />
              <span className="tracker-legend-copy">
                <span>{milestoneCopy.label}</span>
                <span className="sr-only"> — {milestoneCopy.description}</span>
              </span>
              <span className="sr-only">
                {copy.thresholdLabel.replace(
                  "{count}",
                  String(milestone.minimum),
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
