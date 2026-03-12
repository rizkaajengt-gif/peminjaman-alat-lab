import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "poltekkes_salt").digest("hex");
}

export async function seedDefaultAdmin() {
  try {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, "admin@poltekkes-tasikmalaya.ac.id")).limit(1);
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
