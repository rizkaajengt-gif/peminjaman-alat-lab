import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jurusanTable } from "./jurusan";
import { laboratoriumTable } from "./laboratorium";

export const roleEnum = pgEnum("role", ["admin", "mahasiswa", "plp", "gudang", "dosen"]);
export const userStatusEnum = pgEnum("user_status", ["menunggu", "aktif", "nonaktif", "ditolak"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("mahasiswa"),
  nim: text("nim"),
  nip: text("nip"),
  noHp: text("no_hp"),
  jurusanId: integer("jurusan_id").references(() => jurusanTable.id),
  laboratoriumId: integer("laboratorium_id").references(() => laboratoriumTable.id),
  status: userStatusEnum("status").notNull().default("menunggu"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
