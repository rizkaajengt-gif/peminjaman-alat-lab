import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
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

export const reminderWaTable = pgTable("reminder_wa", {
  id: serial("id").primaryKey(),
  kunci: text("kunci").notNull(),
  jenis: text("jenis").notNull(),
  peminjamanId: integer("peminjaman_id").notNull(),
  tanggalKembali: text("tanggal_kembali").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (table) => ({
  kunciUnique: unique("reminder_wa_kunci_unique").on(table.kunci),
}));

export type Notifikasi = typeof notifikasiTable.$inferSelect;
export type ReminderWa = typeof reminderWaTable.$inferSelect;
