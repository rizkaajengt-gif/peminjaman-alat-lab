import { Router } from "express";
import { db, usersTable, jurusanTable } from "@workspace/db";
import { eq, like, and, SQL } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth.js";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "poltekkes_salt").digest("hex");
}

router.get("/", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { role, jurusanId, search } = req.query;
    const conditions: SQL[] = [];

    if (role) conditions.push(eq(usersTable.role, role as any));
    if (jurusanId) conditions.push(eq(usersTable.jurusanId, Number(jurusanId)));

    let users = await db.query.usersTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { jurusan: true },
    });

    if (search) {
      const s = (search as string).toLowerCase();
      users = users.filter(u => u.nama.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }

    res.json(users.map(u => { const { password: _, ...rest } = u; return rest; }));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { nama, email, password, role, nim, nip, noHp, jurusanId, laboratoriumId } = req.body;
    if (!nama || !email || !password || !role) {
      res.status(400).json({ message: "Data tidak lengkap" });
      return;
    }

    const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
    if (existing) {
      res.status(400).json({ message: "Email sudah terdaftar" });
      return;
    }

    const [user] = await db.insert(usersTable).values({
      nama, email,
      password: hashPassword(password),
      role, nim: nim || null, nip: nip || null, noHp: noHp || null,
      jurusanId: jurusanId || null,
      laboratoriumId: laboratoriumId || null,
      status: "aktif",
    }).returning();

    const { password: _, ...rest } = user;
    res.status(201).json(rest);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, Number(req.params.id)),
      with: { jurusan: true },
    });
    if (!user) { res.status(404).json({ message: "User tidak ditemukan" }); return; }
    const { password: _, ...rest } = user;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { nama, email, role, nim, nip, noHp, noWa, callmebotKey, jurusanId, laboratoriumId, status } = req.body;
    const [user] = await db.update(usersTable)
      .set({ nama, email, role, nim: nim || null, nip: nip || null, noHp: noHp || null, noWa: noWa || null, callmebotKey: callmebotKey || null, jurusanId: jurusanId || null, laboratoriumId: laboratoriumId || null, status, updatedAt: new Date() })
      .where(eq(usersTable.id, Number(req.params.id)))
      .returning();
    if (!user) { res.status(404).json({ message: "User tidak ditemukan" }); return; }
    const { password: _, ...rest } = user;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, Number(req.params.id)));
    res.json({ message: "User berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/password", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      res.status(400).json({ message: "Password minimal 6 karakter" }); return;
    }
    const [user] = await db.update(usersTable)
      .set({ password: hashPassword(password), updatedAt: new Date() })
      .where(eq(usersTable.id, Number(req.params.id)))
      .returning();
    if (!user) { res.status(404).json({ message: "User tidak ditemukan" }); return; }
    res.json({ message: "Password berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/verify", requireAuth, requireRole("admin", "plp"), async (req: AuthRequest, res) => {
  try {
    const { status, catatan } = req.body;
    if (!status) { res.status(400).json({ message: "Status wajib diisi" }); return; }
    const [user] = await db.update(usersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(usersTable.id, Number(req.params.id)))
      .returning();
    if (!user) { res.status(404).json({ message: "User tidak ditemukan" }); return; }
    const { password: _, ...rest } = user;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
