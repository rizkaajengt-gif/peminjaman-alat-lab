import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { laboratoriumTable } from "./laboratorium";
import { bahanTable } from "./bahan";
import { usersTable } from "./users";

export const transferBahanPlpTable = pgTable("transfer_bahan_plp", {
  id: serial("id").primaryKey(),
  bahanId: integer("bahan_id").notNull().references(() => bahanTable.id),
  laboratoriumId: integer("laboratorium_id").notNull().references(() => laboratoriumTable.id),
  jumlah: integer("jumlah").notNull(),
  status: text("status").notNull().default("menunggu"),
  catatanPlp: text("catatan_plp"),
  catatanGudang: text("catatan_gudang"),
  dimintaOleh: integer("diminta_oleh").references(() => usersTable.id),
  disetujuiOleh: integer("disetujui_oleh").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TransferBahanPlp = typeof transferBahanPlpTable.$inferSelect;
