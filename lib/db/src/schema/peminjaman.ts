import { pgTable, serial, text, integer, timestamp, date, pgEnum, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { laboratoriumTable } from "./laboratorium";
import { alatTable } from "./alat";

export const statusPeminjamanEnum = pgEnum("status_peminjaman", ["menunggu", "disetujui", "ditolak", "dipinjam", "dikembalikan"]);
export const statusRuanganEnum = pgEnum("status_ruangan", ["menunggu", "disetujui", "ditolak", "selesai"]);
export const kategoriRuanganEnum = pgEnum("kategori_ruangan", ["pembelajaran", "penelitian", "pengabdian_masyarakat"]);

export const peminjamanAlatTable = pgTable("peminjaman_alat", {
  id: serial("id").primaryKey(),
  noPeminjaman: text("no_peminjaman").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  laboratoriumId: integer("laboratorium_id").notNull().references(() => laboratoriumTable.id),
  tanggalPinjam: date("tanggal_pinjam").notNull(),
  tanggalKembali: date("tanggal_kembali").notNull(),
  tanggalDikembalikan: date("tanggal_dikembalikan"),
  keperluan: text("keperluan").notNull(),
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

export const insertPeminjamanAlatSchema = createInsertSchema(peminjamanAlatTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPeminjamanRuanganSchema = createInsertSchema(peminjamanRuanganTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertPeminjamanAlat = z.infer<typeof insertPeminjamanAlatSchema>;
export type PeminjamanAlat = typeof peminjamanAlatTable.$inferSelect;
export type PeminjamanAlatItem = typeof peminjamanAlatItemTable.$inferSelect;
export type InsertPeminjamanRuangan = z.infer<typeof insertPeminjamanRuanganSchema>;
export type PeminjamanRuangan = typeof peminjamanRuanganTable.$inferSelect;
