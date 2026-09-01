import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "poltekkes_salt").digest("hex");
}

export async function seedDefaultAdmin() {
  try {
    // Ensure session table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);

    // Auto-migrate: add any new columns that may not exist yet (safe for production)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS tanda_tangan text`);
    await db.execute(sql`ALTER TABLE peminjaman_alat ADD COLUMN IF NOT EXISTS jam_pinjam text`);
    await db.execute(sql`ALTER TABLE peminjaman_alat ADD COLUMN IF NOT EXISTS jam_kembali text`);
    await db.execute(sql`ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'kepala_laboratorium'`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE "jenis_perpanjangan" AS ENUM ('alat', 'phantom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE "status_perpanjangan" AS ENUM ('menunggu', 'disetujui', 'ditolak'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "perpanjangan_peminjaman" (
        "id" serial PRIMARY KEY,
        "jenis" "jenis_perpanjangan" NOT NULL,
        "peminjaman_alat_id" integer REFERENCES "peminjaman_alat"("id"),
        "peminjaman_phantom_id" integer REFERENCES "peminjaman_phantom"("id"),
        "pemohon_id" integer NOT NULL REFERENCES "users"("id"),
        "tanggal_kembali_lama" date NOT NULL,
        "tanggal_kembali_baru" date NOT NULL,
        "alasan" text NOT NULL,
        "status" "status_perpanjangan" NOT NULL DEFAULT 'menunggu',
        "disetujui_oleh" integer REFERENCES "users"("id"),
        "catatan" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Ensure default admin exists
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, "admin@poltekkes-tasikmalaya.ac.id"))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(usersTable).values({
        nama: "Administrator",
        email: "admin@poltekkes-tasikmalaya.ac.id",
        password: hashPassword("Admin123!"),
        role: "admin",
        status: "aktif",
      });
      console.log("Default admin user created.");
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
}
