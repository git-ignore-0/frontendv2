import type { SiteContent } from "@/content/site-content";
import type { PaginationMeta } from "@/features/account/types";

type Copy = SiteContent["account"];

export function AccountPagination({
  meta,
  loading,
  onPage,
  copy,
}: {
  meta: PaginationMeta;
  loading: boolean;
  onPage: (page: number) => void;
  copy: Copy;
}) {
  const pages = Math.max(1, Math.ceil(meta.total / meta.page_size));
  if (pages <= 1) return null;
  return (
    <nav className="account-pagination" aria-label={copy.paginationLabel}>
      <button
        disabled={loading || meta.page <= 1}
        onClick={() => onPage(meta.page - 1)}
      >
        {copy.previous}
      </button>
      <span>
        {copy.page
          .replace("{page}", String(meta.page))
          .replace("{pages}", String(pages))}
      </span>
      <button
        disabled={loading || meta.page >= pages}
        onClick={() => onPage(meta.page + 1)}
      >
        {copy.next}
      </button>
    </nav>
  );
}
