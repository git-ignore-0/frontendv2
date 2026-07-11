import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "./external-link";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  external?: boolean;
  variant?: "primary" | "secondary" | "light";
  className?: string;
};

const variants = {
  primary: "bg-forest text-warm hover:bg-forest-deep",
  secondary: "border border-forest/25 text-forest hover:border-forest",
  light: "bg-warm text-forest hover:bg-rice",
};

export function ButtonLink({
  href,
  children,
  external = false,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  const styles = `inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold transition-colors duration-200 ${variants[variant]} ${className}`;

  if (external) {
    return (
      <ExternalLink href={href} className={styles}>
        {children}
      </ExternalLink>
    );
  }

  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  );
}
