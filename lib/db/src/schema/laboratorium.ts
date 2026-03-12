import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jurusanTable } from "./jurusan";

export const laboratoriumTable = pgTable("laboratorium", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  kode: text("kode").notNull().unique(),
  lokasi: text("lokasi").notNull(),
  kapasitas: integer("kapasitas").notNull().default(0),
  jurusanId: integer("jurusan_id").references(() => jurusanTable.id),
  deskripsi: text("deskripsi"),
  fasilitas: text("fasilitas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLaboratoriumSchema = createInsertSchema(laboratoriumTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLaboratorium = z.infer<typeof insertLaboratoriumSchema>;
export type Laboratorium = typeof laboratoriumTable.$inferSelect;
