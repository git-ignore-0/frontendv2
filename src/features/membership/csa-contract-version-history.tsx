import { useId } from "react";

import type { CSAContractVersion } from "@/features/account/types";
import {
  formatMembershipDateTime,
  formatMembershipMoney,
} from "@/features/membership/format";
import type { Locale } from "@/lib/i18n";

const copy = {
  vi: {
    history: "Lịch sử phiên bản hợp đồng",
    empty:
      "Hợp đồng cũ chưa có lịch sử phiên bản. Bạn vẫn có thể tải bản hiện tại.",
    version: "Phiên bản",
    current: "Bản hiện tại",
    reason: "Lý do",
    status: "Trạng thái",
    created: "Ngày tạo",
    paid: "Đã thanh toán",
    remaining: "Còn lại",
    locales: "Bản hợp đồng khả dụng",
    unavailable: "Chưa có bản hợp đồng khả dụng",
    active: "Đang hiệu lực",
    revoked: "Đã thu hồi",
    issued: "Phát hành hợp đồng",
    payment_confirmed: "Xác nhận thanh toán",
    membership_revoked: "Thu hồi gói CSA",
    downloadVi: "Tải hợp đồng tiếng Việt",
    downloadEn: "Tải hợp đồng tiếng Anh",
    downloading: "Đang tải…",
  },
  en: {
    history: "Contract version history",
    empty:
      "This legacy contract has no version history. You can still download the current contract.",
    version: "Version",
    current: "Current version",
    reason: "Reason",
    status: "Status",
    created: "Created",
    paid: "Paid",
    remaining: "Remaining",
    locales: "Available contract versions",
    unavailable: "No contract available",
    active: "Active",
    revoked: "Revoked",
    issued: "Contract issued",
    payment_confirmed: "Payment confirmed",
    membership_revoked: "CSA membership revoked",
    downloadVi: "Download Vietnamese contract",
    downloadEn: "Download English contract",
    downloading: "Downloading…",
  },
} as const;

export function CSAContractVersionHistory({
  versions,
  currentVersionId,
  locale,
  buttonClassName,
  downloading,
  errors,
  onDownload,
}: {
  versions: CSAContractVersion[];
  currentVersionId?: string | null;
  locale: Locale;
  buttonClassName: string;
  downloading: ReadonlySet<string>;
  errors: Record<string, string>;
  onDownload: (versionId: string, pdfLocale: "vi" | "en") => void;
}) {
  const t = copy[locale];
  const headingId = useId();
  const ordered = [...versions].sort(
    (left, right) => left.version_number - right.version_number,
  );

  return (
    <section className="csa-contract-versions" aria-labelledby={headingId}>
      <h4 id={headingId}>{t.history}</h4>
      {ordered.length === 0 ? (
        <p className="csa-contract-versions-empty">{t.empty}</p>
      ) : (
        <ol className="csa-contract-version-list">
          {ordered.map((version) => (
            <li className="csa-contract-version" key={version.id}>
              <div className="csa-contract-version-heading">
                <strong>
                  {t.version} {version.version_number}
                </strong>
                {version.id === currentVersionId ? (
                  <span className="membership-status is-active">
                    {t.current}
                  </span>
                ) : null}
              </div>
              <dl className="csa-contract-version-data">
                <div>
                  <dt>{t.reason}</dt>
                  <dd>{t[version.version_reason]}</dd>
                </div>
                <div>
                  <dt>{t.status}</dt>
                  <dd>
                    {version.contract_status === "active"
                      ? t.active
                      : t.revoked}
                  </dd>
                </div>
                <div>
                  <dt>{t.created}</dt>
                  <dd>{formatMembershipDateTime(version.created_at)}</dd>
                </div>
                {version.paid_amount !== undefined ? (
                  <div>
                    <dt>{t.paid}</dt>
                    <dd>
                      {formatMembershipMoney(version.paid_amount, locale)}
                    </dd>
                  </div>
                ) : null}
                {version.remaining_amount !== undefined ? (
                  <div>
                    <dt>{t.remaining}</dt>
                    <dd>
                      {formatMembershipMoney(version.remaining_amount, locale)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>{t.locales}</dt>
                  <dd>
                    {version.available_locales.length
                      ? version.available_locales.join(", ").toUpperCase()
                      : t.unavailable}
                  </dd>
                </div>
              </dl>
              <div className="csa-contract-version-downloads">
                {version.available_locales.map((pdfLocale) => {
                  const key = `${version.id}:${pdfLocale}`;
                  return (
                    <div
                      className="csa-contract-version-download"
                      key={pdfLocale}
                    >
                      <button
                        className={buttonClassName}
                        disabled={downloading.has(key)}
                        onClick={() => onDownload(version.id, pdfLocale)}
                        type="button"
                      >
                        {downloading.has(key)
                          ? t.downloading
                          : pdfLocale === "vi"
                            ? t.downloadVi
                            : t.downloadEn}
                      </button>
                      {errors[key] ? <p role="alert">{errors[key]}</p> : null}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
