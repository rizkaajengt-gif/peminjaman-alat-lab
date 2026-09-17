import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
export * from "./alat";
export * from "./bahan";
export * from "./jurusan";
export * from "./konten";
export * from "./laboratorium";
export * from "./notifikasi";
export * from "./peminjaman";
export * from "./permintaan";
export * from "./plp-laboratorium";
export * from "./relations";
export * from "./transfer-bahan";
export * from "./users";
