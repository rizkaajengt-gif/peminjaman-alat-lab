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
