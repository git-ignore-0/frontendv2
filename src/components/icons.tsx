export function Arrow({ external = false }: { external?: boolean }) {
  return (
    <span aria-hidden="true" className="arrow">
      {external ? "↗" : "→"}
    </span>
  );
}
