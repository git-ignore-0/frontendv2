import { workshopCopy } from "@/features/workshops/copy";
import type { PublicWorkshop } from "@/lib/content-api";
import type { Locale } from "@/lib/i18n";

export function WorkshopStatus({
  status,
  locale,
}: {
  status: PublicWorkshop["status"];
  locale: Locale;
}) {
  return (
    <span className={`workshop-status workshop-status-${status}`}>
      {workshopCopy[locale].status[status]}
    </span>
  );
}
