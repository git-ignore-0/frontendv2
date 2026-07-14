import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Arrow } from "@/components/icons";

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  alt,
  position = "center",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  alt: string;
  position?: string;
}) {
  return (
    <section className="page-hero">
      <div className="shell page-hero-grid">
        <div className="page-hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{intro}</p>
        </div>
        <div className="page-hero-image">
          <Image
            src={image}
            alt={alt}
            fill
            priority
            sizes="(min-width: 900px) 58vw, 100vw"
            style={{ objectPosition: position }}
          />
        </div>
      </div>
    </section>
  );
}

export function TextLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className = "text-link";
  return external ? (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
      <Arrow external />
    </a>
  ) : (
    <Link className={className} href={href}>
      {children}
      <Arrow />
    </Link>
  );
}

export function TableWrap({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

export function LegacyFigure({
  label,
  caption,
  children,
}: {
  label: string;
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="legacy-figure">
      <span>{label}</span>
      {children}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
