import Link from "next/link";
import { getSiteContent } from "@/content/site-content";
export default function NotFound() {
  const content = getSiteContent("en").common.notFound;
  return (
    <main className="section">
      <div className="shell">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1 className="section-heading">{content.title}</h1>
        <p className="lede">{content.body}</p>
        <Link className="text-link" href="/en">
          {content.cta} →
        </Link>
      </div>
    </main>
  );
}
