"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/i18n";

function GiftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 10h16v10H4zM3 6h18v4H3zM12 6v14M12 6H8.8a2.3 2.3 0 1 1 2.3-2.3L12 6Zm0 0h3.2a2.3 2.3 0 1 0-2.3-2.3L12 6Z" />
    </svg>
  );
}

export function ReferralFloatingAction({
  label,
  locale,
}: {
  label: string;
  locale: Locale;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/account/")) return null;

  return (
    <Link
      aria-label={label}
      className="referral-floating-action"
      href={`/account/${locale}/referral`}
    >
      <span className="referral-floating-action-icon">
        <GiftIcon />
      </span>
      <span>{label}</span>
    </Link>
  );
}
