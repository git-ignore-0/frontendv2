import type { TrackerCopy } from "./types";

export function TrackerLiveNote({ copy }: { copy: TrackerCopy }) {
  return (
    <aside className="tracker-demo-note">
      <strong>{copy.liveNoteTitle}</strong> {copy.liveNoteBody}
    </aside>
  );
}
