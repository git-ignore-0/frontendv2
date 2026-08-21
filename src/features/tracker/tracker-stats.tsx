import type { TrackerStatsModel } from "./lib/view-model";
import type { TrackerCopy } from "./types";

export function TrackerStats({
  copy,
  stats,
}: {
  copy: TrackerCopy;
  stats: TrackerStatsModel | null;
}) {
  const items = [
    ["farms", stats?.farms, copy.stats.farms],
    ["signups", stats?.totalSignups, copy.stats.totalSignups],
    ["leaders", stats?.leaders, copy.stats.leaders],
  ] as const;

  return (
    <dl aria-busy={stats === null} className="tracker-stats">
      {items.map(([key, value, label]) => (
        <div className="tracker-stat" key={key}>
          <dd
            className={[value === undefined && "is-loading"]
              .filter(Boolean)
              .join(" ")}
          >
            {value ?? <span className="sr-only">{copy.loading}</span>}
          </dd>
          <dt>{label}</dt>
        </div>
      ))}
    </dl>
  );
}
