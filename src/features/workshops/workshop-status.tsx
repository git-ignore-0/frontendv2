import { workshopCopy } from "@/features/workshops/copy";
import type { PublicWorkshop } from "@/lib/content-api";
import type { Locale } from "@/lib/i18n";

export function WorkshopStatus({
  status,
  locale,
  showDot = false,
}: {
  status: PublicWorkshop["status"];
  locale: Locale;
  showDot?: boolean;
}) {
  return (
    <span
      className={[
        "workshop-status",
        `workshop-status-${status}`,
        showDot && "workshop-status-with-dot",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showDot && <span aria-hidden="true" className="workshop-status-dot" />}
      {workshopCopy[locale].status[status]}
    </span>
  );
}
