export function ContentReviewNote({ children }: { children: React.ReactNode }) {
  return (
    <aside className="bg-terra/5 border-l-2 border-terra px-4 py-3 text-sm leading-6 text-soil">
      <strong className="font-extrabold">Nội dung chờ duyệt:</strong> {children}
    </aside>
  );
}
