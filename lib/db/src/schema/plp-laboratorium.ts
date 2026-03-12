import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { laboratoriumTable } from "./laboratorium";

export const plpLaboratoriumTable = pgTable("plp_laboratorium", {
  id: serial("id").primaryKey(),
  plpId: integer("plp_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  laboratoriumId: integer("laboratorium_id").notNull().references(() => laboratoriumTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlpLaboratoriumSchema = createInsertSchema(plpLaboratoriumTable).omit({ id: true, createdAt: true });
export type InsertPlpLaboratorium = z.infer<typeof insertPlpLaboratoriumSchema>;
export type PlpLaboratorium = typeof plpLaboratoriumTable.$inferSelect;
