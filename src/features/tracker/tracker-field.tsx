import type { TrackerFarmViewModel } from "./lib/view-model";
import { TrackerMilestoneIcon } from "./tracker-icon";
import type { TrackerCopy } from "./types";

function fieldLabel(copy: TrackerCopy, farm: TrackerFarmViewModel) {
  return copy.accessibility.progress
    .replace("{name}", farm.name)
    .replace("{count}", String(farm.count))
    .replace("{percent}", String(Math.round(farm.progressPercentage)));
}

export function TrackerField({
  copy,
  farms,
}: {
  copy: TrackerCopy;
  farms: TrackerFarmViewModel[];
}) {
  return (
    <section
      aria-labelledby="tracker-field-title"
      className="tracker-field-section"
    >
      <h2 id="tracker-field-title">{copy.fieldSectionTitle}</h2>
      <p>{copy.fieldSectionSubtitle}</p>
      <div
        className="tracker-field-scroll"
        role="region"
        aria-label={copy.accessibility.field}
        tabIndex={0}
      >
        <ul>
          {farms.map((farm) => (
            <li aria-label={fieldLabel(copy, farm)} key={farm.id}>
              <span className="tracker-field-icon-stage">
                <TrackerMilestoneIcon
                  size={farm.fieldIconSize}
                  type={farm.icon}
                />
              </span>
              <span className="tracker-field-name">{farm.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
