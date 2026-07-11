import Link from "next/link";
export default function NotFound() {
  return (
    <main className="section">
      <div className="shell">
        <p className="eyebrow">404</p>
        <h1 className="section-heading">This path has not taken root.</h1>
        <p className="lede">Trang này chưa tồn tại.</p>
        <Link className="text-link" href="/en">
          Return home →
        </Link>
      </div>
    </main>
  );
}
