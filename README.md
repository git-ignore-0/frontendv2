# Natural Farming Vietnam Public Website

Website công khai song ngữ của Natural Farming Vietnam. Ứng dụng dùng Next.js App Router, render nội dung thương hiệu/kiến thức từ source và đọc site settings, workshop đã publish từ Django backend bằng server-side fetch.

## Chức năng hiện tại

- Trang Home, About, Plants, Animals, Privacy Policy và Terms & Conditions bằng tiếng Việt/Anh.
- Danh sách, chi tiết và preview workshop; hỗ trợ fallback bản dịch, registration URL, Event JSON-LD và sitemap.
- Contact, Store, Forum, Facebook và YouTube được điều khiển bởi public site settings từ backend.
- Signed endpoint `POST /api/revalidate` để backend xóa cache theo tag sau khi publish.
- Không có login/account, ecommerce, cart, checkout hoặc browser-to-Django API proxy.

Canonical URL hiện dùng locale ở cuối đường dẫn, trừ Home:

```text
/en
/about/vi
/workshops/en
/workshops/<slug>/vi
```

Các URL locale-prefix cũ như `/vi/about` chỉ còn là redirect tương thích.

## Công nghệ

- Node.js `>=18.18.0`
- pnpm `9.15.9`
- Next.js `15.5.20`, React `19`, TypeScript strict
- Tailwind CSS 3 và global CSS
- Vitest, Testing Library, Playwright

## Chạy local

Backend public API mặc định chạy ở `http://127.0.0.1:8000`.

```bash
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

Biến môi trường:

- `CONTENT_API_ORIGIN`: origin Django, không kèm path; bắt buộc ở production.
- `CONTENT_REVALIDATE_SECRET`: secret HMAC tối thiểu 32 ký tự, phải khớp `CONTENT_FRONTEND_REVALIDATE_SECRET` của backend.

## Data flow

`src/lib/content-api.ts` là module server-only gọi:

```text
GET /api/v1/public/site-settings
GET /api/v1/public/workshops
GET /api/v1/public/workshops/<slug>
GET /api/v1/public/workshops/preview/<token>
```

Ở production, response được cache theo tags `site-settings`, `workshops`, `workshop:<slug>`. Preview luôn `no-store`. Khi API lỗi, site settings/workshop fail closed thay vì hiển thị dữ liệu fallback không còn hợp lệ.

## Kiểm tra

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

E2E cần backend local ở `127.0.0.1:8000`:

```bash
pnpm test:e2e
```

## Deploy

`next.config.ts` dùng `output: "standalone"`, vì vậy production cần Node server; đây không phải static export. `prepare-cpanel-deploy.sh` build và đóng gói `.next/standalone`, `.next/static` và `public/` cho cPanel Passenger. Các bundle đã sinh trong `cpanel-deploy/` không phải source of truth và phải được tạo lại từ source trước khi deploy.

Xem chi tiết tại [`../docs/public-frontend.md`](../docs/public-frontend.md).
