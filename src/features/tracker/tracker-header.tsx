import type { TrackerCopy } from "./types";

export function TrackerHeader({ copy }: { copy: TrackerCopy }) {
  return (
    <header className="tracker-header">
      <p className="tracker-eyebrow">{copy.eyebrow}</p>
      <h1>
        <span aria-hidden="true">🌱 </span>
        {copy.title}
      </h1>
      <p className="tracker-intro">{copy.intro}</p>
    </header>
  );
}
