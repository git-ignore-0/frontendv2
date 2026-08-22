import { TRACKER_SIGNUP_GOAL } from "./lib/milestones";
import type { TrackerFarmViewModel } from "./lib/view-model";
import { TrackerFarmMedia } from "./tracker-farm-media";
import { TrackerMilestoneIcon } from "./tracker-icon";
import type { TrackerCopy } from "./types";

function replaceCopy(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replace(`{${key}}`, String(value)),
    template,
  );
}

function nextMilestoneCopy(copy: TrackerCopy, farm: TrackerFarmViewModel) {
  if (!farm.nextMilestoneKey) {
    const message = replaceCopy(copy.leaderMessage, {
      name: farm.name,
      milestone: copy.milestones.communityLeader.label,
    });
    const milestone = copy.milestones.communityLeader.label;
    const [before, after] = message.split(milestone);
    return (
      <>
        <span aria-hidden="true">🎉 </span>
        {before}
        <strong>{milestone}</strong>
        {after}
      </>
    );
  }
  const isSingle = farm.remainingSignups === 1;
  const template = isSingle ? copy.nextMilestoneOne : copy.nextMilestoneMany;
  const countTemplate = isSingle
    ? copy.nextMilestoneCountOne
    : copy.nextMilestoneCountMany;
  const countLabel = replaceCopy(countTemplate, {
    remaining: farm.remainingSignups,
  });
  const message = replaceCopy(template, {
    remaining: farm.remainingSignups,
    name: farm.name,
    milestone: copy.milestones[farm.nextMilestoneKey].label,
    description: copy.milestones[farm.nextMilestoneKey].description,
  });
  const [before, after] = message.split(countLabel);
  return (
    <>
      {before}
      <strong>{countLabel}</strong>
      {after}
    </>
  );
}

export function TrackerFarmCard({
  copy,
  farm,
  onActivate,
}: {
  copy: TrackerCopy;
  farm: TrackerFarmViewModel;
  onActivate: (farm: TrackerFarmViewModel, opener: HTMLElement) => void;
}) {
  const milestone = copy.milestones[farm.milestoneKey];
  const progressLabel = replaceCopy(copy.accessibility.progress, {
    name: farm.name,
    count: farm.count,
    percent: Math.round(farm.progressPercentage),
  });

  return (
    <article className="fcard tracker-farm-card">
      {farm.isLeader ? (
        <span aria-label={copy.leaderBadge} className="tracker-leader-badge">
          <span aria-hidden="true">⭐</span>
        </span>
      ) : null}
      <header className="tracker-farm-heading">
        <span className="tracker-farm-avatar">
          <TrackerFarmMedia farm={farm} variant="avatar" />
        </span>
        <span>
          <h3 title={farm.name}>{farm.name}</h3>
          <span className="tracker-farm-location">{farm.location}</span>
        </span>
      </header>
      <div className="stage-label tracker-stage-badge">
        <TrackerMilestoneIcon size={16} type={farm.icon} />
        <span>{milestone.label}</span>
      </div>
      <p className="tracker-count">
        <strong>{farm.count}</strong>
        <span>
          {copy.signupGoal.replace("{count}", String(TRACKER_SIGNUP_GOAL))}
        </span>
      </p>
      <div className="tracker-progress-wrap">
        <div
          aria-label={progressLabel}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(farm.progressPercentage)}
          className="tracker-progress"
          role="progressbar"
        >
          <span style={{ width: `${farm.progressPercentage}%` }} />
        </div>
        <ol aria-hidden="true" className="tracker-progress-ticks">
          {farm.ticks.map((tick) => (
            <li
              className={[tick.reached && "is-reached"]
                .filter(Boolean)
                .join(" ")}
              key={tick.value}
              style={{ left: `${(tick.value / TRACKER_SIGNUP_GOAL) * 100}%` }}
            >
              {tick.value}
            </li>
          ))}
        </ol>
      </div>
      <p className="tracker-impact-note">{nextMilestoneCopy(copy, farm)}</p>
      <div className="card-action">
        <button
          aria-label={copy.accessibility.farm.replace("{name}", farm.name)}
          className="detail-trigger"
          onClick={(event) => onActivate(farm, event.currentTarget)}
          type="button"
        >
          <span>{copy.viewFarmer}</span>
          <span aria-hidden="true" className="detail-trigger__icon">
            →
          </span>
        </button>
      </div>
    </article>
  );
}
