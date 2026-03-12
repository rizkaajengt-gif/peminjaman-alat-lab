import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jurusanTable = pgTable("jurusan", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  kode: text("kode").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJurusanSchema = createInsertSchema(jurusanTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJurusan = z.infer<typeof insertJurusanSchema>;
export type Jurusan = typeof jurusanTable.$inferSelect;
