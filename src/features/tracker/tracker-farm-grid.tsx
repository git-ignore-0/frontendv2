import type { TrackerFarmViewModel } from "./lib/view-model";
import { TrackerFarmCard } from "./tracker-farm-card";
import type { TrackerCopy } from "./types";

export function TrackerFarmGrid({
  copy,
  farms,
}: {
  copy: TrackerCopy;
  farms: TrackerFarmViewModel[];
}) {
  return (
    <section aria-labelledby="tracker-grid-title">
      <h2 className="sr-only" id="tracker-grid-title">
        {copy.farmGridTitle}
      </h2>
      <ul className="tracker-farm-grid">
        {farms.map((farm) => (
          <li key={farm.id}>
            <TrackerFarmCard copy={copy} farm={farm} />
          </li>
        ))}
      </ul>
    </section>
  );
}
