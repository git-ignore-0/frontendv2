import { useId } from "react";

import { MessageCircleIcon } from "@/components/icons";

export function ZaloHelpSection({
  title,
  body,
  cta,
  url,
}: {
  title: string;
  body: string;
  cta: string;
  url: string;
}) {
  const titleId = useId();
  return (
    <section className="zalo-help" aria-labelledby={titleId}>
      <div className="zalo-help-content">
        <h2 id={titleId}>{title}</h2>
        <p>{body}</p>
      </div>
      <a href={url} className="zalo-help-btn">
        <MessageCircleIcon className="zalo-help-icon" />
        {cta}
      </a>
    </section>
  );
}
