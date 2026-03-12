import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { laboratoriumTable } from "./laboratorium";

export const tipeGaleriEnum = pgEnum("tipe_galeri", ["foto", "video"]);

export const beritaTable = pgTable("berita", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  konten: text("konten").notNull(),
  kategori: text("kategori"),
  thumbnail: text("thumbnail"),
  penulisId: integer("penulis_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const galeriTable = pgTable("galeri", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  deskripsi: text("deskripsi"),
  tipe: tipeGaleriEnum("tipe").notNull().default("foto"),
  url: text("url").notNull(),
  uploaderId: integer("uploader_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dokumenTable = pgTable("dokumen", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi"),
  url: text("url").notNull(),
  tipe: text("tipe"),
  laboratoriumId: integer("laboratorium_id").references(() => laboratoriumTable.id),
  uploaderId: integer("uploader_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBeritaSchema = createInsertSchema(beritaTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGaleriSchema = createInsertSchema(galeriTable).omit({ id: true, createdAt: true });
export const insertDokumenSchema = createInsertSchema(dokumenTable).omit({ id: true, createdAt: true });

export type InsertBerita = z.infer<typeof insertBeritaSchema>;
export type Berita = typeof beritaTable.$inferSelect;
export type InsertGaleri = z.infer<typeof insertGaleriSchema>;
export type Galeri = typeof galeriTable.$inferSelect;
export type InsertDokumen = z.infer<typeof insertDokumenSchema>;
export type Dokumen = typeof dokumenTable.$inferSelect;
