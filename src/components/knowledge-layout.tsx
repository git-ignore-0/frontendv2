import Link from "next/link";
import type { ReactNode } from "react";
import { ReviewNote } from "@/components/primitives";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n";

export function KnowledgeLayout({
  locale,
  toc,
  children,
}: {
  locale: Locale;
  toc: { id: string; label: string }[];
  children: ReactNode;
}) {
  const t = getDictionary(locale);
  return (
    <div className="shell section knowledge-layout">
      <aside className="toc">
        <p>{locale === "en" ? "On this page" : "Trong trang này"}</p>
        {toc.map((x) => (
          <Link href={`#${x.id}`} key={x.id}>
            {x.label}
          </Link>
        ))}
      </aside>
      <article className="knowledge-body">
        <ReviewNote>{t.review}</ReviewNote>
        {children}
      </article>
    </div>
  );
}
export function KnowledgeSection({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="knowledge-section">
      <p className="eyebrow">{index}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
