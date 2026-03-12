import { pgTable, serial, text, integer, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { laboratoriumTable } from "./laboratorium";
import { bahanTable } from "./bahan";

export const statusPermintaanEnum = pgEnum("status_permintaan", ["menunggu", "disetujui", "ditolak", "disiapkan"]);

export const permintaanBahanTable = pgTable("permintaan_bahan", {
  id: serial("id").primaryKey(),
  noPermintaan: text("no_permintaan").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  laboratoriumId: integer("laboratorium_id").references(() => laboratoriumTable.id),
  tanggalDibutuhkan: date("tanggal_dibutuhkan").notNull(),
  keperluan: text("keperluan").notNull(),
  status: statusPermintaanEnum("status").notNull().default("menunggu"),
  catatanGudang: text("catatan_gudang"),
  verifikasiOleh: integer("verifikasi_oleh").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const permintaanBahanItemTable = pgTable("permintaan_bahan_item", {
  id: serial("id").primaryKey(),
  permintaanId: integer("permintaan_id").notNull().references(() => permintaanBahanTable.id),
  bahanId: integer("bahan_id").notNull().references(() => bahanTable.id),
  jumlahDiminta: integer("jumlah_diminta").notNull().default(1),
  jumlahDisetujui: integer("jumlah_disetujui"),
});

export const insertPermintaanBahanSchema = createInsertSchema(permintaanBahanTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPermintaanBahan = z.infer<typeof insertPermintaanBahanSchema>;
export type PermintaanBahan = typeof permintaanBahanTable.$inferSelect;
export type PermintaanBahanItem = typeof permintaanBahanItemTable.$inferSelect;
