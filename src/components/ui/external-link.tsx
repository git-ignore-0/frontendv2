import type { AnchorHTMLAttributes, ReactNode } from "react";

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  return (
    <a target="_blank" rel="noreferrer" {...props}>
      {children}
      <span aria-hidden="true">↗</span>
      <span className="sr-only"> (mở trong tab mới)</span>
    </a>
  );
}
