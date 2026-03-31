# SIPELAB - Sistem Informasi Peminjaman Laboratorium

## Overview

Aplikasi web SIPELAB Poltekkes Kemenkes Tasikmalaya. Sistem manajemen laboratorium terpadu multi-jurusan yang mendukung 5 peran pengguna: peminjaman alat, permintaan bahan habis pakai (ke PLP atau Gudang), pemesanan ruangan, penugasan PLP ke laboratorium, inventaris, dan laporan lengkap.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS (artifacts/lab-peminjaman)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Express Session (cookie-based, sha256 password hashing)

## Structure

```text
artifacts/
  api-server/         # Express API backend
  lab-peminjaman/     # React+Vite frontend (preview path: /)
lib/
  api-spec/           # OpenAPI spec + Orval codegen
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod schemas
  db/                 # Drizzle ORM schema + DB connection
```

## User Roles

1. **Admin** - Full access: users, labs, jurusan, PLP assignment, inventory, reports
2. **Mahasiswa** - Student: borrow equipment/rooms, request materials (to PLP or Gudang)
3. **PLP** (Laboran) - Verify borrowing requests, manage assigned lab inventory, fulfill material requests directed to them
4. **Gudang** - Manage material stock, verify gudang-directed material requests
5. **Dosen** - Same as mahasiswa for borrowing/requesting

## Demo Accounts

- Admin: `admin` / `Admin123!` (or `admin@poltekkes-tasikmalaya.ac.id`)
- Mahasiswa: `mahasiswa` / `Password123!`
- PLP: `plp` / `Password123!`
- Gudang: `gudang` / `Password123!`
- Dosen: `dosen` / `Password123!`

## Frontend Pages

### Admin
- `/admin/jurusan` - CRUD manajemen jurusan/prodi
- `/admin/users` - Manajemen pengguna
- `/admin/laboratorium` - Manajemen laboratorium
- `/admin/plp-penugasan` - Assign PLP ke laboratorium (via plp_laboratorium junction table)
- `/admin/inventaris` - Inventaris alat & bahan (with PIC/penanggungjawab)
- `/admin/laporan` - Statistik & laporan dengan export CSV

### Mahasiswa/Dosen
- `/mahasiswa/peminjaman` - Form peminjaman alat
- `/mahasiswa/ruangan` - Form peminjaman ruangan
- `/mahasiswa/phantom` - Form peminjaman phantom (also accessible by PLP)
- `/mahasiswa/permintaan` - Permintaan bahan (tujuan: plp atau gudang)
- `/mahasiswa/riwayat` - Riwayat transaksi (alat, phantom, ruangan, bahan) dengan tombol cetak

### PLP
- `/plp/verifikasi` - Verifikasi semua pengajuan (alat, phantom, ruangan, bahan, mahasiswa)
- `/plp/pengembalian` - Riwayat & verifikasi pengembalian (alat, phantom, ruangan, bahan)
- `/plp/inventaris` - Inventaris alat, bahan, phantom

### Gudang
- `/gudang/manajemen` - Stok bahan & verifikasi permintaan bahan

### Admin
- `/admin/inventaris` - Inventaris alat, bahan, phantom

### Print Views (no sidebar)
- `/print/permintaan-bahan/:id` - Surat permintaan bahan habis pakai (printable)
- `/print/peminjaman-alat/:id` - Surat peminjaman alat laboratorium (printable)
- `/print/peminjaman-phantom/:id` - Surat peminjaman phantom laboratorium (printable)

## Key API Endpoints

- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Current user
- POST /api/auth/register - Self-registration
- GET/POST /api/users - User management (supports ?role= filter)
- GET/POST /api/jurusan - Department management
- GET/POST /api/laboratorium - Lab management
- GET/POST /api/alat - Equipment (includes penanggungjawab PIC)
- GET/POST /api/bahan - Material (includes penanggungjawab PIC)
- GET/POST /api/plp-laboratorium - PLP-lab assignment management
- GET /api/plp-laboratorium/my-labs - PLP's assigned labs
- GET/POST /api/peminjaman-alat - Equipment borrowing
- PUT /api/peminjaman-alat/:id/status - Approve/reject borrowing
- GET/POST /api/peminjaman-ruangan - Room booking
- PUT /api/peminjaman-ruangan/:id/status - Approve/reject room booking
- GET/POST /api/permintaan-bahan - Material requests (tujuan: plp|gudang, plpId for plp)
- PUT /api/permintaan-bahan/:id/status - Approve/reject material request
- GET /api/export/alat - Export alat to CSV
- GET /api/export/bahan - Export bahan to CSV
- GET /api/export/users - Export users to CSV
- GET /api/export/peminjaman-alat - Export laporan peminjaman alat to CSV
- GET /api/export/permintaan-bahan - Export laporan permintaan bahan to CSV
- GET /api/export/alat/template - Download import template alat CSV
- GET /api/export/bahan/template - Download import template bahan CSV
- GET /api/laporan/statistik - Dashboard statistics
- GET /api/laporan/peminjaman - Borrowing reports

## Database Tables

- `jurusan` - Academic departments
- `laboratorium` - Laboratories
- `users` - Users with role enum (admin/mahasiswa/plp/gudang/dosen)
- `alat` - Equipment/tools (with penanggungjawabId FK to users)
- `bahan` - Materials/consumables (with penanggungjawabId FK to users)
- `plp_laboratorium` - Junction table: PLP assignments to labs
- `peminjaman_alat` - Equipment borrowing transactions
- `peminjaman_alat_item` - Items per borrowing
- `peminjaman_ruangan` - Room booking transactions
- `permintaan_bahan` - Material requests (tujuan: plp|gudang, plpId, catatan)
- `permintaan_bahan_item` - Items per request
- `phantom` - Phantom inventory (anatomy models, simulators, etc.)
- `peminjaman_phantom` - Phantom borrowing transactions
- `peminjaman_phantom_item` - Items per phantom borrowing
- `berita` - News posts
- `galeri` - Photo/video gallery
- `dokumen` - Lab documents

## Recent Changes (2026-03-31)

### New Features Added
1. **Grafik Tren Peminjaman di Dashboard Admin** — Area chart Recharts showing monthly trends (Alat/Ruangan/Bahan) for the current year. Data fetched from `/api/laporan/peminjaman?periode=bulanan`. Includes link to full Laporan page.

2. **Sistem Blokir/Blacklist Pengguna** — Admin can block users from logging in:
   - New DB columns: `is_blocked` (boolean) and `catatan_blokir` (text) on `users` table
   - New API: `PUT /api/users/:id/blokir` (requires admin role)
   - Login check: blocked users get a descriptive error message with the reason
   - Admin Users page: shows "Diblokir" badge, dropdown items "Blokir Akun" (with reason dialog) and "Cabut Blokir"

3. **Indikator Keterlambatan Pengembalian di Dashboard** — New `peminjamaTerlambat` field in `/api/laporan/statistik` response counts active borrowings (alat + phantom) past their return date:
   - Admin Dashboard: shows red alert card with count and link to pengembalian
   - PLP Dashboard: added "Terlambat Dikembalikan" stat card + red alert card

4. **First-Login Forced Profile Setup Flow** — When accounts are created by admin or imported via CSV, `must_setup_profile = true` is set. On first login, users are redirected to `/setup-profil` (a 3-step wizard):
   - Step 1: Complete profile (nama, noHp, noWa)
   - Step 2: Change password from default to a new secure password
   - Step 3: Draw digital signature (tanda tangan) using SignaturePad
   - `PUT /api/auth/me/setup` endpoint: validates all fields, updates DB, sets `mustSetupProfile = false`
   - `ProtectedRoute` in App.tsx intercepts and redirects to `/setup-profil` if flag is true
   - `SetupProfilRoute` redirects to dashboard if flag is already false
   - User type in api-client updated to include: `mustSetupProfile`, `isBlocked`, `catatanBlokir`, `noWa`, `callmebotKey`, `tandaTangan`
   - DB column: `must_setup_profile boolean NOT NULL DEFAULT false` on `users` table
