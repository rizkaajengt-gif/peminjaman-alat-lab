import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { laboratoriumTable } from "./laboratorium";

export const bahanTable = pgTable("bahan", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  kode: text("kode").notNull().unique(),
  deskripsi: text("deskripsi"),
  stok: integer("stok").notNull().default(0),
  stokMinimal: integer("stok_minimal").notNull().default(0),
  satuan: text("satuan").notNull().default("unit"),
  laboratoriumId: integer("laboratorium_id").notNull().references(() => laboratoriumTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBahanSchema = createInsertSchema(bahanTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBahan = z.infer<typeof insertBahanSchema>;
export type Bahan = typeof bahanTable.$inferSelect;
