import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { laboratoriumTable } from "./laboratorium";

export const kondisiEnum = pgEnum("kondisi_alat", ["baik", "rusak_ringan", "rusak_berat"]);

export const alatTable = pgTable("alat", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  kode: text("kode").notNull().unique(),
  deskripsi: text("deskripsi"),
  kondisi: kondisiEnum("kondisi").notNull().default("baik"),
  stok: integer("stok").notNull().default(0),
  stokTersedia: integer("stok_tersedia").notNull().default(0),
  satuan: text("satuan").notNull().default("unit"),
  laboratoriumId: integer("laboratorium_id").notNull().references(() => laboratoriumTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAlatSchema = createInsertSchema(alatTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlat = z.infer<typeof insertAlatSchema>;
export type Alat = typeof alatTable.$inferSelect;
