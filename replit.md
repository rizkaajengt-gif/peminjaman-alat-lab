# Peminjaman Lab Poltekkes Tasikmalaya

## Overview

Aplikasi web Peminjaman Laboratorium Terpadu Poltekkes Kemenkes Tasikmalaya. Sistem berbasis web untuk mengelola peminjaman alat, permintaan bahan habis pakai, dan pemesanan ruangan laboratorium secara lintas unit/jurusan.

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

1. **Admin** - Full access: users, labs, departments, reports, news, gallery
2. **Mahasiswa** - Student: borrow equipment/rooms, request materials
3. **PLP** (Laboran) - Verify borrowing requests, manage lab inventory, verify student registrations
4. **Gudang** - Manage material stock, verify material requests
5. **Dosen** - News and gallery creation

## Demo Accounts

- Admin: `admin@poltekkes-tasikmalaya.ac.id` / `Admin123!`
- Mahasiswa: `mahasiswa@poltekkes-tasikmalaya.ac.id` / `Password123!`
- PLP: `plp@poltekkes-tasikmalaya.ac.id` / `Password123!`
- Gudang: `gudang@poltekkes-tasikmalaya.ac.id` / `Password123!`
- Dosen: `dosen@poltekkes-tasikmalaya.ac.id` / `Password123!`

## Key API Endpoints

- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Current user
- POST /api/auth/register - Self-registration
- GET/POST /api/users - User management
- GET/POST /api/jurusan - Department management
- GET/POST /api/laboratorium - Lab management
- GET/POST /api/alat - Equipment management
- GET/POST /api/bahan - Material management
- GET/POST /api/peminjaman-alat - Equipment borrowing
- PUT /api/peminjaman-alat/:id/status - Approve/reject borrowing
- GET/POST /api/peminjaman-ruangan - Room booking
- PUT /api/peminjaman-ruangan/:id/status - Approve/reject room booking
- GET/POST /api/permintaan-bahan - Material requests
- PUT /api/permintaan-bahan/:id/status - Approve/reject material request
- GET/POST /api/berita - News management
- GET/POST /api/galeri - Gallery management
- GET/POST /api/dokumen - Documents management
- GET /api/laporan/statistik - Dashboard statistics
- GET /api/laporan/peminjaman - Borrowing reports

## Database Tables

- `jurusan` - Academic departments
- `laboratorium` - Laboratories
- `users` - Users with role enum (admin/mahasiswa/plp/gudang/dosen)
- `alat` - Equipment/tools
- `bahan` - Materials/consumables
- `peminjaman_alat` - Equipment borrowing transactions
- `peminjaman_alat_item` - Items per borrowing
- `peminjaman_ruangan` - Room booking transactions
- `permintaan_bahan` - Material request transactions
- `permintaan_bahan_item` - Items per request
- `berita` - News posts
- `galeri` - Photo/video gallery
- `dokumen` - Lab documents
