import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notifikasiTable = pgTable("notifikasi", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  pesan: text("pesan").notNull(),
  targetRole: text("target_role"),
  targetJurusanId: integer("target_jurusan_id"),
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notifikasi = typeof notifikasiTable.$inferSelect;
