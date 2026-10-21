import type { ReactNode } from "react";

const iconPaths: Record<string, ReactNode> = {
  gift: (
    <>
      <rect x="3" y="9" width="18" height="12" rx="1" />
      <path d="M12 9v12M2 9h20V6H2v3Zm10-3c-2-7-9-5-5-1 1 1 5 1 5 1Zm0 0c2-7 9-5 5-1 1 1-5 1-5 1Z" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="m8 11 8-5m-8 8 8 4" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4c-7 .5-13 2-15 9-1.2 4 1.2 7 5 7 7 0 10-8 10-16Z" />
      <path d="M4 21c3-7 7-10 13-13" />
    </>
  ),
  bag: (
    <>
      <path d="M4 8h16l-1 13H5L4 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-5 3-7 8-7s8 2 8 7" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <path d="m5 12 14 0m-6-6 6 6-6 6" />,
  back: <path d="m19 12-14 0m6-6-6 6 6 6" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  filter: <path d="M4 7h16M7 12h10M10 17h4" />,
  check: <path d="m4 12 5 5L20 6" />,
  pin: (
    <>
      <path d="M12 22s7-6.5 7-13a7 7 0 0 0-14 0c0 6.5 7 13 7 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  truck: (
    <>
      <path d="M3 7h11v11H3V7Zm11 4h4l3 3v4h-7v-7Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  box: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z" />
      <path d="M3 7l9 5 9-5M12 12v9" />
    </>
  ),
  star: (
    <path d="m12 2 3.3 6.7 7.4 1.1-5.4 5.3 1.3 7.4-6.6-3.5-6.6 3.5 1.3-7.4-5.4-5.3 7.4-1.1L12 2Z" />
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  chev: <path d="m9 18 6-6-6-6" />,
  heart: (
    <path d="M20.5 8.5c0 5-8.5 11.5-8.5 11.5S3.5 13.5 3.5 8.5a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2Z" />
  ),
  edit: <path d="m4 20 4-.8L20 7a3 3 0 0 0-4-4L4 15l-.5 5Z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v1" />
    </>
  ),
  alert: (
    <>
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v5m0 4v.5" />
    </>
  ),
};

export function Icon({ name, size = 19 }: { name: string; size?: number }) {
  return (
    <svg
      className="ico"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {iconPaths[name] || iconPaths.leaf}
    </svg>
  );
}
