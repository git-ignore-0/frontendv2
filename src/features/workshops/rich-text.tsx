import Image from "next/image";
import type { ReactNode } from "react";

type Node = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
  content?: Node[];
};

function children(node: Node, key: string): ReactNode {
  return node.content?.map((item, index) =>
    renderNode(item, `${key}-${index}`),
  );
}

function renderNode(node: Node, key: string): ReactNode {
  if (node.type === "text") {
    let value: ReactNode = node.text || "";
    for (const mark of node.marks || []) {
      if (mark.type === "bold")
        value = <strong key={`${key}-b`}>{value}</strong>;
      if (mark.type === "italic") value = <em key={`${key}-i`}>{value}</em>;
      if (mark.type === "link") {
        const href = String(mark.attrs?.href || "#");
        const external = href.startsWith("https");
        value = (
          <a
            key={`${key}-a`}
            href={href}
            target={(external && "_blank") || undefined}
            rel="noreferrer"
          >
            {value}
          </a>
        );
      }
    }
    return <span key={key}>{value}</span>;
  }
  if (node.type === "paragraph") return <p key={key}>{children(node, key)}</p>;
  if (node.type === "heading") {
    const level = Number(node.attrs?.level || 2);
    if (level === 3) return <h3 key={key}>{children(node, key)}</h3>;
    if (level === 4) return <h4 key={key}>{children(node, key)}</h4>;
    return <h2 key={key}>{children(node, key)}</h2>;
  }
  if (node.type === "bulletList")
    return <ul key={key}>{children(node, key)}</ul>;
  if (node.type === "orderedList")
    return <ol key={key}>{children(node, key)}</ol>;
  if (node.type === "listItem") return <li key={key}>{children(node, key)}</li>;
  if (node.type === "blockquote")
    return <blockquote key={key}>{children(node, key)}</blockquote>;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "image") {
    const src = String(node.attrs?.src || "");
    const alt = String(node.attrs?.alt || "");
    return src ? (
      <Image
        unoptimized
        className="workshop-inline-image"
        key={key}
        src={src}
        alt={alt}
        width={1200}
        height={675}
      />
    ) : null;
  }
  return <>{children(node, key)}</>;
}

export function RichText({ document }: { document?: Record<string, unknown> }) {
  return (
    <div className="workshop-prose">
      {renderNode((document || {}) as Node, "root")}
    </div>
  );
}
