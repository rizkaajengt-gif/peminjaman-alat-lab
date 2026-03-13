import { pgTable, serial, text, integer, timestamp, date, pgEnum, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { laboratoriumTable } from "./laboratorium";
import { alatTable } from "./alat";

export const statusPeminjamanEnum = pgEnum("status_peminjaman", ["menunggu", "disetujui", "ditolak", "dipinjam", "dikembalikan"]);
export const statusRuanganEnum = pgEnum("status_ruangan", ["menunggu", "disetujui", "ditolak", "selesai"]);
export const kategoriRuanganEnum = pgEnum("kategori_ruangan", ["pembelajaran", "penelitian", "pengabdian_masyarakat", "sewa_eksternal"]);
export const kategoriPeminjamanEnum = pgEnum("kategori_peminjaman", ["pembelajaran", "penelitian", "pengabdian_masyarakat", "sewa_eksternal"]);

export const peminjamanAlatTable = pgTable("peminjaman_alat", {
  id: serial("id").primaryKey(),
  noPeminjaman: text("no_peminjaman").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  laboratoriumId: integer("laboratorium_id").notNull().references(() => laboratoriumTable.id),
  tanggalPinjam: date("tanggal_pinjam").notNull(),
  jamPinjam: text("jam_pinjam"),
  tanggalKembali: date("tanggal_kembali").notNull(),
  jamKembali: text("jam_kembali"),
  tanggalDikembalikan: date("tanggal_dikembalikan"),
  keperluan: text("keperluan").notNull(),
  kategori: kategoriPeminjamanEnum("kategori").notNull().default("pembelajaran"),
  status: statusPeminjamanEnum("status").notNull().default("menunggu"),
  catatanPlp: text("catatan_plp"),
  verifikasiOleh: integer("verifikasi_oleh").references(() => usersTable.id),
  requestKembali: text("request_kembali"),
  kondisiKembali: text("kondisi_kembali"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const peminjamanAlatItemTable = pgTable("peminjaman_alat_item", {
  id: serial("id").primaryKey(),
  peminjamanId: integer("peminjaman_id").notNull().references(() => peminjamanAlatTable.id),
  alatId: integer("alat_id").notNull().references(() => alatTable.id),
  jumlah: integer("jumlah").notNull().default(1),
});

export const peminjamanRuanganTable = pgTable("peminjaman_ruangan", {
  id: serial("id").primaryKey(),
  noPeminjaman: text("no_peminjaman").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  laboratoriumId: integer("laboratorium_id").notNull().references(() => laboratoriumTable.id),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalSelesai: date("tanggal_selesai").notNull(),
  waktuMulai: time("waktu_mulai").notNull(),
  waktuSelesai: time("waktu_selesai").notNull(),
  keperluan: text("keperluan").notNull(),
  kategori: kategoriRuanganEnum("kategori").notNull().default("pembelajaran"),
  judulKegiatan: text("judul_kegiatan"),
  jumlahPeserta: integer("jumlah_peserta").notNull().default(1),
  status: statusRuanganEnum("status").notNull().default("menunggu"),
  catatanPlp: text("catatan_plp"),
  verifikasiOleh: integer("verifikasi_oleh").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Phantom ──────────────────────────────────────────────────────────────────

export const phantomTable = pgTable("phantom", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  kode: text("kode").notNull().unique(),
  deskripsi: text("deskripsi"),
  kondisi: text("kondisi").notNull().default("baik"),
  stok: integer("stok").notNull().default(0),
  stokTersedia: integer("stok_tersedia").notNull().default(0),
  satuan: text("satuan").notNull().default("unit"),
  laboratoriumId: integer("laboratorium_id").references(() => laboratoriumTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const peminjamanPhantomTable = pgTable("peminjaman_phantom", {
  id: serial("id").primaryKey(),
  noPeminjaman: text("no_peminjaman").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  laboratoriumId: integer("laboratorium_id").references(() => laboratoriumTable.id),
  tanggalPinjam: date("tanggal_pinjam").notNull(),
  jamPinjam: text("jam_pinjam"),
  tanggalKembali: date("tanggal_kembali").notNull(),
  jamKembali: text("jam_kembali"),
  tanggalDikembalikan: date("tanggal_dikembalikan"),
  keperluan: text("keperluan").notNull(),
  kategori: kategoriPeminjamanEnum("kategori").notNull().default("pembelajaran"),
  status: statusPeminjamanEnum("status").notNull().default("menunggu"),
  catatanPlp: text("catatan_plp"),
  verifikasiOleh: integer("verifikasi_oleh").references(() => usersTable.id),
  requestKembali: text("request_kembali"),
  kondisiKembali: text("kondisi_kembali"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const peminjamanPhantomItemTable = pgTable("peminjaman_phantom_item", {
  id: serial("id").primaryKey(),
  peminjamanId: integer("peminjaman_id").notNull().references(() => peminjamanPhantomTable.id),
  phantomId: integer("phantom_id").notNull().references(() => phantomTable.id),
  jumlah: integer("jumlah").notNull().default(1),
});

// ─── Schemas & Types ──────────────────────────────────────────────────────────

export const insertPeminjamanAlatSchema = createInsertSchema(peminjamanAlatTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPeminjamanRuanganSchema = createInsertSchema(peminjamanRuanganTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPhantomSchema = createInsertSchema(phantomTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPeminjamanPhantomSchema = createInsertSchema(peminjamanPhantomTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertPeminjamanAlat = z.infer<typeof insertPeminjamanAlatSchema>;
export type PeminjamanAlat = typeof peminjamanAlatTable.$inferSelect;
export type PeminjamanAlatItem = typeof peminjamanAlatItemTable.$inferSelect;
export type InsertPeminjamanRuangan = z.infer<typeof insertPeminjamanRuanganSchema>;
export type PeminjamanRuangan = typeof peminjamanRuanganTable.$inferSelect;
export type Phantom = typeof phantomTable.$inferSelect;
export type InsertPhantom = z.infer<typeof insertPhantomSchema>;
export type PeminjamanPhantom = typeof peminjamanPhantomTable.$inferSelect;
export type PeminjamanPhantomItem = typeof peminjamanPhantomItemTable.$inferSelect;
