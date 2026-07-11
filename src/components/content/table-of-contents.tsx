type TocItem = { id: string; label: string };

export function TableOfContents({ items }: { items: TocItem[] }) {
  return (
    <>
      <details className="border-forest/15 border-y bg-warm px-4 py-2 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center font-bold text-forest">
          Mục lục trang
        </summary>
        <nav aria-label="Mục lục" className="grid gap-1 pb-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex min-h-11 items-center text-sm text-charcoal hover:text-terra"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </details>
      <nav
        aria-label="Mục lục"
        className="border-forest/20 sticky top-[calc(var(--header-height)+2rem)] hidden self-start border-l pl-5 lg:block"
      >
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-soil">
          Trong trang này
        </p>
        <ul className="grid gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-muted flex min-h-10 items-center text-sm transition-colors hover:text-terra"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
